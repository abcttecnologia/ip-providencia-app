import {
  collection,
  query,
  where,
  type DocumentData,
  type Query,
} from 'firebase/firestore';

import { auth, db } from './firebase';
import { getUser } from './userService';
import type { AppUser } from '../types/user';

export type AudienceCollection = 'Avisos' | 'eventos';

export interface AudienceQueries {
  queries: Query<DocumentData>[];
  cacheScope: string;
  user: AppUser | null;
}

function hasMemberAccess(user: AppUser | null): user is AppUser {
  return Boolean(
    user?.ativo &&
      (user.perfil === 'MEMBRO' || user.perfil === 'ADMINISTRADOR'),
  );
}

export function canReadAudience(
  data: { publico?: unknown; alvoId?: unknown },
  user: AppUser | null,
) {
  if (user?.ativo && user.perfil === 'ADMINISTRADOR') return true;

  const publico = data.publico ?? 'todos';
  if (publico === 'todos') return true;
  if (!hasMemberAccess(user)) return false;
  if (publico === 'membros') return true;
  if (
    publico === 'ministerio' &&
    typeof data.alvoId === 'string'
  ) {
    return user.ministerios?.includes(data.alvoId) ?? false;
  }
  if (publico === 'pg') {
    return data.alvoId === user.pequenoGrupoId;
  }

  return false;
}

export async function getAudienceQueries(
  collectionName: AudienceCollection,
): Promise<AudienceQueries> {
  const uid = auth.currentUser?.uid ?? null;
  const user = uid ? await getUser(uid) : null;
  const collectionRef = collection(db, collectionName);
  const queries: Query<DocumentData>[] = [];

  if (user?.ativo && user.perfil === 'ADMINISTRADOR') {
    queries.push(collectionRef);
  } else {
    queries.push(query(collectionRef, where('publico', '==', 'todos')));

    if (hasMemberAccess(user)) {
      queries.push(query(collectionRef, where('publico', '==', 'membros')));

      for (const ministerioId of user.ministerios ?? []) {
        queries.push(
          query(
            collectionRef,
            where('publico', '==', 'ministerio'),
            where('alvoId', '==', ministerioId),
          ),
        );
      }

      if (user.pequenoGrupoId) {
        queries.push(
          query(
            collectionRef,
            where('publico', '==', 'pg'),
            where('alvoId', '==', user.pequenoGrupoId),
          ),
        );
      }
    }
  }

  const cacheScope = encodeURIComponent(
    JSON.stringify([
      uid,
      user?.perfil ?? 'VISITANTE',
      Boolean(user?.ativo),
      [...(user?.ministerios ?? [])].sort(),
      user?.pequenoGrupoId ?? null,
    ]),
  );

  return { queries, cacheScope, user };
}
