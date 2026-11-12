import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';

import type { Anotacao } from '../types/firestore';
import { auth, db } from './firebase';

export type AnotacaoInput = Omit<
  Anotacao,
  'id' | 'uid' | 'criadoEm' | 'atualizadoEm'
>;

function requireUid() {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Entre na sua conta para acessar suas anotações.');
  return uid;
}

export async function getMinhasAnotacoes(): Promise<Anotacao[]> {
  const uid = requireUid();
  const snapshot = await getDocs(
    query(collection(db, 'anotacoes'), where('uid', '==', uid)),
  );

  return snapshot.docs.map((noteDoc) => ({
    id: noteDoc.id,
    ...(noteDoc.data() as Omit<Anotacao, 'id'>),
  }));
}

export async function createAnotacao(anotacao: AnotacaoInput) {
  const uid = requireUid();
  return addDoc(collection(db, 'anotacoes'), {
    ...anotacao,
    uid,
    criadoEm: serverTimestamp(),
    atualizadoEm: serverTimestamp(),
  });
}

export async function updateAnotacao(
  id: string,
  changes: Partial<AnotacaoInput>,
) {
  requireUid();
  await updateDoc(doc(db, 'anotacoes', id), {
    ...changes,
    atualizadoEm: serverTimestamp(),
  });
}

export async function deleteAnotacao(id: string) {
  requireUid();
  await deleteDoc(doc(db, 'anotacoes', id));
}
