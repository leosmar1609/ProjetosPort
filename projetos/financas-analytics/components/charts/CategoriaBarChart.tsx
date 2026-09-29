"use client";

import { useState } from "react";
import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { ResumoCategoria } from "@/lib/finance";
import { formatarMoeda, formatarMoedaCompacta } from "@/lib/format";
import { ChartCard } from "@/components/charts/ChartCard";
import { ChartTooltip } from "@/components/charts/ChartTooltip";
import { CORES } from "@/components/charts/cores";

interface CategoriaBarChartProps {
  dados: ResumoCategoria[];
}

export function CategoriaBarChart({ dados }: CategoriaBarChartProps) {
  const [verTabela, setVerTabela] = useState(false);
  const altura = Math.max(dados.length * 36, 180);

  return (
    <ChartCard
      titulo="Gastos por categoria"
      subtitulo="Despesas do mês atual, do maior pro menor"
      legenda={
        <button
          type="button"
          onClick={() => setVerTabela((v) => !v)}
          className="text-xs font-medium text-cat-1 hover:underline"
        >
          {verTabela ? "Ver gráfico" : "Ver dados"}
        </button>
      }
    >
      {verTabela ? (
        <div className="max-h-72 overflow-y-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-borda text-left text-tinta-secundaria">
                <th className="py-2 font-medium">Categoria</th>
                <th className="py-2 text-right font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {dados.map((d) => (
                <tr key={d.categoria} className="border-b border-borda/60 last:border-0">
                  <td className="py-2 text-tinta-secundaria">{d.categoria}</td>
                  <td className="py-2 text-right font-medium tabular-nums text-tinta">
                    {formatarMoeda(d.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ height: altura }} className="w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={dados}
              layout="vertical"
              margin={{ top: 8, right: 56, left: 8, bottom: 0 }}
            >
              <CartesianGrid horizontal={false} stroke={CORES.grade} strokeDasharray="0" />
              <XAxis
                type="number"
                tickFormatter={(v: number) => formatarMoedaCompacta(v)}
                tick={{ fill: CORES.tintaSuave, fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="categoria"
                tick={{ fill: CORES.tintaSuave, fontSize: 12 }}
                axisLine={{ stroke: CORES.eixo }}
                tickLine={false}
                width={120}
              />
              <Tooltip
                cursor={{ fill: CORES.grade, opacity: 0.4 }}
                content={<ChartTooltip formatarValor={formatarMoeda} />}
              />
              <Bar dataKey="total" name="Total" fill={CORES.cat1} radius={[0, 4, 4, 0]} maxBarSize={22}>
                <LabelList
                  dataKey="total"
                  position="right"
                  formatter={(v: unknown) => formatarMoedaCompacta(Number(v))}
                  style={{ fill: "var(--color-tinta-secundaria)", fontSize: 12 }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </ChartCard>
  );
}
