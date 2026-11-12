import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';

import { auth } from './firebase';

import { ensureUserProfile } from "./userService";
import { desativarNotificacoes } from './notificacoes';

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
  auth.languageCode = 'pt-BR';
  return sendPasswordResetEmail(auth, email);
}

export async function logout() {
  try {
    await desativarNotificacoes();
  } catch (error) {
    console.error('Não foi possível desativar o token de notificações:', error);
  }

  return signOut(auth);
}
