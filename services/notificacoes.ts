import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { AndroidImportance } from 'expo-notifications';
import { Alert, Platform } from 'react-native';

import {
  collection,
  addDoc,
  getDocs,
  doc,
  getDoc,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';

import { auth, db } from './firebase';
import type { Publico } from '../types/firestore';
import { router } from 'expo-router';

const PERMISSION_DECLINED_KEY = '@ip-providencia/push-notifications-declined';
const ANDROID_CHANNEL_ID = 'default';

let registrationInProgress: Promise<void> | null = null;

export type PushAudience = Publico;

export interface SendNotificationInput {
  titulo: string;
  mensagem: string;
  publico: PushAudience;
  alvoId?: string | null;
  screen?: 'avisos' | 'eventos' | 'inicio';
  alvoRouteId?: string | null;
}

export async function getNotificationRecipientCount(
  publico: PushAudience,
  alvoId?: string | null,
) {
  const uids = await getNotificationRecipientUids(publico, alvoId);
  const tokenSnapshots = await getDocs(query(collection(db, 'pushTokens'), where('ativo', '==', true)));
  return new Set(
    tokenSnapshots.docs
      .filter((snapshot) => uids.has(snapshot.data().uid))
      .map((snapshot) => snapshot.data().uid),
  ).size;
}

async function getNotificationRecipientUids(
  publico: PushAudience,
  alvoId?: string | null,
) {
  let userSnapshots;
  if (publico === 'todos') {
    userSnapshots = await getDocs(query(collection(db, 'users'), where('ativo', '==', true)));
  } else if (publico === 'membros') {
    userSnapshots = await getDocs(query(collection(db, 'users'), where('perfil', '==', 'MEMBRO'), where('ativo', '==', true)));
  } else if (publico === 'ministerio') {
    if (!alvoId) throw new Error('Informe o ministério.');
    userSnapshots = await getDocs(query(collection(db, 'users'), where('ativo', '==', true), where('ministerios', 'array-contains', alvoId)));
  } else {
    if (!alvoId) throw new Error('Informe o Pequeno Grupo.');
    userSnapshots = await getDocs(query(collection(db, 'users'), where('ativo', '==', true), where('pequenoGrupoId', '==', alvoId)));
  }
  return new Set(userSnapshots.docs.map((snapshot) => snapshot.id));
}

export async function sendPushNotification(input: SendNotificationInput) {
  if (!auth.currentUser) throw new Error('Entre na sua conta.');
  const sender = await getDoc(doc(db, 'users', auth.currentUser.uid));
  const senderData = sender.data();
  const isSender =
    senderData?.ativo === true &&
    (senderData.perfil === 'ADMINISTRADOR' ||
      (Array.isArray(senderData.funcoes) && senderData.funcoes.includes('SECRETARIA')));
  if (!isSender) throw new Error('Somente administradores e secretaria podem enviar notificações.');

  const titulo = input.titulo.trim();
  const mensagem = input.mensagem.trim();
  if (!titulo || !mensagem) throw new Error('Informe título e mensagem.');

  const recipientUids = await getNotificationRecipientUids(input.publico, input.alvoId);
  const tokenSnapshots = await getDocs(query(collection(db, 'pushTokens'), where('ativo', '==', true)));
  const tokens = tokenSnapshots.docs
    .filter((snapshot) => recipientUids.has(snapshot.data().uid))
    .map((snapshot) => ({
      token: snapshot.id,
      ref: snapshot.ref,
      uid: String(snapshot.data().uid),
    }));

  let sucesso = 0;
  let falhas = 0;
  const invalidRefs: typeof tokens = [];

  for (let offset = 0; offset < tokens.length; offset += 100) {
    const batch = tokens.slice(offset, offset + 100);
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-Encoding': 'gzip',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(batch.map(({ token }) => ({
        to: token,
        title: titulo,
        body: mensagem,
        sound: 'default',
        data: {
          screen: input.screen ?? 'inicio',
          alvoId: input.alvoRouteId ?? input.alvoId ?? null,
        },
      }))),
    });
    if (!response.ok) throw new Error(`Expo Push respondeu HTTP ${response.status}.`);
    const result = await response.json();
    const tickets = Array.isArray(result.data) ? result.data : [];
    tickets.forEach((ticket: { status?: string }, index: number) => {
      if (ticket.status === 'ok') sucesso += 1;
      else {
        falhas += 1;
        if (
          (ticket as { details?: { error?: string } }).details?.error ===
          'DeviceNotRegistered'
        ) invalidRefs.push(batch[index]);
      }
    });
  }

  if (invalidRefs.length) {
    const batch = writeBatch(db);
    invalidRefs.forEach(({ ref }) => batch.update(ref, { ativo: false, atualizadoEm: serverTimestamp() }));
    await batch.commit();
  }

  const enviadoEm = serverTimestamp();
  const historicoRef = await addDoc(collection(db, 'notificacoesEnviadas'), {
    titulo,
    mensagem,
    publico: input.publico,
    alvoId: input.alvoId ?? null,
    enviadoPor: auth.currentUser.uid,
    enviadoEm,
    total: recipientUids.size,
    sucesso,
    falhas,
  });
  await addDoc(collection(db, 'auditoria'), {
    acao: 'criar',
    colecao: 'notificacoesEnviadas',
    docId: historicoRef.id,
    por: auth.currentUser.uid,
    porNome:
      typeof senderData?.nome === 'string'
        ? senderData.nome
        : auth.currentUser.email ?? 'Usuário',
    em: serverTimestamp(),
  });
  return {
    total: new Set(tokens.map(({ uid }) => uid)).size,
    sucesso,
    falhas,
  };
}

