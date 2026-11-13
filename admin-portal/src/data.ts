import {
  addDoc,
  collection,
  doc,
  getDocs,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  runTransaction,
} from "firebase/firestore";
import {
  createUserWithEmailAndPassword,
  deleteUser,
  getAuth,
  sendPasswordResetEmail,
  signOut,
} from "firebase/auth";
import { getApps, initializeApp } from "firebase/app";

import { auth, db, firebaseConfig } from "./firebase";
import type {
  Family,
  FollowUp,
  MemberHistory,
  PastoralVisit,
  Person,
  PortalData,
} from "./types";

function mapCollection<T extends { id?: string; uid?: string }>(
  collectionName: string,
  key: "id" | "uid",
) {
  return getDocs(collection(db, collectionName)).then((snapshot) =>
    snapshot.docs.map(
      (item) => ({ ...item.data(), [key]: item.id }) as T,
    ),
  );
}

export async function loadPortalData(): Promise<PortalData> {
  const [pessoas, familias, historyRecords, visitRecords, followUpRecords] =
    await Promise.all([
      mapCollection<Person>("users", "uid"),
      mapCollection<Family>("familias", "id"),
      mapCollection<MemberHistory>("historicoMembros", "id"),
      mapCollection<PastoralVisit>("visitas", "id"),
      mapCollection<FollowUp>("acompanhamentos", "id"),
    ]);
  const historico = historyRecords.map((record) => ({
    ...record,
    data: dateKey(record.data),
  }));
  const visitas = visitRecords.map((record) => ({
    ...record,
    data: dateKey(record.data),
  }));
  const acompanhamentos = followUpRecords.map((record) => ({
    ...record,
    proximoRetorno: dateKey(record.proximoRetorno),
  }));

  pessoas.sort((left, right) =>
    (typeof left.nome === "string" ? left.nome : "").localeCompare(
      typeof right.nome === "string" ? right.nome : "",
    ),
  );
  familias.sort((left, right) =>
    (typeof left.nome === "string" ? left.nome : "").localeCompare(
      typeof right.nome === "string" ? right.nome : "",
    ),
  );
  historico.sort((left, right) => right.data.localeCompare(left.data));
  visitas.sort((left, right) => right.data.localeCompare(left.data));
  acompanhamentos.sort((left, right) =>
    left.proximoRetorno.localeCompare(right.proximoRetorno),
  );

  return { pessoas, familias, historico, visitas, acompanhamentos };
}

export async function createPortalPerson(input: {
  nome: string;
  email: string;
  telefone: string;
}) {
  const appName = "ip-providencia-account-provisioning";
  const provisioningApp = getApps().find((item) => item.name === appName)
    ?? initializeApp(firebaseConfig, appName);
  const provisioningAuth = getAuth(provisioningApp);
  const temporaryPassword = Array.from(
    crypto.getRandomValues(new Uint8Array(24)),
    (byte) => byte.toString(16).padStart(2, "0"),
  ).join("");

  const credential = await createUserWithEmailAndPassword(
    provisioningAuth,
    input.email.trim(),
    temporaryPassword,
  );

  try {
    await setDoc(doc(db, "users", credential.user.uid), {
      uid: credential.user.uid,
      email: input.email.trim(),
      nome: input.nome.trim(),
      telefone: input.telefone.trim(),
      perfil: "VISITANTE",
      ativo: true,
      ministerios: [],
      criadoEm: serverTimestamp(),
      atualizadoEm: serverTimestamp(),
    });
  } catch (error) {
    try {
      await deleteUser(credential.user);
    } catch (rollbackError) {
      console.error("Falha ao remover conta após erro no cadastro:", rollbackError);
    }
    throw error;
  }

  try {
    provisioningAuth.languageCode = "pt-BR";
    await sendPasswordResetEmail(provisioningAuth, input.email.trim());
  } catch (error) {
    throw new Error(
      `Cadastro criado, mas não foi possível enviar o e-mail de definição de senha: ${
        error instanceof Error ? error.message : "erro desconhecido"
      }`,
    );
  } finally {
    await signOut(provisioningAuth);
  }
}

export async function updatePerson(
  uid: string,
  changes: Pick<
    Person,
    | "nome"
    | "telefone"
    | "endereco"
    | "dataNascimento"
    | "estadoCivil"
    | "perfil"
    | "ativo"
  >,
  previousProfile: Person["perfil"],
) {
  const memberSince =
    changes.perfil === "MEMBRO" && previousProfile !== "MEMBRO"
      ? { membroDesde: serverTimestamp() }
      : {};
  await updateDoc(doc(db, "users", uid), {
    ...changes,
    ...memberSince,
    atualizadoEm: serverTimestamp(),
  });
}

