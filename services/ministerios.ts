import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';

import type { Ministerio } from '../types/firestore';
import { auth, db } from './firebase';
import { getUser } from './userService';

export type MinisterioInput = Omit<
  Ministerio,
  'id' | 'criadoEm' | 'atualizadoEm'
>;

function mapMinisterio(id: string, data: Omit<Ministerio, 'id'>): Ministerio {
  return { id, ...data };
}

export async function getMeusMinisterios(): Promise<Ministerio[]> {
  const uid = auth.currentUser?.uid;
  if (!uid) return [];

  const user = await getUser(uid);
  if (!user?.ativo) return [];

  const snapshots = await Promise.all(
    (user.ministerios ?? []).map((ministerioId) =>
      getDoc(doc(db, 'ministerios', ministerioId)),
    ),
  );

  return snapshots.flatMap((snapshot) =>
    snapshot.exists()
      ? [mapMinisterio(snapshot.id, snapshot.data() as Omit<Ministerio, 'id'>)]
      : [],
  );
}

export async function getMinisteriosDisponiveis(): Promise<Ministerio[]> {
  if (!auth.currentUser) return [];

  const snapshot = await getDocs(collection(db, 'ministerios'));
  return snapshot.docs
    .map((ministryDoc) =>
      mapMinisterio(
        ministryDoc.id,
        ministryDoc.data() as Omit<Ministerio, 'id'>,
      ),
    )
    .filter((ministry) => ministry.ativo)
    .sort((left, right) => left.ordem - right.ordem);
}

export async function getMinhasSolicitacoesMinisterio() {
  const uid = auth.currentUser?.uid;
  if (!uid) return [];

  const snapshot = await getDocs(
    query(collection(db, 'solicitacoesMinisterio'), where('uid', '==', uid)),
  );
  return snapshot.docs.map((requestDoc) => ({
    id: requestDoc.id,
    ...requestDoc.data(),
  })) as {
    id: string;
    uid: string;
    ministerioId: string;
    status: 'pendente' | 'aprovada' | 'recusada';
  }[];
}

export async function solicitarParticipacaoMinisterio(ministerioId: string) {
  const uid = auth.currentUser?.uid;
  if (!uid) {
    throw new Error('Entre na sua conta para participar de um ministério.');
  }
  if (ministerioId === 'conselho' || ministerioId === 'junta-diaconal') {
    throw new Error('Este vínculo é gerenciado somente pelo administrador.');
  }

  await setDoc(doc(db, 'solicitacoesMinisterio', `${ministerioId}_${uid}`), {
    uid,
    ministerioId,
    status: 'pendente',
    criadoEm: serverTimestamp(),
    atualizadoEm: serverTimestamp(),
  });
}

export async function createMinisterio(ministerio: MinisterioInput) {
  return addDoc(collection(db, 'ministerios'), {
    ...ministerio,
    criadoEm: serverTimestamp(),
    atualizadoEm: serverTimestamp(),
  });
}

export async function updateMinisterio(
  id: string,
  changes: Partial<MinisterioInput>,
) {
  await updateDoc(doc(db, 'ministerios', id), {
    ...changes,
    atualizadoEm: serverTimestamp(),
  });
}
