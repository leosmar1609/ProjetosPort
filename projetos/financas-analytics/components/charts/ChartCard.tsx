import type { ReactNode } from "react";

interface ChartCardProps {
  titulo: string;
  subtitulo?: string;
  legenda?: ReactNode;
  children: ReactNode;
}

export function ChartCard({ titulo, subtitulo, legenda, children }: ChartCardProps) {
  return (
    <div className="rounded-2xl border border-borda bg-superficie p-5 shadow-cartao">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold text-tinta">{titulo}</h2>
          {subtitulo && <p className="text-sm text-tinta-secundaria">{subtitulo}</p>}
        </div>
        {legenda}
      </div>
      {children}
    </div>
  );
}