export async function saveFamily(
  family: Pick<Family, "nome" | "membrosUids">,
  currentFamily: Family | null,
) {
  const familyRef = currentFamily
    ? doc(db, "familias", currentFamily.id)
    : doc(collection(db, "familias"));
  const nextMembers = new Set(family.membrosUids);

  await runTransaction(db, async (transaction) => {
    const targetSnapshot = currentFamily
      ? await transaction.get(familyRef)
      : null;
    if (currentFamily && !targetSnapshot?.exists()) {
      throw new Error("A família foi removida. Atualize a página e tente novamente.");
    }

    const storedMembers = targetSnapshot?.data()?.membrosUids;
    const currentMembers = new Set(
      Array.isArray(storedMembers)
        ? storedMembers.filter(
            (uid): uid is string => typeof uid === "string",
          )
        : [],
    );
    const expectedMembers = new Set(currentFamily?.membrosUids ?? []);
    if (
      currentFamily &&
      (currentMembers.size !== expectedMembers.size ||
        [...currentMembers].some((uid) => !expectedMembers.has(uid)))
    ) {
      throw new Error(
        "Os membros desta família foram alterados por outra pessoa. Atualize os dados e tente novamente.",
      );
    }

    const affectedUids = new Set([...currentMembers, ...nextMembers]);
    const userSnapshots = await Promise.all(
      [...affectedUids].map((uid) =>
        transaction.get(doc(db, "users", uid)),
      ),
    );
    const userDataByUid = new Map(
      [...affectedUids].map((uid, index) => [
        uid,
        userSnapshots[index].exists() ? userSnapshots[index].data() : null,
      ]),
    );
    for (const uid of nextMembers) {
      if (!userDataByUid.get(uid)) {
        throw new Error(
          "Uma pessoa selecionada não está mais cadastrada. Atualize a página e tente novamente.",
        );
      }
    }

    const movedUidsByFamily = new Map<string, Set<string>>();
    for (const uid of nextMembers) {
      const previousFamilyId = userDataByUid.get(uid)?.familiaId;
      if (
        typeof previousFamilyId === "string" &&
        previousFamilyId !== familyRef.id
      ) {
        const movedUids = movedUidsByFamily.get(previousFamilyId) ?? new Set<string>();
        movedUids.add(uid);
        movedUidsByFamily.set(previousFamilyId, movedUids);
      }
    }

    const previousFamilyRefs = [...movedUidsByFamily.keys()].map((id) =>
      doc(db, "familias", id),
    );
    const previousFamilySnapshots = await Promise.all(
      previousFamilyRefs.map((ref) => transaction.get(ref)),
    );

    transaction.set(
      familyRef,
      {
        nome: family.nome.trim(),
        membrosUids: family.membrosUids,
        atualizadoEm: serverTimestamp(),
        ...(currentFamily ? {} : { criadoEm: serverTimestamp() }),
      },
      { merge: true },
    );

    previousFamilyRefs.forEach((ref, index) => {
      const snapshot = previousFamilySnapshots[index];
      if (!snapshot.exists()) return;
      const movedUids = movedUidsByFamily.get(ref.id);
      const members = snapshot.data().membrosUids;
      transaction.update(ref, {
        membrosUids: Array.isArray(members)
          ? members.filter((uid: string) => !movedUids?.has(uid))
          : [],
        atualizadoEm: serverTimestamp(),
      });
    });

    for (const uid of affectedUids) {
      const userData = userDataByUid.get(uid);
      if (!userData) continue;
      const currentFamilyId = userData.familiaId;
      if (nextMembers.has(uid) && currentFamilyId !== familyRef.id) {
        transaction.update(doc(db, "users", uid), {
          familiaId: familyRef.id,
          atualizadoEm: serverTimestamp(),
        });
      } else if (
        currentMembers.has(uid) &&
        !nextMembers.has(uid) &&
        currentFamilyId === familyRef.id
      ) {
        transaction.update(doc(db, "users", uid), {
          familiaId: null,
          atualizadoEm: serverTimestamp(),
        });
      }
    }
  });
}

export async function addMemberHistory(
  input: Omit<MemberHistory, "id">,
) {
  await addDoc(collection(db, "historicoMembros"), {
    ...input,
    data: toTimestamp(input.data),
    criadoEm: serverTimestamp(),
    atualizadoEm: serverTimestamp(),
  });
}

export async function saveVisit(
  input: Omit<PastoralVisit, "id">,
  id?: string,
) {
  const payload = {
    ...input,
    data: toTimestamp(input.data),
    atualizadoEm: serverTimestamp(),
    ...(id ? {} : { criadoEm: serverTimestamp() }),
  };
  if (id) await updateDoc(doc(db, "visitas", id), payload);
  else await addDoc(collection(db, "visitas"), payload);
}

export async function saveFollowUp(
  input: Omit<FollowUp, "id">,
  id?: string,
) {
  const payload = {
    ...input,
    proximoRetorno: toTimestamp(input.proximoRetorno),
    atualizadoEm: serverTimestamp(),
    ...(id ? {} : { criadoEm: serverTimestamp() }),
  };
  if (id) await updateDoc(doc(db, "acompanhamentos", id), payload);
  else await addDoc(collection(db, "acompanhamentos"), payload);
}

export async function signOutPortal() {
  await signOut(auth);
}

function toTimestamp(value: string) {
  if (!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(value)) {
    throw new Error("Informe uma data válida.");
  }
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    throw new Error("Informe uma data válida.");
  }
  return Timestamp.fromDate(date);
}

function dateKey(value: unknown) {
  if (value instanceof Timestamp) {
    return value.toDate().toISOString().slice(0, 10);
  }
  if (typeof value === "string") return value;
  throw new Error("Foi encontrado um registro com uma data inválida.");
}
