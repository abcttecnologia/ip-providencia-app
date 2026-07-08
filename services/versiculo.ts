import { doc, getDoc } from 'firebase/firestore';

import { lerCache, salvarCache } from './cache';
import { db } from './firebase';
import { ServiceResult } from './types';

export async function getVersiculo(): Promise<ServiceResult<any | null>> {
  try {
    const ref = doc(db, 'versiculo', 'versiculo');

    const snap = await getDoc(ref);

    if (!snap.exists()) {
      return {
        data: null,
        offline: false,
      };
    }

    const dados = snap.data();

    await salvarCache('versiculo', dados);

    return {
      data: dados,
      offline: false,
    };
  } catch (error) {
    console.log('Usando cache do versículo');

    return {
      data: await lerCache('versiculo'),
      offline: true,
    };
  }
}