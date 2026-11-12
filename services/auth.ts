import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';

import { auth } from './firebase';

import { ensureUserProfile } from "./userService";

export async function register(
  nome: string,
  email: string,
  password: string
) {
  const credential = await createUserWithEmailAndPassword(
    auth,
    email,
    password
  );

  await ensureUserProfile(
    credential.user.uid,
    credential.user.email,
    nome,
  );

  return credential.user;
}
export async function login(email: string, password: string) {
  const credential = await signInWithEmailAndPassword(auth, email, password);

  await ensureUserProfile(
    credential.user.uid,
    credential.user.email,
  );

  return credential;
}

export async function resetPassword(email: string) {
  return sendPasswordResetEmail(auth, email);
}

export async function logout() {
  return signOut(auth);
}