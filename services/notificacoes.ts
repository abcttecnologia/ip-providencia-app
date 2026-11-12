import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { AndroidImportance } from 'expo-notifications';
import { Alert, Platform } from 'react-native';

import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';

import { auth, db } from './firebase';

const PERMISSION_DECLINED_KEY = '@ip-providencia/push-notifications-declined';
const ANDROID_CHANNEL_ID = 'default';

let registrationInProgress: Promise<void> | null = null;

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

  let etapa = 'preparar notificações';
  let finalDoToken: string | null = null;

  try {
    if (Platform.OS === 'android') {
      etapa = 'criar canal Android';
      await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
        name: 'Notificações',
        importance: AndroidImportance.DEFAULT,
      });
    }

    etapa = 'verificar permissão';
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

    etapa = 'obter token Expo';
    const projectId = getProjectId();
    const token = (
      await Notifications.getExpoPushTokenAsync({ projectId })
    ).data;
    finalDoToken = token.slice(-6);

    if (auth.currentUser?.uid !== uid) return;

    etapa = 'gravar token no Firestore';
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
    const codigo =
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      typeof error.code === 'string'
        ? error.code
        : 'desconhecido';

    console.error(
      'Falha ao registrar notificações push:',
      {
        etapa,
        codigo,
        plataforma: Platform.OS,
        finalDoToken,
      },
      error,
    );
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