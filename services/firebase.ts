import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyAJKC5okpfS0f_XyNkVr_Y2LiZ7icngMQE',
  authDomain: 'ip-providencia-6508a.firebaseapp.com',
  projectId: 'ip-providencia-b003b',
  storageBucket: 'ip-providencia-b003b.firebasestorage.app',
  messagingSenderId: '320307805602',
  appId: '1:320307805602:web:943b1861a86638fa0d86fb',
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);