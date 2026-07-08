import { doc, getDoc } from 'firebase/firestore';

import { lerCache, salvarCache } from './cache';
import { db } from './firebase';
import { ServiceResult } from './types';

export async function getLinks(): Promise<ServiceResult<any>> {
  try {
    const docRef = doc(db, 'config', 'links');

    const snap = await getDoc(docRef);

    if (!snap.exists()) {
      return {
        data: null,
        offline: false,
      };
    }

    const dados = snap.data();

    await salvarCache('config-links', dados);

    return {
      data: dados,
      offline: false,
    };
  } catch (error) {
    console.log('Usando cache dos links');

    return {
      data: await lerCache('config-links'),
      offline: true,
    };
  }
}