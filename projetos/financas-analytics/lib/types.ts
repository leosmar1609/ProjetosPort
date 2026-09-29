export type TipoTransacao = "receita" | "despesa";

export interface Transacao {
  id: string;
  data: string;
  descricao: string;
  categoria: string;
  tipo: TipoTransacao;
  valor: number;
  conta: string;
}
