import {
  addDoc,
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';

import type { MaterialBiblioteca, ServiceResult } from '../types/firestore';
import { lerCache, salvarCache } from './cache';
import { db } from './firebase';

export type MaterialBibliotecaInput = Omit<
  MaterialBiblioteca,
  'id' | 'criadoEm' | 'atualizadoEm'
>;

function mapMaterial(id: string, data: Omit<MaterialBiblioteca, 'id'>) {
  return { id, ...data };
}

export async function getBiblioteca(): Promise<
  ServiceResult<MaterialBiblioteca[]>
> {
  try {
    const q = query(
      collection(db, 'biblioteca'),
      orderBy('ordem')
    );

    const snapshot = await getDocs(q);

    const dados = snapshot.docs.map((materialDoc) =>
      mapMaterial(
        materialDoc.id,
        materialDoc.data() as Omit<MaterialBiblioteca, 'id'>,
      ),
    );

    await salvarCache('biblioteca', dados);

    return {
      data: dados,
      offline: false,
    };
  } catch (error) {
    console.warn('Falha ao carregar biblioteca; usando cache:', error);

    return {
      data: (await lerCache<MaterialBiblioteca[]>('biblioteca')) ?? [],
      offline: true,
    };
  }
}

export async function getSermoes(): Promise<MaterialBiblioteca[]> {
  const cacheKey = 'sermoes_biblioteca';

  try {
    const snapshot = await getDocs(
      query(collection(db, 'biblioteca'), where('tipo', '==', 'sermao')),
    );
    const sermoes = snapshot.docs
      .map((sermaoDoc) =>
        mapMaterial(
          sermaoDoc.id,
          sermaoDoc.data() as Omit<MaterialBiblioteca, 'id'>,
        ),
      )
      .sort((left, right) => (left.ordem ?? 0) - (right.ordem ?? 0));

    await salvarCache(cacheKey, sermoes);
    return sermoes;
  } catch (error) {
    console.warn('Falha ao carregar sermões da biblioteca:', error);
    return (await lerCache<MaterialBiblioteca[]>(cacheKey)) ?? [];
  }
}

export async function createMaterialBiblioteca(
  material: MaterialBibliotecaInput,
) {
  return addDoc(collection(db, 'biblioteca'), {
    ...material,
    criadoEm: serverTimestamp(),
    atualizadoEm: serverTimestamp(),
  });
}

export async function updateMaterialBiblioteca(
  id: string,
  changes: Partial<MaterialBibliotecaInput>,
) {
  await updateDoc(doc(db, 'biblioteca', id), {
    ...changes,
    atualizadoEm: serverTimestamp(),
  });
}