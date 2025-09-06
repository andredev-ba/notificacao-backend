export type Status = 'RECEBIDO' | 'PROCESSADO_SUCESSO' | 'FALHA_PROCESSAMENTO';

export interface IncomingMessage {
  mensagemId: string;
  conteudoMensagem: string;
}

export interface StatusMessage {
  mensagemId: string;
  status: Status;
}
