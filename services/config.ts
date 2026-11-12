import { doc, getDoc } from 'firebase/firestore';

import type { ConfigLinks, ServiceResult } from '../types/firestore';
import { lerCache, salvarCache } from './cache';
import { db } from './firebase';

export async function getLinks(): Promise<ServiceResult<ConfigLinks | null>> {
  try {
    const docRef = doc(db, 'config', 'links');

    const snap = await getDoc(docRef);

    if (!snap.exists()) {
      return {
        data: null,
        offline: false,
      };
    }

    const dados = snap.data() as ConfigLinks;

    await salvarCache('config-links', dados);

    return {
      data: dados,
      offline: false,
    };
  } catch (error) {
    console.warn('Falha ao carregar links do Firestore; usando cache:', error);

    return {
      data: await lerCache<ConfigLinks | null>('config-links'),
      offline: true,
    };
  }
}