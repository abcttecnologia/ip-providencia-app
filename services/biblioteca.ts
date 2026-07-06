import {
    collection,
    getDocs,
    orderBy,
    query,
} from 'firebase/firestore';

import { db } from './firebase';

export async function getBiblioteca() {
  const q = query(
    collection(db, 'biblioteca'),
    orderBy('ordem')
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
}