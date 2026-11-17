import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';

import type { Evento, Publico } from '../types/firestore';
import { canReadAudience, getAudienceQueries } from './audience';
import { lerCache, salvarCache } from './cache';
import { auth, db } from './firebase';

export type EventoInput = Omit<Evento, 'id' | 'criadoEm' | 'atualizadoEm'> & {
  publico: Publico;
};

function eventoOrdem(evento: Evento) {
  return evento.ordem ?? 0;
}

export async function getEventos(): Promise<Evento[]> {
  const audience = await getAudienceQueries('eventos');
  const cacheKey = `eventos_v2_${audience.cacheScope}`;

  try {
    const snapshots = await Promise.all(
      audience.queries.map((audienceQuery) => getDocs(audienceQuery)),
    );
    const eventosById = new Map<string, Evento>();

    for (const snapshot of snapshots) {
      for (const eventoDoc of snapshot.docs) {
        eventosById.set(eventoDoc.id, {
          id: eventoDoc.id,
          ...(eventoDoc.data() as Omit<Evento, 'id'>),
        });
      }
    }

    const eventos = [...eventosById.values()].sort(
      (left, right) => eventoOrdem(left) - eventoOrdem(right),
    );
    await salvarCache(cacheKey, eventos);
    return eventos;
  } catch (error) {
    console.warn('Falha ao carregar eventos; usando cache:', error);
    const cache = await lerCache<Evento[]>(cacheKey);
    return (
      cache?.filter((evento) => canReadAudience(evento, audience.user)) ?? []
    );
  }
}

export async function getEvento(id: string): Promise<Evento> {
  const audience = await getAudienceQueries('eventos');
  const cacheKey = `evento_v2_${audience.cacheScope}_${id}`;

  try {
    const docRef = doc(db, 'eventos', id);
    const snapshot = await getDoc(docRef);

    if (!snapshot.exists()) {
      throw new Error('Evento não encontrado');
    }

    const evento = {
      id: snapshot.id,
      ...(snapshot.data() as Omit<Evento, 'id'>),
    } satisfies Evento;

    await salvarCache(cacheKey, evento);
    return evento;
  } catch (error) {
    console.warn('Falha ao carregar evento; tentando cache:', error);
    const cache = await lerCache<Evento>(cacheKey);
    if (cache && canReadAudience(cache, audience.user)) {
      return cache;
    }
    throw error;
  }
}

export async function createEvento(evento: EventoInput) {
  return addDoc(collection(db, 'eventos'), {
    ...evento,
    criadoEm: serverTimestamp(),
    atualizadoEm: serverTimestamp(),
  });
}

export async function updateEvento(
  id: string,
  changes: Partial<EventoInput>,
) {
  await updateDoc(doc(db, 'eventos', id), {
    ...changes,
    atualizadoEm: serverTimestamp(),
  });
}

export async function deleteEvento(id: string) {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Entre na sua conta.');
  const profile = (await getDoc(doc(db, 'users', uid))).data();
  const allowed =
    profile?.ativo === true &&
    (profile.perfil === 'ADMINISTRADOR' ||
      (Array.isArray(profile.funcoes) &&
        profile.funcoes.includes('SECRETARIA')));
  if (!allowed) throw new Error('Sem permissão para excluir eventos.');

  await deleteDoc(doc(db, 'eventos', id));
  await addDoc(collection(db, 'auditoria'), {
    acao: 'excluir',
    colecao: 'eventos',
    docId: id,
    por: uid,
    porNome:
      typeof profile.nome === 'string'
        ? profile.nome
        : auth.currentUser?.email ?? 'Usuário',
    em: serverTimestamp(),
  });
}