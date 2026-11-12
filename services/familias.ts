import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';

import type { Familia } from '../types/firestore';
import { auth, db } from './firebase';
import { getUser } from './userService';

export type FamiliaInput = Omit<Familia, 'id' | 'criadoEm' | 'atualizadoEm'>;

function mapFamilia(id: string, data: Omit<Familia, 'id'>): Familia {
  return { id, ...data };
}

export async function getMinhaFamilia(): Promise<Familia | null> {
  const uid = auth.currentUser?.uid;
  if (!uid) return null;

  const user = await getUser(uid);
  if (!user?.familiaId) return null;

  const snapshot = await getDoc(doc(db, 'familias', user.familiaId));
  return snapshot.exists()
    ? mapFamilia(snapshot.id, snapshot.data() as Omit<Familia, 'id'>)
    : null;
}

export async function getFamilias(): Promise<Familia[]> {
  const snapshot = await getDocs(collection(db, 'familias'));
  return snapshot.docs.map((familyDoc) =>
    mapFamilia(familyDoc.id, familyDoc.data() as Omit<Familia, 'id'>),
  );
}

export async function createFamilia(familia: FamiliaInput) {
  return addDoc(collection(db, 'familias'), {
    ...familia,
    criadoEm: serverTimestamp(),
    atualizadoEm: serverTimestamp(),
  });
}

export async function updateFamilia(
  id: string,
  changes: Partial<FamiliaInput>,
) {
  await updateDoc(doc(db, 'familias', id), {
    ...changes,
    atualizadoEm: serverTimestamp(),
  });
}
