import type { Timestamp } from "firebase/firestore";

export type UserProfile = "VISITANTE" | "MEMBRO" | "ADMINISTRADOR";
export type UserFunction = "SECRETARIA" | "PASTORAL" | "TESOURARIA";
export type RecordTarget = "pessoa" | "familia";
export type HistoryKind = "admissao" | "batismo" | "transferencia" | "observacao";
export type VisitStatus = "agendada" | "realizada" | "cancelada";
export type FollowUpStatus = "aberto" | "em_andamento" | "concluido";
export type PrayerRequestStatus = "aberto" | "respondido" | "arquivado";

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
  funcoes?: UserFunction[];
  ativo: boolean;
  familiaId?: string | null;
  pequenoGrupoId?: string | null;
  salaEbdId?: string | null;
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

export interface DeletionRequest {
  uid: string;
  nome: string;
  email: string;
  status: "pendente" | "concluida";
  criadoEm: Timestamp;
  motivoExclusao: "lgpd";
  anonimizacaoAdminOk: boolean;
  anonimizacaoPastoralOk: boolean;
}

export interface PrayerRequest {
  id: string;
  autorUid: string | null;
  titulo: string;
  texto: string;
  compartilhadoComPg: boolean;
  pequenoGrupoId: string | null;
  status: PrayerRequestStatus;
  criadoEm?: Timestamp;
  respostaPastoral?: string;
  respondidoPorNome?: string;
  respondidoEm?: Timestamp;
}

export interface SmallGroup {
  id: string;
  nome: string;
  descricao?: string;
  bairro?: string;
  diaSemana?: string;
  horario?: string;
  local?: string;
  lideres?: string;
  liderUids?: string[];
  ativo: boolean;
}

export interface PgRequest {
  id: string;
  uid: string;
  nome: string;
  grupoId: string;
  status: "pendente" | "aprovada" | "recusada";
  criadoEm?: Timestamp;
}

export interface PgAttendance {
  id: string;
  grupoId: string;
  data: string;
  presentes: string[];
  visitantes: number;
}

export interface PgParticipant {
  uid: string;
  grupoId: string;
  ingressoEm?: Timestamp;
}

export interface PortalData {
  pessoas: Person[];
  familias: Family[];
  historico: MemberHistory[];
  visitas: PastoralVisit[];
  acompanhamentos: FollowUp[];
  pedidosOracao: PrayerRequest[];
  pequenosGrupos: SmallGroup[];
  solicitacoesPg: PgRequest[];
  presencasPg: PgAttendance[];
  participantesPg: PgParticipant[];
  solicitacoesExclusao: DeletionRequest[];
}
