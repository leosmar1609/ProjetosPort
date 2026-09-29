interface ChartLegendItem {
  cor: string;
  rotulo: string;
  forma?: "linha" | "retangulo";
}

export function ChartLegend({ itens }: { itens: ChartLegendItem[] }) {
  return (
    <div className="flex flex-wrap gap-4">
      {itens.map((item) => (
        <span key={item.rotulo} className="flex items-center gap-1.5 text-xs text-tinta-secundaria">
          {item.forma === "linha" ? (
            <span className="h-0.5 w-4 shrink-0 rounded-full" style={{ backgroundColor: item.cor }} />
          ) : (
            <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ backgroundColor: item.cor }} />
          )}
          {item.rotulo}
        </span>
      ))}
    </div>
  );
}
