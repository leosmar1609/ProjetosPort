import type { Transacao } from "@/lib/types";

export function chaveMes(dataISO: string) {
  return dataISO.slice(0, 7);
}

export interface ResumoMensal {
  chave: string;
  receita: number;
  despesa: number;
  saldo: number;
}

export function agruparPorMes(transacoes: Transacao[]): ResumoMensal[] {
  const mapa = new Map<string, { receita: number; despesa: number }>();

  for (const t of transacoes) {
    const chave = chaveMes(t.data);
    const atual = mapa.get(chave) ?? { receita: 0, despesa: 0 };
    if (t.tipo === "receita") atual.receita += t.valor;
    else atual.despesa += t.valor;
    mapa.set(chave, atual);
  }

  return Array.from(mapa.entries())
    .map(([chave, { receita, despesa }]) => ({
      chave,
      receita,
      despesa,
      saldo: receita - despesa,
    }))
    .sort((a, b) => a.chave.localeCompare(b.chave));
}

export interface ResumoCategoria {
  categoria: string;
  total: number;
}

export function agruparPorCategoria(
  transacoes: Transacao[],
  tipo: "receita" | "despesa",
): ResumoCategoria[] {
  const mapa = new Map<string, number>();
  for (const t of transacoes) {
    if (t.tipo !== tipo) continue;
    mapa.set(t.categoria, (mapa.get(t.categoria) ?? 0) + t.valor);
  }
  return Array.from(mapa.entries())
    .map(([categoria, total]) => ({ categoria, total }))
    .sort((a, b) => b.total - a.total);
}

export function dobrarParaOutros(dados: ResumoCategoria[], limite = 7): ResumoCategoria[] {
  if (dados.length <= limite) return dados;
  const principais = dados.slice(0, limite);
  const restante = dados.slice(limite).reduce((acc, item) => acc + item.total, 0);
  return [...principais, { categoria: "Outros", total: restante }];
}

export interface Kpis {
  saldoTotal: number;
  receitaMesAtual: number;
  despesaMesAtual: number;
  saldoMesAtual: number;
  taxaPoupancaMesAtual: number;
  variacaoReceita: number | null;
  variacaoDespesa: number | null;
}

export function calcularKpis(transacoes: Transacao[]): Kpis {
  const porMes = agruparPorMes(transacoes);
  const saldoTotal = porMes.reduce((acc, m) => acc + m.saldo, 0);

  const mesAtual = porMes.at(-1);
  const mesAnterior = porMes.at(-2);

  const receitaMesAtual = mesAtual?.receita ?? 0;
  const despesaMesAtual = mesAtual?.despesa ?? 0;
  const saldoMesAtual = receitaMesAtual - despesaMesAtual;
  const taxaPoupancaMesAtual =
    receitaMesAtual > 0 ? (saldoMesAtual / receitaMesAtual) * 100 : 0;

  function variacao(atual: number, anterior: number | undefined) {
    if (!anterior) return null;
    return ((atual - anterior) / anterior) * 100;
  }

  return {
    saldoTotal,
    receitaMesAtual,
    despesaMesAtual,
    saldoMesAtual,
    taxaPoupancaMesAtual,
    variacaoReceita: variacao(receitaMesAtual, mesAnterior?.receita),
    variacaoDespesa: variacao(despesaMesAtual, mesAnterior?.despesa),
  };
}
