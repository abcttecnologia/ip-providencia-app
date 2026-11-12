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
      { merge: true },
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