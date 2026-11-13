import {
  arrayRemove,
  arrayUnion,
  collection,
  deleteField,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  Timestamp,
  runTransaction,
  where,
  writeBatch,
} from "firebase/firestore";
import { signOut } from "firebase/auth";

import { auth, db } from "./firebase";
import type {
  DeletionRequest,
  Family,
  FollowUp,
  MemberHistory,
  PastoralVisit,
  Person,
  PortalData,
  UserFunction,
  UserProfile,
} from "./types";

export interface PortalActor {
  uid: string;
  nome: string;
  perfil: UserProfile;
  funcoes?: UserFunction[];
}

type PersonChanges = Pick<
  Person,
  | "nome"
  | "telefone"
  | "endereco"
  | "dataNascimento"
  | "estadoCivil"
  | "familiaId"
  | "pequenoGrupoId"
  | "salaEbdId"
  | "ministerios"
> &
  { membroDesde?: string } &
  Partial<Pick<Person, "perfil" | "ativo" | "funcoes">>;

type AuditAction = "criar" | "editar" | "excluir" | "anonimizar";

function auditRecord(
  action: AuditAction,
  collectionName: string,
  documentId: string,
  actor: PortalActor,
) {
  return {
    acao: action,
    colecao: collectionName,
    docId: documentId,
    por: actor.uid,
    porNome: actor.nome,
    em: serverTimestamp(),
  };
}

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

export async function loadPortalData(
  options: { pastoral: boolean; exclusionRequests: boolean },
): Promise<PortalData> {
  const [
    pessoas,
    familias,
    historyRecords,
    visitRecords,
    followUpRecords,
    deletionRequestSnapshot,
  ] = await Promise.all([
    mapCollection<Person>("users", "uid"),
    mapCollection<Family>("familias", "id"),
    mapCollection<MemberHistory>("historicoMembros", "id"),
    mapCollection<PastoralVisit>("visitas", "id"),
    options.pastoral
      ? mapCollection<FollowUp>("acompanhamentos", "id")
      : Promise.resolve([] as FollowUp[]),
    options.exclusionRequests
      ? getDocs(
          query(
            collection(db, "solicitacoesExclusao"),
            where("status", "==", "pendente"),
          ),
        )
      : Promise.resolve(null),
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
  const solicitacoesExclusao: DeletionRequest[] =
    deletionRequestSnapshot?.docs
      .map((record) => ({
        ...record.data(),
        uid: record.id,
      }) as DeletionRequest)
      .filter(
        (request) => !pessoas.some((person) => person.uid === request.uid),
      ) ?? [];

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

  return {
    pessoas,
    familias,
    historico,
    visitas,
    acompanhamentos,
    solicitacoesExclusao,
  };
}

export async function updatePerson(
  uid: string,
  changes: PersonChanges,
  actor: PortalActor,
) {
  const userRef = doc(db, "users", uid);
  await runTransaction(db, async (transaction) => {
    const userSnapshot = await transaction.get(userRef);
    if (!userSnapshot.exists()) {
      throw new Error("O cadastro não existe mais. Atualize os dados e tente novamente.");
    }

    const currentUser = userSnapshot.data();
    const previousFamilyId =
      typeof currentUser.familiaId === "string" ? currentUser.familiaId : null;
    const nextFamilyId = changes.familiaId ?? null;
    const familyIds = [...new Set([previousFamilyId, nextFamilyId].filter(
      (familyId): familyId is string => Boolean(familyId),
    ))];
    const familyRefs = familyIds.map((familyId) =>
      doc(db, "familias", familyId),
    );
    const familySnapshots = await Promise.all(
      familyRefs.map((familyRef) => transaction.get(familyRef)),
    );
    const familyById = new Map(
      familyIds.map((familyId, index) => [
        familyId,
        familySnapshots[index].exists() ? familySnapshots[index] : null,
      ]),
    );
    if (nextFamilyId && !familyById.get(nextFamilyId)) {
      throw new Error("A família selecionada não existe mais.");
    }

    const updates: Record<string, unknown> = {
      nome: changes.nome,
      telefone: changes.telefone,
      endereco: changes.endereco,
      dataNascimento: changes.dataNascimento,
      estadoCivil: changes.estadoCivil,
      familiaId: nextFamilyId,
      pequenoGrupoId: changes.pequenoGrupoId ?? null,
      salaEbdId: changes.salaEbdId ?? null,
      ministerios: changes.ministerios ?? [],
      atualizadoEm: serverTimestamp(),
    };
    if (changes.membroDesde) {
      updates.membroDesde = toTimestamp(changes.membroDesde);
    } else if (
      changes.perfil === "MEMBRO" &&
      currentUser.perfil !== "MEMBRO"
    ) {
      updates.membroDesde = serverTimestamp();
    } else if (changes.membroDesde === "") {
      updates.membroDesde = deleteField();
    }

    if (actor.perfil === "ADMINISTRADOR") {
      if (changes.perfil) updates.perfil = changes.perfil;
      if (typeof changes.ativo === "boolean") updates.ativo = changes.ativo;
      if (uid !== actor.uid && changes.funcoes) updates.funcoes = changes.funcoes;
    }

    transaction.update(userRef, updates);
    transaction.set(
      doc(collection(db, "auditoria")),
      auditRecord("editar", "users", uid, actor),
    );

    if (previousFamilyId !== nextFamilyId) {
      for (const [familyId, familySnapshot] of familyById) {
        if (!familySnapshot) continue;
        const familyRef = doc(db, "familias", familyId);
        transaction.update(familyRef, {
          membrosUids:
            familyId === nextFamilyId
              ? arrayUnion(uid)
              : arrayRemove(uid),
          atualizadoEm: serverTimestamp(),
        });
        transaction.set(
          doc(collection(db, "auditoria")),
          auditRecord("editar", "familias", familyId, actor),
        );
      }
    }
  });
}

export async function saveFamily(
  family: Pick<Family, "nome" | "membrosUids">,
  currentFamily: Family | null,
  actor: PortalActor,
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
    transaction.set(
      doc(collection(db, "auditoria")),
      auditRecord(
        currentFamily ? "editar" : "criar",
        "familias",
        familyRef.id,
        actor,
      ),
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
      transaction.set(
        doc(collection(db, "auditoria")),
        auditRecord("editar", "familias", ref.id, actor),
      );
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
        transaction.set(
          doc(collection(db, "auditoria")),
          auditRecord("editar", "users", uid, actor),
        );
      } else if (
        currentMembers.has(uid) &&
        !nextMembers.has(uid) &&
        currentFamilyId === familyRef.id
      ) {
        transaction.update(doc(db, "users", uid), {
          familiaId: null,
          atualizadoEm: serverTimestamp(),
        });
        transaction.set(
          doc(collection(db, "auditoria")),
          auditRecord("editar", "users", uid, actor),
        );
      }
    }
  });
}

