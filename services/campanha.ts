import { doc, getDoc } from 'firebase/firestore';

import { lerCache, salvarCache } from './cache';
import { db } from './firebase';

export async function getCampanha() {
  try {
    const ref = doc(db, 'campanha', 'casaNova');

    const snap = await getDoc(ref);

    if (!snap.exists()) {
      return null;
    }

    const dados = snap.data();

    // Salva no cache
    await salvarCache('campanha', dados);

    return dados;

  } catch (error) {
    console.log('Usando cache da campanha');

    const cache = await lerCache('campanha');

    return cache;
  }
}