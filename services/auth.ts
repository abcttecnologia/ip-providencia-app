import {
  createUserWithEmailAndPassword,
  deleteUser,
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
  password: string,
  consentimentoAceito: boolean,
) {
  if (!consentimentoAceito) {
    throw new Error('É necessário aceitar a Política de Privacidade.');
  }

  const credential = await createUserWithEmailAndPassword(
    auth,
    email,
    password
  );

  try {
    await ensureUserProfile(
      credential.user.uid,
      credential.user.email,
      nome,
      true,
    );
  } catch (error) {
    await deleteUser(credential.user);
    throw error;
  }

  return credential.user;
}
export async function login(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email, password);
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
