import transacoesJson from "@/data/transacoes.json";
import type { Transacao } from "@/lib/types";
import { agruparPorCategoria, agruparPorMes, calcularKpis, dobrarParaOutros } from "@/lib/finance";
import { formatarMoeda, formatarPercentual } from "@/lib/format";
import { StatTile } from "@/components/ui/StatTile";
import { SaldoTrendChart } from "@/components/charts/SaldoTrendChart";
import { ReceitaDespesaChart } from "@/components/charts/ReceitaDespesaChart";
import { CategoriaBarChart } from "@/components/charts/CategoriaBarChart";

export default function DashboardPage() {
  const transacoes = transacoesJson as Transacao[];

  const resumoMensal = agruparPorMes(transacoes);
  const kpis = calcularKpis(transacoes);

  const mesAtualChave = resumoMensal.at(-1)?.chave;
  const transacoesMesAtual = transacoes.filter((t) => t.data.startsWith(mesAtualChave ?? ""));
  const gastosPorCategoria = dobrarParaOutros(agruparPorCategoria(transacoesMesAtual, "despesa"));

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-tinta">Visão geral</h1>
        <p className="text-sm text-tinta-secundaria">
          Resumo dos últimos 12 meses das suas finanças pessoais.
        </p>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile label="Saldo total" value={formatarMoeda(kpis.saldoTotal)} />
        <StatTile
          label="Receita do mês"
          value={formatarMoeda(kpis.receitaMesAtual)}
          delta={kpis.variacaoReceita}
          upIsGood
        />
        <StatTile
          label="Despesa do mês"
          value={formatarMoeda(kpis.despesaMesAtual)}
          delta={kpis.variacaoDespesa}
          upIsGood={false}
        />
        <StatTile
          label="Taxa de poupança"
          value={formatarPercentual(kpis.taxaPoupancaMesAtual).replace("+", "")}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="lg:col-span-2">
          <SaldoTrendChart resumoMensal={resumoMensal} />
        </div>
        <ReceitaDespesaChart resumoMensal={resumoMensal} />
        <CategoriaBarChart dados={gastosPorCategoria} />
      </div>
    </div>
  );
}
