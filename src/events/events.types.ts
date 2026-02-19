export interface BaseEvent {
  eventId: string;
  eventType: string;
  aggregateId: string;
  timestamp: string;
  version: number;
  source: string;
}

export interface OrcamentoAprovadoEvent extends BaseEvent {
  eventType: 'ORCAMENTO_APROVADO';
  source: 'billing-service';
  payload: {
    osId: string;
    orcamentoId: string;
    valorTotal: number;
    pagamentoId: string;
    statusPagamento: string;
  };
}

export interface ExecucaoIniciadaEvent extends BaseEvent {
  eventType: 'EXECUCAO_INICIADA';
  source: 'production-service';
  payload: {
    osId: string;
    execucaoId: string;
    dataInicio: string;
  };
}

export interface ExecucaoFinalizadaEvent extends BaseEvent {
  eventType: 'EXECUCAO_FINALIZADA';
  source: 'production-service';
  payload: {
    osId: string;
    execucaoId: string;
    dataInicio: string;
    dataFim: string;
    duracaoDias: number;
  };
}

export type SagaEvent =
  | OrcamentoAprovadoEvent
  | ExecucaoIniciadaEvent
  | ExecucaoFinalizadaEvent;
