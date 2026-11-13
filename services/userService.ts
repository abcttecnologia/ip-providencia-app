import {
  collection,
  doc,
  getDocs,
  getDoc,
  updateDoc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

import type {
  AppUser,
  UserAccessUpdate,
  UserPersonalUpdate,
} from "../types/user";
import { auth, db } from "./firebase";

export interface AccessOption {
  id: string;
  nome: string;
}

export interface UserAccessOptions {
  ministerios: AccessOption[];
  pequenosGrupos: AccessOption[];
  salasEbd: AccessOption[];
  familias: AccessOption[];
}

async function requireAdministrator() {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("É necessário entrar como administrador.");

  const currentUser = await getUser(uid);
  if (currentUser?.ativo !== true || currentUser.perfil !== "ADMINISTRADOR") {
    throw new Error("Apenas administradores podem gerenciar usuários.");
  }
}

export async function createUser(
  user: Pick<AppUser, "uid" | "email" | "nome"> & {
    consentimentoAceito: boolean;
  },
) {
  const userRef = doc(db, "users", user.uid);
  const snapshot = await getDoc(userRef);

  if (snapshot.exists()) return;
  if (!user.consentimentoAceito) {
    throw new Error("É necessário aceitar a Política de Privacidade.");
  }

  await setDoc(userRef, {
    uid: user.uid,
    email: user.email,
    nome: user.nome,
    perfil: "VISITANTE",
    ativo: true,
    ministerios: [],
    consentimentoLgpd: {
      versao: "1.0",
      aceitoEm: serverTimestamp(),
    },
    criadoEm: serverTimestamp(),
    atualizadoEm: serverTimestamp(),
  });
}

export async function ensureUserProfile(
  uid: string,
  email: string | null,
  nome?: string,
  consentimentoAceito = false,
) {
  const emailUsuario = email ?? "";

  try {
    await createUser({
      uid,
      email: emailUsuario,
      nome: nome || emailUsuario.split("@")[0] || "Visitante",
      consentimentoAceito,
    });
  } catch (error) {
    console.error("Falha ao verificar ou criar perfil no Firestore:", error);
    throw error;
  }
}

export async function aceitarConsentimentoLgpd() {
  const firebaseUser = auth.currentUser;
  if (!firebaseUser) {
    throw new Error("Entre na sua conta para aceitar a Política de Privacidade.");
  }

  const userRef = doc(db, "users", firebaseUser.uid);
  const snapshot = await getDoc(userRef);
  const consentimentoLgpd = {
    versao: "1.0" as const,
    aceitoEm: serverTimestamp(),
  };

  if (snapshot.exists()) {
    if (snapshot.data().consentimentoLgpd?.versao === "1.0") return;
    await updateDoc(userRef, { consentimentoLgpd });
    return;
  }

  const email = firebaseUser.email ?? "";
  await createUser({
    uid: firebaseUser.uid,
    email,
    nome: firebaseUser.displayName || email.split("@")[0] || "Visitante",
    consentimentoAceito: true,
  });
}

export async function getUser(uid: string) {
  const snapshot = await getDoc(doc(db, "users", uid));

  if (!snapshot.exists()) {
    return null;
  }

  return snapshot.data() as AppUser;
}

export async function updateOwnProfile(
  uid: string,
  changes: UserPersonalUpdate,
) {
  await updateDoc(doc(db, "users", uid), {
    ...changes,
    atualizadoEm: serverTimestamp(),
  });
}

export async function updateUserAccess(
  uid: string,
  changes: UserAccessUpdate,
) {
  await updateDoc(doc(db, "users", uid), {
    ...changes,
    atualizadoEm: serverTimestamp(),
  });
}

export async function listUsersForAdmin(): Promise<AppUser[]> {
  await requireAdministrator();
  const snapshot = await getDocs(collection(db, "users"));

  return snapshot.docs
    .map((userDoc) => userDoc.data() as AppUser)
    .sort((left, right) => left.nome.localeCompare(right.nome));
}

export async function getUserAccessOptions(): Promise<UserAccessOptions> {
  await requireAdministrator();

  async function getOptions(collectionName: string): Promise<AccessOption[]> {
    const snapshot = await getDocs(collection(db, collectionName));
    return snapshot.docs
      .map((optionDoc) => ({
        id: optionDoc.id,
        nome:
          typeof optionDoc.data().nome === "string"
            ? optionDoc.data().nome
            : optionDoc.id,
      }))
      .sort((left, right) => left.nome.localeCompare(right.nome));
  }

  const [ministerios, pequenosGrupos, salasEbd, familias] = await Promise.all([
    getOptions("ministerios"),
    getOptions("pequenosGrupos"),
    getOptions("salasEbd"),
    getOptions("familias"),
  ]);

  return { ministerios, pequenosGrupos, salasEbd, familias };
}