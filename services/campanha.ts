import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

export async function getCampanha() {
  const ref = doc(db, 'campanha', 'casaNova');

  const snap = await getDoc(ref);

  if (!snap.exists()) {
    return null;
  }

  return snap.data();
}