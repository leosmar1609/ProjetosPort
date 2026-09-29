"use client";

import { useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { ResumoMensal } from "@/lib/finance";
import { formatarMesChave, formatarMoeda, formatarMoedaCompacta } from "@/lib/format";
import { ChartCard } from "@/components/charts/ChartCard";
import { ChartLegend } from "@/components/charts/ChartLegend";
import { ChartTooltip } from "@/components/charts/ChartTooltip";
import { CORES } from "@/components/charts/cores";

interface ReceitaDespesaChartProps {
  resumoMensal: ResumoMensal[];
}

export function ReceitaDespesaChart({ resumoMensal }: ReceitaDespesaChartProps) {
  const [verTabela, setVerTabela] = useState(false);

  return (
    <ChartCard
      titulo="Receitas x despesas"
      subtitulo="Comparativo mensal dos últimos 12 meses"
      legenda={
        <div className="flex items-center gap-4">
          <ChartLegend
            itens={[
              { cor: "#2a78d6", rotulo: "Receita", forma: "retangulo" },
              { cor: "#eb6834", rotulo: "Despesa", forma: "retangulo" },
            ]}
          />
          <button
            type="button"
            onClick={() => setVerTabela((v) => !v)}
            className="text-xs font-medium text-cat-1 hover:underline"
          >
            {verTabela ? "Ver gráfico" : "Ver dados"}
          </button>
        </div>
      }
    >
      {verTabela ? (
        <div className="max-h-72 overflow-y-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-borda text-left text-tinta-secundaria">
                <th className="py-2 font-medium">Mês</th>
                <th className="py-2 text-right font-medium">Receita</th>
                <th className="py-2 text-right font-medium">Despesa</th>
              </tr>
            </thead>
            <tbody>
              {resumoMensal.map((m) => (
                <tr key={m.chave} className="border-b border-borda/60 last:border-0">
                  <td className="py-2 text-tinta-secundaria">{formatarMesChave(m.chave)}</td>
                  <td className="py-2 text-right font-medium tabular-nums text-tinta">
                    {formatarMoeda(m.receita)}
                  </td>
                  <td className="py-2 text-right font-medium tabular-nums text-tinta">
                    {formatarMoeda(m.despesa)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={resumoMensal}
              barGap={2}
              barCategoryGap="24%"
              margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
            >
              <CartesianGrid vertical={false} stroke={CORES.grade} strokeDasharray="0" />
              <XAxis
                dataKey="chave"
                tickFormatter={formatarMesChave}
                tick={{ fill: CORES.tintaSuave, fontSize: 12 }}
                axisLine={{ stroke: CORES.eixo }}
                tickLine={false}
              />
              <YAxis
                tickFormatter={(v: number) => formatarMoedaCompacta(v)}
                tick={{ fill: CORES.tintaSuave, fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                width={64}
              />
              <Tooltip
                cursor={{ fill: CORES.grade, opacity: 0.4 }}
                content={
                  <ChartTooltip formatarValor={formatarMoeda} formatarRotulo={formatarMesChave} />
                }
              />
              <Bar dataKey="receita" name="Receita" fill={CORES.cat1} radius={[4, 4, 0, 0]} maxBarSize={22} />
              <Bar dataKey="despesa" name="Despesa" fill={CORES.cat2} radius={[4, 4, 0, 0]} maxBarSize={22} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </ChartCard>
  );
}
