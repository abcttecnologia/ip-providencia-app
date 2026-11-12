import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  updateDoc,
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

  if (user.perfil === 'ADMINISTRADOR') {
    const snapshot = await getDocs(collection(db, 'ministerios'));
    return snapshot.docs.map((ministryDoc) =>
      mapMinisterio(
        ministryDoc.id,
        ministryDoc.data() as Omit<Ministerio, 'id'>,
      ),
    );
  }

  if (user.perfil !== 'MEMBRO') return [];

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
