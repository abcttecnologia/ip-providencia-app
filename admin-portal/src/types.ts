import type { Timestamp } from "firebase/firestore";

export type UserProfile = "VISITANTE" | "MEMBRO" | "ADMINISTRADOR";
export type RecordTarget = "pessoa" | "familia";
export type HistoryKind = "admissao" | "batismo" | "transferencia" | "observacao";
export type VisitStatus = "agendada" | "realizada" | "cancelada";
export type FollowUpStatus = "aberto" | "em_andamento" | "concluido";

export interface Person {
  uid: string;
  nome: string;
  email: string;
  telefone?: string;
  fotoUrl?: string;
  endereco?: string;
  dataNascimento?: string;
  estadoCivil?: string;
  perfil: UserProfile;
  ativo: boolean;
  familiaId?: string | null;
  ministerios?: string[];
  criadoEm?: Timestamp;
  membroDesde?: Timestamp | string;
}

export interface Family {
  id: string;
  nome: string;
  membrosUids: string[];
}

export interface MemberHistory {
  id: string;
  pessoaUid: string;
  tipo: HistoryKind;
  data: string;
  descricao: string;
  criadoPor: string;
  criadoPorNome: string;
}

export interface PastoralVisit {
  id: string;
  alvoTipo: RecordTarget;
  alvoId: string;
  alvoNome: string;
  data: string;
  motivo: string;
  visitante: string;
  observacoes: string;
  status: VisitStatus;
  criadoPor: string;
  atualizadoEm?: Timestamp;
}

export interface FollowUp {
  id: string;
  alvoTipo: RecordTarget;
  alvoId: string;
  alvoNome: string;
  categoria: string;
  necessidade: string;
  responsavel: string;
  proximoRetorno: string;
  status: FollowUpStatus;
  criadoPor: string;
  atualizadoEm?: Timestamp;
}

export interface PortalData {
  pessoas: Person[];
  familias: Family[];
  historico: MemberHistory[];
  visitas: PastoralVisit[];
  acompanhamentos: FollowUp[];
}
