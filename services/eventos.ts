import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
} from 'firebase/firestore';

import { db } from './firebase';

// Lista todos os eventos
export async function getEventos() {
  const q = query(
    collection(db, 'eventos'),
    orderBy('ordem')
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
}

// Busca um único evento
export async function getEvento(id: string) {
  const docRef = doc(db, 'eventos', id);

  const snapshot = await getDoc(docRef);

  if (!snapshot.exists()) {
    throw new Error('Evento não encontrado');
  }

  return {
    id: snapshot.id,
    ...snapshot.data(),
  };
}