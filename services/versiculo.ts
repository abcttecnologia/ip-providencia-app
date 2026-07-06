import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

export async function getVersiculo() {
  const ref = doc(db, 'versiculo', 'versiculo');

  const snap = await getDoc(ref);

  if (!snap.exists()) {
    return null;
  }

  return snap.data();
}