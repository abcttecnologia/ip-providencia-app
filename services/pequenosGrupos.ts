import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';

import type {
  DataFirestore,
  ParticipantePg,
  PequenoGrupo,
  PresencaPg,
  SolicitacaoPg,
} from '../types/firestore';
import { auth, db, functions } from './firebase';
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
  if (!user?.ativo) return null;

  if (user.perfil === 'MEMBRO' && user.pequenoGrupoId) {
    const snapshot = await getDoc(doc(db, 'pequenosGrupos', user.pequenoGrupoId));
    if (snapshot.exists()) {
      return mapPequenoGrupo(
        snapshot.id,
        snapshot.data() as Omit<PequenoGrupo, 'id'>,
      );
    }
  }

  const groups = await getPequenosGrupos();
  return groups.find((group) => group.liderUids?.includes(uid)) ?? null;
}

export async function createPequenoGrupo(grupo: PequenoGrupoInput) {
  const groupRef = doc(collection(db, 'pequenosGrupos'));
  await setDoc(groupRef, {
    ...grupo,
    criadoEm: serverTimestamp(),
    atualizadoEm: serverTimestamp(),
  });
  return groupRef;
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

export async function getMyPgRequests(): Promise<SolicitacaoPg[]> {
  const uid = auth.currentUser?.uid;
  if (!uid) return [];

  const snapshot = await getDocs(
    query(collection(db, 'solicitacoesPg'), where('uid', '==', uid)),
  );
  return snapshot.docs
    .map((requestDoc) => ({
      id: requestDoc.id,
      ...requestDoc.data(),
    }) as SolicitacaoPg)
    .sort(
      (left, right) =>
        timestampMillis(right.criadoEm) - timestampMillis(left.criadoEm),
    );
}

export async function requestToJoinPg(groupId: string) {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Entre na sua conta para solicitar participação.');

  const user = await getUser(uid);
  if (!user?.ativo || user.perfil !== 'MEMBRO') {
    throw new Error('A solicitação está disponível para membros cadastrados.');
  }
  if (user.pequenoGrupoId) {
    throw new Error('Você já participa de um Pequeno Grupo.');
  }

  const groupSnapshot = await getDoc(doc(db, 'pequenosGrupos', groupId));
  if (!groupSnapshot.exists() || groupSnapshot.data().ativo !== true) {
    throw new Error('Este Pequeno Grupo não está disponível.');
  }

  const requestId = `${groupId}_${uid}`;
  const requestRef = doc(db, 'solicitacoesPg', requestId);
  if ((await getDoc(requestRef)).exists()) {
    throw new Error('Você já enviou uma solicitação para este grupo.');
  }

  await setDoc(requestRef, {
    uid,
    nome: user.nome,
    grupoId: groupId,
    status: 'pendente',
    criadoEm: serverTimestamp(),
    atualizadoEm: serverTimestamp(),
  });
}

export async function getPendingPgRequests(
  groupId: string,
): Promise<SolicitacaoPg[]> {
  const snapshot = await getDocs(
    query(
      collection(db, 'solicitacoesPg'),
      where('grupoId', '==', groupId),
      where('status', '==', 'pendente'),
    ),
  );
  return snapshot.docs.map((requestDoc) => ({
    id: requestDoc.id,
    ...requestDoc.data(),
  }) as SolicitacaoPg);
}

export async function updatePgRequestStatus(
  request: SolicitacaoPg,
  status: Extract<SolicitacaoPg['status'], 'aprovada' | 'recusada'>,
) {
  if (!auth.currentUser?.uid) {
    throw new Error('Entre na sua conta para atualizar a solicitação.');
  }

  const batch = writeBatch(db);
  const requestRef = doc(db, 'solicitacoesPg', request.id);
  batch.update(requestRef, {
    status,
    atualizadoEm: serverTimestamp(),
  });
  if (status === 'aprovada') {
    batch.update(doc(db, 'users', request.uid), {
      pequenoGrupoId: request.grupoId,
      atualizadoEm: serverTimestamp(),
    });
  }
  await batch.commit();
}

export async function getPgParticipants(
  groupId: string,
): Promise<ParticipantePg[]> {
  const ensureRoster = httpsCallable(functions, 'ensurePgRoster');
  await ensureRoster({ grupoId: groupId });

  const snapshot = await getDocs(
    collection(db, 'pequenosGrupos', groupId, 'participantes'),
  );
  return snapshot.docs
    .map(
      (participantDoc) =>
        ({
          uid: participantDoc.id,
          ...participantDoc.data(),
        }) as ParticipantePg,
    )
    .sort((left, right) => left.nome.localeCompare(right.nome));
}

export async function removePgParticipant(uid: string) {
  await updateDoc(doc(db, 'users', uid), {
    pequenoGrupoId: null,
    atualizadoEm: serverTimestamp(),
  });
}

export async function getPgAttendance(
  groupId: string,
  date: string,
): Promise<PresencaPg | null> {
  const snapshot = await getDoc(
    doc(db, 'presencasPg', `${groupId}_${date}`),
  );
  return snapshot.exists()
    ? ({ id: snapshot.id, ...snapshot.data() } as PresencaPg)
    : null;
}

export async function savePgAttendance(
  groupId: string,
  date: string,
  presentes: string[],
  visitantes: number,
) {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Entre na sua conta para registrar presença.');
  if (!Number.isSafeInteger(visitantes) || visitantes < 0) {
    throw new Error('Informe uma quantidade válida de visitantes.');
  }

  await setDoc(doc(db, 'presencasPg', `${groupId}_${date}`), {
    grupoId: groupId,
    data: date,
    presentes: [...new Set(presentes)],
    visitantes,
    registradoPor: uid,
    registradoEm: serverTimestamp(),
  });
}

function timestampMillis(value: DataFirestore | undefined) {
  if (!value) return 0;
  return value instanceof Date ? value.getTime() : value.toMillis();
}
