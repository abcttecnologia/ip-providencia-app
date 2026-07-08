import {
  collection,
  getDocs,
  orderBy,
  query,
} from 'firebase/firestore';

import { lerCache, salvarCache } from './cache';
import { db } from './firebase';
import { ServiceResult } from './types';

export async function getBiblioteca(): Promise<ServiceResult<any[]>> {
  try {
    const q = query(
      collection(db, 'biblioteca'),
      orderBy('ordem')
    );

    const snapshot = await getDocs(q);

    const dados = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    await salvarCache('biblioteca', dados);

    return {
      data: dados,
      offline: false,
    };
  } catch (error) {
    console.log('Usando cache da biblioteca');

    return {
      data: (await lerCache<any[]>('biblioteca')) ?? [],
      offline: true,
    };
  }
}