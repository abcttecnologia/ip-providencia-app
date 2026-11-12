import type { DataFirestore } from "./firestore";

export type UserProfile = "VISITANTE" | "MEMBRO" | "ADMINISTRADOR";

export interface AppUser {
  uid: string;
  nome: string;
  email: string;
  telefone?: string;
  foto?: string;
  fotoUrl?: string;
  endereco?: string;
  dataNascimento?: string;
  estadoCivil?: string;
  membroDesde?: DataFirestore;
  perfil: UserProfile;
  ativo: boolean;
  familiaId?: string | null;
  pequenoGrupoId?: string | null;
  salaEbdId?: string | null;
  ministerios: string[];
  criadoEm?: DataFirestore;
  atualizadoEm?: DataFirestore;
}

export type UserPersonalUpdate = Partial<
  Pick<
    AppUser,
    | "nome"
    | "telefone"
    | "endereco"
    | "dataNascimento"
    | "estadoCivil"
    | "fotoUrl"
  >
>;

export type UserAccessUpdate = Partial<
  Pick<
    AppUser,
    | "perfil"
    | "ativo"
    | "ministerios"
    | "pequenoGrupoId"
    | "salaEbdId"
    | "familiaId"
    | "membroDesde"
  >
>;