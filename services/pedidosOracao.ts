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
  titulo: string;
  texto: string;
  compartilhadoComPg?: boolean;
}

function mapPedido(
  id: string,
  data: Omit<PedidoOracao, 'id'>,
): PedidoOracao {
  return {
    id,
    ...data,
    titulo: data.titulo || 'Pedido de oração',
  };
}

export async function createPedidoOracao(input: PedidoOracaoInput) {
  const tituloLimpo = input.titulo.trim();
  const textoLimpo = input.texto.trim();
  if (!tituloLimpo || !textoLimpo) {
    throw new Error('Preencha o título e o pedido.');
  }
  if (tituloLimpo.length > 100) {
    throw new Error('O título deve ter no máximo 100 caracteres.');
  }
  if (textoLimpo.length > 2000) {
    throw new Error('O pedido deve ter no máximo 2000 caracteres.');
  }

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
    titulo: tituloLimpo,
    texto: textoLimpo,
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
  changes: Pick<PedidoOracaoInput, 'titulo' | 'texto' | 'compartilhadoComPg'>,
) {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Entre na sua conta para editar o pedido.');

  const titulo = changes.titulo.trim();
  const texto = changes.texto.trim();
  if (!titulo || !texto) {
    throw new Error('Preencha o título e o pedido.');
  }
  if (titulo.length > 100) {
    throw new Error('O título deve ter no máximo 100 caracteres.');
  }
  if (texto.length > 2000) {
    throw new Error('O pedido deve ter no máximo 2000 caracteres.');
  }

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
    titulo,
    texto,
    compartilhadoComPg: compartilhar,
    pequenoGrupoId,
    atualizadoEm: serverTimestamp(),
  });
}
