import { doc, getDoc } from 'firebase/firestore';

import { lerCache, salvarCache } from './cache';
import { db } from './firebase';

export async function getVersiculo() {
  try {
    const ref = doc(db, 'versiculo', 'versiculo');

    const snap = await getDoc(ref);

    if (!snap.exists()) {
      return null;
    }

    const dados = snap.data();

    // Salva no cache
    await salvarCache('versiculo', dados);

    return dados;
  } catch (error) {
    console.log('Usando cache do versículo');

    const cache = await lerCache('versiculo');

    return cache;
  }
}