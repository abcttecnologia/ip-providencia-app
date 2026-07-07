import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
} from 'firebase/firestore';

import { lerCache, salvarCache } from './cache';
import { db } from './firebase';

// Lista todos os eventos
export async function getEventos() {
  try {
    const q = query(
      collection(db, 'eventos'),
      orderBy('ordem')
    );

    const snapshot = await getDocs(q);

    const dados = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Salva no cache
    await salvarCache('eventos', dados);

    return dados;

  } catch (error) {
    console.log('Usando cache dos eventos');

    const cache = await lerCache<any[]>('eventos');

    return cache ?? [];
  }
}

// Busca um único evento
export async function getEvento(id: string) {
  try {
    const docRef = doc(db, 'eventos', id);

    const snapshot = await getDoc(docRef);

    if (!snapshot.exists()) {
      throw new Error('Evento não encontrado');
    }

    const dados = {
      id: snapshot.id,
      ...snapshot.data(),
    };

    // Salva o evento individual
    await salvarCache(`evento_${id}`, dados);

    return dados;

  } catch (error) {
    console.log('Usando cache do evento');

    const cache = await lerCache(`evento_${id}`);

    if (cache) {
      return cache;
    }

    throw error;
  }
}