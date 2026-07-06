import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

export async function getLinks() {
  const docRef = doc(db, 'config', 'links');
  const snap = await getDoc(docRef);

  if (!snap.exists()) {
    throw new Error('Documento config/links não encontrado.');
  }

  return snap.data();
}