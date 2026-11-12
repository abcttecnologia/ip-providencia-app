import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';

import type { ServiceResult, Versiculo } from '../types/firestore';
import { lerCache, salvarCache } from './cache';
import { db } from './firebase';

export async function getVersiculo(): Promise<
  ServiceResult<Versiculo | null>
> {
  try {
    const ref = doc(db, 'versiculo', 'versiculo');

    const snap = await getDoc(ref);

    if (!snap.exists()) {
      return {
        data: null,
        offline: false,
      };
    }

    const dados = snap.data() as Versiculo;

    await salvarCache('versiculo', dados);

    return {
      data: dados,
      offline: false,
    };
  } catch (error) {
    console.warn('Falha ao carregar o versículo; usando cache:', error);

    return {
      data: await lerCache<Versiculo | null>('versiculo'),
      offline: true,
    };
  }
}

export async function updateVersiculo(versiculo: Versiculo) {
  await setDoc(
    doc(db, 'versiculo', 'versiculo'),
    {
      ...versiculo,
      atualizadoEm: serverTimestamp(),
    },
    { merge: true },
  );
}