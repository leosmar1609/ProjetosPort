"use client";

import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ResumoMensal } from "@/lib/finance";
import { formatarMesChave, formatarMoeda, formatarMoedaCompacta } from "@/lib/format";
import { ChartCard } from "@/components/charts/ChartCard";
import { ChartTooltip } from "@/components/charts/ChartTooltip";
import { CORES } from "@/components/charts/cores";

interface SaldoTrendChartProps {
  resumoMensal: ResumoMensal[];
}

export function SaldoTrendChart({ resumoMensal }: SaldoTrendChartProps) {
  const [verTabela, setVerTabela] = useState(false);

  const dados = useMemo(() => {
    let acumulado = 0;
    return resumoMensal.map((m) => {
      acumulado += m.saldo;
      return { chave: m.chave, saldoAcumulado: acumulado };
    });
  }, [resumoMensal]);

  return (
    <ChartCard
      titulo="Saldo acumulado"
      subtitulo="Evolução do saldo nos últimos 12 meses"
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
                <th className="py-2 font-medium">Mês</th>
                <th className="py-2 text-right font-medium">Saldo acumulado</th>
              </tr>
            </thead>
            <tbody>
              {dados.map((d) => (
                <tr key={d.chave} className="border-b border-borda/60 last:border-0">
                  <td className="py-2 text-tinta-secundaria">{formatarMesChave(d.chave)}</td>
                  <td className="py-2 text-right font-medium tabular-nums text-tinta">
                    {formatarMoeda(d.saldoAcumulado)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dados} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
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
                cursor={{ stroke: CORES.eixo, strokeWidth: 1 }}
                content={
                  <ChartTooltip formatarValor={formatarMoeda} formatarRotulo={formatarMesChave} />
                }
              />
              <Area
                type="monotone"
                dataKey="saldoAcumulado"
                name="Saldo acumulado"
                stroke={CORES.cat1}
                strokeWidth={2}
                fill={CORES.cat1}
                fillOpacity={0.1}
                dot={{ r: 4, fill: CORES.cat1, stroke: CORES.superficie, strokeWidth: 2 }}
                activeDot={{ r: 5, fill: CORES.cat1, stroke: CORES.superficie, strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </ChartCard>
  );
}
