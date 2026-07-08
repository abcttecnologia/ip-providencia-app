import {
  collection,
  getDocs,
} from 'firebase/firestore';

import { lerCache, salvarCache } from './cache';
import { db } from './firebase';
import { ServiceResult } from './types';

export interface Aviso {
  id: string;
  titulo: string;
  descricao: string;
  data: string;
  importante: boolean;
}

export async function getAvisos(): Promise<ServiceResult<Aviso[]>> {
  try {
    const snapshot = await getDocs(collection(db, 'Avisos'));

    const avisos: Aviso[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<Aviso, 'id'>),
    }));

    await salvarCache('avisos', avisos);

    return {
      data: avisos,
      offline: false,
    };
  } catch (error) {
    console.log('Usando cache dos avisos');

    return {
      data: (await lerCache<Aviso[]>('avisos')) ?? [],
      offline: true,
    };
  }
}