export async function addMemberHistory(
  input: Omit<MemberHistory, "id">,
  actor: PortalActor,
  id?: string,
) {
  const historyRef = id
    ? doc(db, "historicoMembros", id)
    : doc(collection(db, "historicoMembros"));
  const batch = writeBatch(db);
  if (id) {
    batch.update(historyRef, {
      tipo: input.tipo,
      data: toTimestamp(input.data),
      descricao: input.descricao,
      atualizadoEm: serverTimestamp(),
    });
  } else {
    batch.set(historyRef, {
      ...input,
      data: toTimestamp(input.data),
      criadoEm: serverTimestamp(),
      atualizadoEm: serverTimestamp(),
    });
  }
  batch.set(
    doc(collection(db, "auditoria")),
    auditRecord(id ? "editar" : "criar", "historicoMembros", historyRef.id, actor),
  );
  await batch.commit();
}

export async function saveVisit(
  input: Omit<PastoralVisit, "id">,
  actor: PortalActor,
  id?: string,
) {
  const payload = {
    ...input,
    data: toTimestamp(input.data),
    atualizadoEm: serverTimestamp(),
    ...(id ? {} : { criadoEm: serverTimestamp() }),
  };
  const visitRef = id
    ? doc(db, "visitas", id)
    : doc(collection(db, "visitas"));
  const batch = writeBatch(db);
  if (id) batch.update(visitRef, payload);
  else batch.set(visitRef, payload);
  batch.set(
    doc(collection(db, "auditoria")),
    auditRecord(id ? "editar" : "criar", "visitas", visitRef.id, actor),
  );
  await batch.commit();
}