export function configureNotificationResponseListener() {
  function routeFromResponse(response: Notifications.NotificationResponse) {
    const data = response.notification.request.content.data as {
      screen?: 'avisos' | 'eventos' | 'inicio';
    };
    if (data.screen === 'avisos') {
      router.push('/avisos');
    } else if (data.screen === 'eventos') {
      router.push('/eventos');
    } else {
      router.push('/(tabs)');
    }
  }

  void Notifications.getLastNotificationResponseAsync().then((response) => {
    if (response) routeFromResponse(response);
  });

  return Notifications.addNotificationResponseReceivedListener(routeFromResponse);
}

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export function registrarNotificacoes(): Promise<void> {
  if (!registrationInProgress) {
    registrationInProgress = registrarNotificacoesInterno().finally(() => {
      registrationInProgress = null;
    });
  }

  return registrationInProgress;
}

async function registrarNotificacoesInterno() {
  if (!Device.isDevice || (Platform.OS !== 'ios' && Platform.OS !== 'android')) {
    return;
  }

  const uid = auth.currentUser?.uid;
  if (!uid) return;

  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
        name: 'Notificações',
        importance: AndroidImportance.DEFAULT,
      });
    }

    let permission = await Notifications.getPermissionsAsync();

    if (!permission.granted) {
      if (permission.status !== 'undetermined') return;
      if (await AsyncStorage.getItem(PERMISSION_DECLINED_KEY)) return;

      const accepted = await solicitarPermissao();
      if (!accepted) {
        await AsyncStorage.setItem(PERMISSION_DECLINED_KEY, 'true');
        return;
      }

      permission = await Notifications.requestPermissionsAsync();
      if (!permission.granted) {
        await AsyncStorage.setItem(PERMISSION_DECLINED_KEY, 'true');
        return;
      }

      await AsyncStorage.removeItem(PERMISSION_DECLINED_KEY);
    }

    if (auth.currentUser?.uid !== uid) return;

    const projectId = getProjectId();
    const token = (
      await Notifications.getExpoPushTokenAsync({ projectId })
    ).data;

    if (auth.currentUser?.uid !== uid) return;

    await setDoc(
      doc(db, 'pushTokens', token),
      {
        uid,
        plataforma: Platform.OS,
        ativo: true,
        atualizadoEm: serverTimestamp(),
      },
    );
  } catch (error) {
    console.error('Falha ao registrar notificações push:', error);
  }
}

export async function desativarNotificacoes() {
  const uid = auth.currentUser?.uid;
  if (
    !uid ||
    !Device.isDevice ||
    (Platform.OS !== 'ios' && Platform.OS !== 'android')
  ) {
    return;
  }

  const permission = await Notifications.getPermissionsAsync();
  if (!permission.granted) return;

  const token = (
    await Notifications.getExpoPushTokenAsync({ projectId: getProjectId() })
  ).data;
  const tokenRef = doc(db, 'pushTokens', token);

  try {
    const tokenSnapshot = await getDoc(tokenRef);
    if (!tokenSnapshot.exists() || tokenSnapshot.data().uid !== uid) return;

    await updateDoc(tokenRef, {
      ativo: false,
      atualizadoEm: serverTimestamp(),
    });
  } catch {
    // Token antigo sem dono ou sem permissão: não há o que desativar.
  }
}


function getProjectId() {
  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId;

  if (!projectId) {
    throw new Error('O EAS projectId não está configurado no app.json.');
  }

  return projectId;
}

function solicitarPermissao(): Promise<boolean> {
  return new Promise((resolve) => {
    Alert.alert(
      'Receber notificações?',
      'Podemos avisar você sobre comunicados e atividades da IP Providência. Você pode mudar essa opção nas configurações do celular.',
      [
        {
          text: 'Agora não',
          style: 'cancel',
          onPress: () => resolve(false),
        },
        {
          text: 'Permitir',
          onPress: () => resolve(true),
        },
      ],
      { cancelable: false },
    );
  });
}