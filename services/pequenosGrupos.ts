import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';

import type { PequenoGrupo } from '../types/firestore';
import { auth, db } from './firebase';
import { getUser } from './userService';

export type PequenoGrupoInput = Omit<
  PequenoGrupo,
  'id' | 'criadoEm' | 'atualizadoEm'
>;

function mapPequenoGrupo(
  id: string,
  data: Omit<PequenoGrupo, 'id'>,
): PequenoGrupo {
  return { id, ...data };
}

export async function getPequenosGrupos(): Promise<PequenoGrupo[]> {
  const snapshot = await getDocs(
    query(collection(db, 'pequenosGrupos'), where('ativo', '==', true)),
  );

  return snapshot.docs
    .map((groupDoc) =>
      mapPequenoGrupo(
        groupDoc.id,
        groupDoc.data() as Omit<PequenoGrupo, 'id'>,
      ),
    )
    .sort((left, right) => left.nome.localeCompare(right.nome));
}

export async function getMeuPequenoGrupo(): Promise<PequenoGrupo | null> {
  const uid = auth.currentUser?.uid;
  if (!uid) return null;

  const user = await getUser(uid);
  if (
    !user?.ativo ||
    (user.perfil !== 'MEMBRO' && user.perfil !== 'ADMINISTRADOR') ||
    !user.pequenoGrupoId
  ) {
    return null;
  }

  const snapshot = await getDoc(doc(db, 'pequenosGrupos', user.pequenoGrupoId));
  return snapshot.exists()
    ? mapPequenoGrupo(snapshot.id, snapshot.data() as Omit<PequenoGrupo, 'id'>)
    : null;
}

export async function createPequenoGrupo(grupo: PequenoGrupoInput) {
  return addDoc(collection(db, 'pequenosGrupos'), {
    ...grupo,
    criadoEm: serverTimestamp(),
    atualizadoEm: serverTimestamp(),
  });
}

export async function updatePequenoGrupo(
  id: string,
  changes: Partial<PequenoGrupoInput>,
) {
  await updateDoc(doc(db, 'pequenosGrupos', id), {
    ...changes,
    atualizadoEm: serverTimestamp(),
  });
}