export async function saveFollowUp(
  input: Omit<FollowUp, "id">,
  actor: PortalActor,
  id?: string,
) {
  const payload = {
    ...input,
    proximoRetorno: toTimestamp(input.proximoRetorno),
    atualizadoEm: serverTimestamp(),
    ...(id ? {} : { criadoEm: serverTimestamp() }),
  };
  const followUpRef = id
    ? doc(db, "acompanhamentos", id)
    : doc(collection(db, "acompanhamentos"));
  const batch = writeBatch(db);
  if (id) batch.update(followUpRef, payload);
  else batch.set(followUpRef, payload);
  batch.set(
    doc(collection(db, "auditoria")),
    auditRecord(
      id ? "editar" : "criar",
      "acompanhamentos",
      followUpRef.id,
      actor,
    ),
  );
  await batch.commit();
}

export async function anonymizeAdminRecords(
  request: DeletionRequest,
  actor: PortalActor,
) {
  if (actor.perfil !== "ADMINISTRADOR") {
    throw new Error("Somente administradores podem anonimizar visitas e histórico.");
  }

  const requestRef = doc(db, "solicitacoesExclusao", request.uid);
  const requestSnapshot = await getDoc(requestRef);
  const currentRequest = requestSnapshot.exists()
    ? (requestSnapshot.data() as DeletionRequest)
    : undefined;
  if (
    !currentRequest ||
    currentRequest.motivoExclusao !== "lgpd" ||
    currentRequest.anonimizacaoAdminOk
  ) {
    throw new Error("A solicitação não está disponível para anonimização administrativa.");
  }

  const [visitSnapshot, historySnapshot, familySnapshot] = await Promise.all([
    getDocs(
      query(
        collection(db, "visitas"),
        where("alvoTipo", "==", "pessoa"),
        where("alvoId", "==", request.uid),
      ),
    ),
    getDocs(
      query(
        collection(db, "historicoMembros"),
        where("pessoaUid", "==", request.uid),
      ),
    ),
    getDocs(
      query(
        collection(db, "familias"),
        where("membrosUids", "array-contains", request.uid),
      ),
    ),
  ]);
  const operations = [
    ...visitSnapshot.docs
      .filter((record) => {
        const data = record.data();
        return (
          data.alvoNome !== "Removido a pedido do titular" ||
          data.motivo !== "" ||
          data.observacoes !== ""
        );
      })
      .map((record) => ({
        collectionName: "visitas",
        action: "anonimizar" as const,
        reference: record.ref,
        write: (batch: ReturnType<typeof writeBatch>) =>
          batch.update(record.ref, {
            alvoNome: "Removido a pedido do titular",
            motivo: "",
            observacoes: "",
            atualizadoEm: serverTimestamp(),
          }),
      })),
    ...historySnapshot.docs.map((record) => ({
      collectionName: "historicoMembros",
      action: "excluir" as const,
      reference: record.ref,
      write: (batch: ReturnType<typeof writeBatch>) => batch.delete(record.ref),
    })),
    ...familySnapshot.docs.map((record) => ({
      collectionName: "familias",
      action: "editar" as const,
      reference: record.ref,
      write: (batch: ReturnType<typeof writeBatch>) =>
        batch.update(record.ref, {
          membrosUids: arrayRemove(request.uid),
          atualizadoEm: serverTimestamp(),
        }),
    })),
  ];

  for (let offset = 0; offset < operations.length; offset += 200) {
    const batch = writeBatch(db);
    operations.slice(offset, offset + 200).forEach((operation) => {
      operation.write(batch);
      batch.set(
        doc(collection(db, "auditoria")),
        auditRecord(
          operation.action,
          operation.collectionName,
          operation.reference.id,
          actor,
        ),
      );
    });
    await batch.commit();
  }

  await runTransaction(db, async (transaction) => {
    const latestSnapshot = await transaction.get(requestRef);
    if (!latestSnapshot.exists()) {
      throw new Error("A solicitação foi removida durante a anonimização.");
    }
    const latest = latestSnapshot.data() as DeletionRequest;
    if (
      latest.status !== "pendente" ||
      latest.motivoExclusao !== "lgpd" ||
      latest.anonimizacaoAdminOk
    ) {
      throw new Error("A solicitação mudou durante a anonimização. Atualize a página.");
    }
    transaction.update(requestRef, {
      anonimizacaoAdminOk: true,
      ...(latest.anonimizacaoPastoralOk ? { status: "concluida" } : {}),
    });
    transaction.set(
      doc(collection(db, "auditoria")),
      auditRecord("anonimizar", "solicitacoesExclusao", request.uid, actor),
    );
  });
}

