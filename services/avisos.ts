import { collection, getDocs } from 'firebase/firestore';
import { db } from './firebase';


export async function getAvisos() {
  const snapshot = await getDocs(collection(db, 'Avisos'));

  console.log(
    'Avisos encontrados:',
    snapshot.docs.map((d) => d.data())
  );

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
}