import {
  EmailAuthProvider,
  deleteUser,
  reauthenticateWithCredential,
} from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  where,
  writeBatch,
} from 'firebase/firestore';

import { auth, db } from './firebase';
import { getUser } from './userService';

const DELETE_BATCH_SIZE = 450;
const PENDING_DELETION_KEY = 'pendingAccountDeletionUid';

export async function hasPendingAccountDeletion(uid: string) {
  return (await AsyncStorage.getItem(PENDING_DELETION_KEY)) === uid;
}

async function clearPendingAccountDeletion() {
  try {
    await AsyncStorage.removeItem(PENDING_DELETION_KEY);
  } catch (error) {
    console.error('Não foi possível limpar o estado local da exclusão:', error);
  }
}

export async function prepareAccountDeletion() {
  const firebaseUser = auth.currentUser;
  if (!firebaseUser) {
    throw new Error('Entre na sua conta para excluir seus dados.');
  }
  if (!firebaseUser.email) {
    throw new Error('A conta precisa ter um e-mail para solicitar a exclusão.');
  }

  const deletionRequest = doc(
    db,
    'solicitacoesExclusao',
    firebaseUser.uid,
  );
  const [profile, existingRequest] = await Promise.all([
    getUser(firebaseUser.uid),
    getDoc(deletionRequest),
  ]);
  if (existingRequest.exists()) {
    const request = existingRequest.data();
    if (
      request.uid !== firebaseUser.uid ||
      request.email !== firebaseUser.email ||
      request.status !== 'pendente' ||
      request.motivoExclusao !== 'lgpd'
    ) {
      throw new Error(
        'Já existe uma solicitação de exclusão que não pode ser retomada.',
      );
    }
  } else {
    const requestBatch = writeBatch(db);
    requestBatch.set(deletionRequest, {
      uid: firebaseUser.uid,
      nome:
        profile?.nome ||
        firebaseUser.displayName ||
        firebaseUser.email.split('@')[0],
      email: firebaseUser.email,
      status: 'pendente',
      criadoEm: serverTimestamp(),
      motivoExclusao: 'lgpd',
      anonimizacaoAdminOk: false,
      anonimizacaoPastoralOk: false,
    });
    await requestBatch.commit();
  }
  await AsyncStorage.setItem(PENDING_DELETION_KEY, firebaseUser.uid);

  const [notes, tokens, prayers] = await Promise.all([
    getDocs(
      query(collection(db, 'anotacoes'), where('uid', '==', firebaseUser.uid)),
    ),
    getDocs(
      query(
        collection(db, 'pushTokens'),
        where('uid', '==', firebaseUser.uid),
      ),
    ),
    getDocs(
      query(
        collection(db, 'pedidosOracao'),
        where('autorUid', '==', firebaseUser.uid),
      ),
    ),
  ]);
  const prayerResponses = await Promise.all(
    prayers.docs.map((prayer) =>
      getDoc(doc(db, 'pedidosOracao', prayer.id, 'respostas', 'pastoral')),
    ),
  );

  const references = [
    ...notes.docs.map((item) => item.ref),
    ...tokens.docs.map((item) => item.ref),
    ...prayerResponses
      .filter((response) => response.exists())
      .map((response) => response.ref),
    ...prayers.docs.map((item) => item.ref),
  ];

  for (let offset = 0; offset < references.length; offset += DELETE_BATCH_SIZE) {
    const batch = writeBatch(db);
    references
      .slice(offset, offset + DELETE_BATCH_SIZE)
      .forEach((reference) => batch.delete(reference));
    await batch.commit();
  }

  if (profile) {
    const finalBatch = writeBatch(db);
    finalBatch.delete(doc(db, 'users', firebaseUser.uid));
    await finalBatch.commit();
  }
}

export async function deleteCurrentAuthAccount() {
  const firebaseUser = auth.currentUser;
  if (!firebaseUser) {
    throw new Error('A sessão da conta não está mais ativa.');
  }
  await deleteUser(firebaseUser);
  await clearPendingAccountDeletion();
}

export async function reauthenticateAndDeleteCurrentAuthAccount(
  password: string,
) {
  const firebaseUser = auth.currentUser;
  if (!firebaseUser?.email) {
    throw new Error('Não foi possível verificar o e-mail desta conta.');
  }

  const credential = EmailAuthProvider.credential(
    firebaseUser.email,
    password,
  );
  await reauthenticateWithCredential(firebaseUser, credential);
  await deleteUser(firebaseUser);
  await clearPendingAccountDeletion();
}