export async function anonymizePastoralRecords(
  request: DeletionRequest,
  actor: PortalActor,
) {
  if (!actor.funcoes?.includes("PASTORAL")) {
    throw new Error("Somente a função Pastoral pode anonimizar acompanhamentos.");
  }

  const requestRef = doc(db, "solicitacoesExclusao", request.uid);
  const requestSnapshot = await getDoc(requestRef);
  const currentRequest = requestSnapshot.exists()
    ? (requestSnapshot.data() as DeletionRequest)
    : undefined;
  if (
    !currentRequest ||
    currentRequest.motivoExclusao !== "lgpd" ||
    currentRequest.anonimizacaoPastoralOk
  ) {
    throw new Error("A solicitação não está disponível para anonimização pastoral.");
  }

  const followUpSnapshot = await getDocs(
    query(
      collection(db, "acompanhamentos"),
      where("alvoTipo", "==", "pessoa"),
      where("alvoId", "==", request.uid),
    ),
  );
  const records = followUpSnapshot.docs.filter((record) => {
    const data = record.data();
    return (
      data.alvoNome !== "Removido a pedido do titular" ||
      data.necessidade !== ""
    );
  });

  for (let offset = 0; offset < records.length; offset += 200) {
    const batch = writeBatch(db);
    records.slice(offset, offset + 200).forEach((record) => {
      batch.update(record.ref, {
        alvoNome: "Removido a pedido do titular",
        necessidade: "",
        atualizadoEm: serverTimestamp(),
      });
      batch.set(
        doc(collection(db, "auditoria")),
        auditRecord("anonimizar", "acompanhamentos", record.id, actor),
      );
    });
    await batch.commit();
  }

  await runTransaction(db, async (transaction) => {
    const latestSnapshot = await transaction.get(requestRef);
    if (!latestSnapshot.exists()) {
      throw new Error("A solicitação foi removida durante a anonimização.");
    }
    const latest = latestSnapshot.data() as DeletionRequest;
    if (
      latest.status !== "pendente" ||
      latest.motivoExclusao !== "lgpd" ||
      latest.anonimizacaoPastoralOk
    ) {
      throw new Error("A solicitação mudou durante a anonimização. Atualize a página.");
    }
    transaction.update(requestRef, { anonimizacaoPastoralOk: true });
    transaction.set(
      doc(collection(db, "auditoria")),
      auditRecord("anonimizar", "solicitacoesExclusao", request.uid, actor),
    );
  });
}

export async function completeDeletionRequest(
  request: DeletionRequest,
  actor: PortalActor,
) {
  if (actor.perfil !== "ADMINISTRADOR") {
    throw new Error("Somente administradores podem concluir a solicitação.");
  }
  if (!request.anonimizacaoAdminOk || !request.anonimizacaoPastoralOk) {
    throw new Error("As etapas da Administração e da Pastoral ainda não foram concluídas.");
  }

  const requestRef = doc(db, "solicitacoesExclusao", request.uid);
  await runTransaction(db, async (transaction) => {
    const latestSnapshot = await transaction.get(requestRef);
    if (!latestSnapshot.exists()) {
      throw new Error("A solicitação não foi encontrada.");
    }
    const latest = latestSnapshot.data() as DeletionRequest;
    if (
      latest.status !== "pendente" ||
      latest.motivoExclusao !== "lgpd" ||
      !latest.anonimizacaoAdminOk ||
      !latest.anonimizacaoPastoralOk
    ) {
      throw new Error("A solicitação não pode ser concluída neste momento.");
    }
    transaction.update(requestRef, { status: "concluida" });
    transaction.set(
      doc(collection(db, "auditoria")),
      auditRecord("editar", "solicitacoesExclusao", request.uid, actor),
    );
  });
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
