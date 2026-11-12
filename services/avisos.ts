import {
  addDoc,
  collection,
  getDocs,
  serverTimestamp,
  updateDoc,
  doc,
} from 'firebase/firestore';

import type {
  Aviso,
  CategoriaAviso,
  Publico,
  ServiceResult,
} from '../types/firestore';
import { canReadAudience, getAudienceQueries } from './audience';
import { lerCache, salvarCache } from './cache';
import { db } from './firebase';

export type { Aviso } from '../types/firestore';

export type AvisoInput = Omit<Aviso, 'id' | 'criadoEm' | 'atualizadoEm'> & {
  publico: Publico;
  categoria: CategoriaAviso;
};

export async function getAvisos(): Promise<ServiceResult<Aviso[]>> {
  const audience = await getAudienceQueries('Avisos');
  const cacheKey = `avisos_v2_${audience.cacheScope}`;

  try {
    const snapshots = await Promise.all(
      audience.queries.map((audienceQuery) => getDocs(audienceQuery)),
    );
    const avisosById = new Map<string, Aviso>();

    for (const snapshot of snapshots) {
      for (const avisoDoc of snapshot.docs) {
        avisosById.set(avisoDoc.id, {
          id: avisoDoc.id,
          ...(avisoDoc.data() as Omit<Aviso, 'id'>),
        });
      }
    }

    const avisos = [...avisosById.values()];
    await salvarCache(cacheKey, avisos);

    return {
      data: avisos,
      offline: false,
    };
  } catch (error) {
    console.warn('Falha ao carregar avisos; usando cache:', error);
    const cache = await lerCache<Aviso[]>(cacheKey);
    const avisos = cache?.filter((aviso) =>
      canReadAudience(aviso, audience.user),
    );

    return {
      data: avisos ?? [],
      offline: Boolean(avisos?.length),
    };
  }
}

export async function createAviso(aviso: AvisoInput) {
  return addDoc(collection(db, 'Avisos'), {
    ...aviso,
    criadoEm: serverTimestamp(),
    atualizadoEm: serverTimestamp(),
  });
}

export async function updateAviso(
  id: string,
  changes: Partial<AvisoInput>,
) {
  await updateDoc(doc(db, 'Avisos', id), {
    ...changes,
    atualizadoEm: serverTimestamp(),
  });
}