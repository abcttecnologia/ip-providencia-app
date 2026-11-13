import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const required = (key: string, value: string | undefined) => {
  if (!value) {
    throw new Error(`Variável de ambiente obrigatória não definida: ${key}`);
  }
  return value;
};

export const firebaseConfig = {
  apiKey: required(
    "VITE_FIREBASE_API_KEY or EXPO_PUBLIC_FIREBASE_API_KEY",
    import.meta.env.VITE_FIREBASE_API_KEY ??
      import.meta.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  ),
  authDomain: required(
    "VITE_FIREBASE_AUTH_DOMAIN or EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN",
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ??
      import.meta.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  ),
  projectId: required(
    "VITE_FIREBASE_PROJECT_ID or EXPO_PUBLIC_FIREBASE_PROJECT_ID",
    import.meta.env.VITE_FIREBASE_PROJECT_ID ??
      import.meta.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  ),
  storageBucket: required(
    "VITE_FIREBASE_STORAGE_BUCKET or EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET",
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ??
      import.meta.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  ),
  messagingSenderId: required(
    "VITE_FIREBASE_MESSAGING_SENDER_ID or EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ??
      import.meta.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  ),
  appId: required(
    "VITE_FIREBASE_APP_ID or EXPO_PUBLIC_FIREBASE_APP_ID",
    import.meta.env.VITE_FIREBASE_APP_ID ??
      import.meta.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  ),
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
