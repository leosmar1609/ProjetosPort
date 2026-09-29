import { ArrowDown, ArrowUp } from "lucide-react";
import clsx from "clsx";

interface StatTileProps {
  label: string;
  value: string;
  delta?: number | null;
  deltaLabel?: string;
  upIsGood?: boolean;
}

export function StatTile({ label, value, delta, deltaLabel = "vs mês anterior", upIsGood = true }: StatTileProps) {
  const temDelta = delta !== undefined && delta !== null;
  const subiu = temDelta && delta! >= 0;
  const positivo = temDelta && (upIsGood ? subiu : !subiu);

  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-borda bg-superficie p-5 shadow-cartao">
      <span className="text-sm text-tinta-secundaria">{label}</span>
      <span className="text-2xl font-semibold text-tinta">{value}</span>
      {temDelta && (
        <div className="flex items-center gap-1.5 text-xs">
          <span
            className={clsx(
              "flex items-center gap-0.5 font-medium",
              positivo ? "text-delta-positivo" : "text-delta-negativo",
            )}
          >
            {subiu ? <ArrowUp size={13} /> : <ArrowDown size={13} />}
            {Math.abs(delta!).toFixed(1)}%
          </span>
          <span className="text-tinta-suave">{deltaLabel}</span>
        </div>
      )}
    </div>
  );
}
