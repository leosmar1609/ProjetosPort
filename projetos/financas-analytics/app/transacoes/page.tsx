import type { Metadata } from "next";
import transacoesJson from "@/data/transacoes.json";
import type { Transacao } from "@/lib/types";
import { TransactionsTable } from "@/components/transacoes/TransactionsTable";

export const metadata: Metadata = {
  title: "Transações",
  description: "Todas as transações financeiras, com filtros e exportação para Excel.",
};

export default function TransacoesPage() {
  const transacoes = transacoesJson as Transacao[];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-tinta">Transações</h1>
        <p className="text-sm text-tinta-secundaria">
          Filtre, ordene e exporte suas transações pra Excel.
        </p>
      </div>

      <TransactionsTable transacoes={transacoes} />
    </div>
  );
}
