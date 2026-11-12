import {
  addDoc,
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';

import type { PedidoOracao } from '../types/firestore';
import { auth, db } from './firebase';
import { getUser } from './userService';

export interface PedidoOracaoInput {
  texto: string;
  compartilhadoComPg?: boolean;
}

function mapPedido(
  id: string,
  data: Omit<PedidoOracao, 'id'>,
): PedidoOracao {
  return { id, ...data };
}

export async function createPedidoOracao(input: PedidoOracaoInput) {
  const texto = input.texto.trim();
  if (!texto) throw new Error('Escreva o pedido de oração antes de enviar.');

  const uid = auth.currentUser?.uid ?? null;
  const compartilhar = input.compartilhadoComPg === true;
  let pequenoGrupoId: string | null = null;

  if (compartilhar) {
    if (!uid) {
      throw new Error('Entre na sua conta para compartilhar com um PG.');
    }

    const user = await getUser(uid);
    if (
      !user?.ativo ||
      user.perfil !== 'MEMBRO' ||
      !user.pequenoGrupoId
    ) {
      throw new Error('É necessário ser membro de um PG para compartilhar.');
    }
    pequenoGrupoId = user.pequenoGrupoId;
  }

  return addDoc(collection(db, 'pedidosOracao'), {
    autorUid: uid,
    texto,
    compartilhadoComPg: compartilhar,
    pequenoGrupoId,
    status: 'aberto',
    criadoEm: serverTimestamp(),
    atualizadoEm: serverTimestamp(),
  });
}

export async function getMeusPedidosOracao(): Promise<PedidoOracao[]> {
  const uid = auth.currentUser?.uid;
  if (!uid) return [];

  const snapshot = await getDocs(
    query(collection(db, 'pedidosOracao'), where('autorUid', '==', uid)),
  );

  return snapshot.docs.map((requestDoc) =>
    mapPedido(
      requestDoc.id,
      requestDoc.data() as Omit<PedidoOracao, 'id'>,
    ),
  );
}

export async function getPedidosDoMeuPg(): Promise<PedidoOracao[]> {
  const uid = auth.currentUser?.uid;
  if (!uid) return [];

  const user = await getUser(uid);
  if (
    !user?.ativo ||
    user.perfil !== 'MEMBRO' ||
    !user.pequenoGrupoId
  ) {
    return [];
  }

  const snapshot = await getDocs(
    query(
      collection(db, 'pedidosOracao'),
      where('compartilhadoComPg', '==', true),
      where('pequenoGrupoId', '==', user.pequenoGrupoId),
    ),
  );

  return snapshot.docs.map((requestDoc) =>
    mapPedido(
      requestDoc.id,
      requestDoc.data() as Omit<PedidoOracao, 'id'>,
    ),
  );
}

export async function updateMeuPedidoOracao(
  id: string,
  changes: Pick<PedidoOracaoInput, 'texto' | 'compartilhadoComPg'>,
) {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Entre na sua conta para editar o pedido.');

  const texto = changes.texto.trim();
  if (!texto) throw new Error('Escreva o pedido de oração antes de salvar.');

  const user = await getUser(uid);
  const compartilhar = changes.compartilhadoComPg === true;
  const pequenoGrupoId =
    compartilhar && user?.perfil === 'MEMBRO' && user.ativo
      ? user.pequenoGrupoId ?? null
      : null;

  if (compartilhar && !pequenoGrupoId) {
    throw new Error('É necessário ser membro de um PG para compartilhar.');
  }

  await updateDoc(doc(db, 'pedidosOracao', id), {
    texto,
    compartilhadoComPg: compartilhar,
    pequenoGrupoId,
    atualizadoEm: serverTimestamp(),
  });
}
