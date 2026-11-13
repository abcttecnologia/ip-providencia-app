import type { Timestamp } from 'firebase/firestore';

export type Publico = 'todos' | 'membros' | 'ministerio' | 'pg';
export type CategoriaAviso = 'geral' | 'ministerio' | 'comunhao';
export type DataFirestore = Timestamp | Date;

export interface ServiceResult<T> {
  data: T;
  offline: boolean;
}

export interface Aviso {
  id: string;
  titulo: string;
  descricao: string;
  data: string;
  importante: boolean;
  ativo?: boolean;
  categoria?: CategoriaAviso;
  publico?: Publico;
  alvoId?: string | null;
  criadoEm?: DataFirestore;
  atualizadoEm?: DataFirestore;
}

export interface Evento {
  id: string;
  titulo: string;
  categoria?: string;
  subtitulo?: string;
  descricao?: string;
  data?: string;
  imagem?: string;
  tipo?: string;
  ordem?: number;
  ativo: boolean;
  publico?: Publico;
  alvoId?: string | null;
  criadoEm?: DataFirestore;
  atualizadoEm?: DataFirestore;
}

export interface MaterialBiblioteca {
  id: string;
  titulo: string;
  descricao: string;
  url: string;
  ativo: boolean;
  ordem?: number;
  tipo?: 'material' | 'sermao';
  criadoEm?: DataFirestore;
  atualizadoEm?: DataFirestore;
}

export interface Versiculo {
  titulo?: string;
  texto: string;
  referencia: string;
  versao?: string;
  oracao?: string;
  atualizadoEm?: DataFirestore;
}

export interface ConfigLinks {
  instagram?: string;
  clubeBiblia?: string;
  mapa?: string;
  boletim?: string;
}

export interface PushToken {
  uid: string;
  plataforma: 'ios' | 'android';
  ativo: boolean;
  atualizadoEm?: DataFirestore;
}

export interface Ministerio {
  id: string;
  nome: string;
  descricao?: string;
  ativo: boolean;
  criadoEm?: DataFirestore;
  atualizadoEm?: DataFirestore;
}

export interface PequenoGrupo {
  id: string;
  nome: string;
  descricao?: string;
  bairro?: string;
  diaSemana?: string;
  horario?: string;
  local?: string;
  liderId?: string | null;
  lideres?: string;
  liderUids?: string[];
  ativo: boolean;
  criadoEm?: DataFirestore;
  atualizadoEm?: DataFirestore;
}

export interface SolicitacaoPg {
  id: string;
  uid: string;
  nome: string;
  grupoId: string;
  status: 'pendente' | 'aprovada' | 'recusada';
  criadoEm?: DataFirestore;
  atualizadoEm?: DataFirestore;
}

export interface ParticipantePg {
  uid: string;
  nome: string;
  fotoUrl?: string;
}

export interface PresencaPg {
  id: string;
  grupoId: string;
  data: string;
  presentes: string[];
  visitantes: number;
  registradoPor: string;
  registradoEm?: DataFirestore;
}

export interface SalaEbd {
  id: string;
  nome: string;
  descricao?: string;
  faixaEtaria?: string;
  diaSemana?: string;
  horario?: string;
  ativo: boolean;
  criadoEm?: DataFirestore;
  atualizadoEm?: DataFirestore;
}

export interface Familia {
  id: string;
  nome: string;
  membrosUids: string[];
  criadoEm?: DataFirestore;
  atualizadoEm?: DataFirestore;
}

export interface PedidoOracao {
  id: string;
  autorUid: string | null;
  titulo: string;
  texto: string;
  compartilhadoComPg: boolean;
  pequenoGrupoId: string | null;
  status: 'aberto' | 'respondido' | 'arquivado';
  respostaPastoral?: string;
  respondidoPorNome?: string;
  respondidoEm?: DataFirestore;
  criadoEm?: DataFirestore;
  atualizadoEm?: DataFirestore;
}

export interface Anotacao {
  id: string;
  uid: string;
  titulo: string;
  conteudo: string;
  referenciaBiblica?: string;
  criadoEm?: DataFirestore;
  atualizadoEm?: DataFirestore;
}
