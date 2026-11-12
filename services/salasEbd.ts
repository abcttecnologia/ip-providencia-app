import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';

import type { SalaEbd } from '../types/firestore';
import { auth, db } from './firebase';
import { getUser } from './userService';

export type SalaEbdInput = Omit<SalaEbd, 'id' | 'criadoEm' | 'atualizadoEm'>;

function mapSalaEbd(id: string, data: Omit<SalaEbd, 'id'>): SalaEbd {
  return { id, ...data };
}

export async function getMinhaSalaEbd(): Promise<SalaEbd | null> {
  const uid = auth.currentUser?.uid;
  if (!uid) return null;

  const user = await getUser(uid);
  if (
    !user?.ativo ||
    (user.perfil !== 'MEMBRO' && user.perfil !== 'ADMINISTRADOR') ||
    !user.salaEbdId
  ) {
    return null;
  }

  const snapshot = await getDoc(doc(db, 'salasEbd', user.salaEbdId));
  return snapshot.exists()
    ? mapSalaEbd(snapshot.id, snapshot.data() as Omit<SalaEbd, 'id'>)
    : null;
}

export async function getSalasEbd(): Promise<SalaEbd[]> {
  const snapshot = await getDocs(collection(db, 'salasEbd'));
  return snapshot.docs.map((roomDoc) =>
    mapSalaEbd(roomDoc.id, roomDoc.data() as Omit<SalaEbd, 'id'>),
  );
}

export async function createSalaEbd(sala: SalaEbdInput) {
  return addDoc(collection(db, 'salasEbd'), {
    ...sala,
    criadoEm: serverTimestamp(),
    atualizadoEm: serverTimestamp(),
  });
}

export async function updateSalaEbd(
  id: string,
  changes: Partial<SalaEbdInput>,
) {
  await updateDoc(doc(db, 'salasEbd', id), {
    ...changes,
    atualizadoEm: serverTimestamp(),
  });
}
