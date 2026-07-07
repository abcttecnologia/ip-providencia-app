import {
  collection,
  getDocs,
  orderBy,
  query,
} from 'firebase/firestore';

import { lerCache, salvarCache } from './cache';
import { db } from './firebase';

export async function getBiblioteca() {
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

    // Salva no cache
    await salvarCache('biblioteca', dados);

    return dados;

  } catch (error) {
    console.log('Usando cache da biblioteca');

    return (await lerCache<any[]>('biblioteca')) ?? [];
  }
}