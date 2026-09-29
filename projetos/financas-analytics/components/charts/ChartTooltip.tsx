interface ItemTooltip {
  name?: string;
  value?: number | string;
  color?: string;
  dataKey?: string;
}

interface ChartTooltipProps {
  active?: boolean;
  label?: string;
  payload?: ItemTooltip[];
  formatarValor?: (valor: number) => string;
  formatarRotulo?: (label: string) => string;
}

export function ChartTooltip({
  active,
  label,
  payload,
  formatarValor = (v) => String(v),
  formatarRotulo = (l) => l,
}: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="rounded-xl border border-borda bg-superficie px-3 py-2 shadow-cartao">
      {label && (
        <p className="mb-1.5 text-xs font-medium text-tinta-secundaria">{formatarRotulo(label)}</p>
      )}
      <ul className="flex flex-col gap-1">
        {payload.map((item) => (
          <li key={item.dataKey ?? item.name} className="flex items-center gap-2 text-xs">
            <span className="h-0.5 w-3 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
            <span className="text-tinta-secundaria">{item.name}</span>
            <span className="ml-auto font-semibold text-tinta">
              {typeof item.value === "number" ? formatarValor(item.value) : item.value}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
