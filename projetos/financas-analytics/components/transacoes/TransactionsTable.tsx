"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, Download, Search } from "lucide-react";
import type { Transacao } from "@/lib/types";
import { chaveMes } from "@/lib/finance";
import { formatarDataCurta, formatarMesChave, formatarMoeda } from "@/lib/format";
import { exportarTransacoesExcel } from "@/lib/exportarExcel";

type Campo = "data" | "descricao" | "categoria" | "tipo" | "valor";
type Direcao = "asc" | "desc";

const POR_PAGINA = 20;

interface TransactionsTableProps {
  transacoes: Transacao[];
}

export function TransactionsTable({ transacoes }: TransactionsTableProps) {
  const [busca, setBusca] = useState("");
  const [mes, setMes] = useState("todos");
  const [categoria, setCategoria] = useState("todas");
  const [tipo, setTipo] = useState<"todas" | "receita" | "despesa">("todas");
  const [ordenacao, setOrdenacao] = useState<{ campo: Campo; direcao: Direcao }>({
    campo: "data",
    direcao: "desc",
  });
  const [pagina, setPagina] = useState(1);
  const [exportando, setExportando] = useState(false);

  const meses = useMemo(
    () => Array.from(new Set(transacoes.map((t) => chaveMes(t.data)))).sort(),
    [transacoes],
  );
  const categorias = useMemo(
    () => Array.from(new Set(transacoes.map((t) => t.categoria))).sort(),
    [transacoes],
  );

  function atualizarFiltro(fn: () => void) {
    fn();
    setPagina(1);
  }

  const filtradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return transacoes.filter((t) => {
      if (mes !== "todos" && chaveMes(t.data) !== mes) return false;
      if (categoria !== "todas" && t.categoria !== categoria) return false;
      if (tipo !== "todas" && t.tipo !== tipo) return false;
      if (termo && !t.descricao.toLowerCase().includes(termo)) return false;
      return true;
    });
  }, [transacoes, busca, mes, categoria, tipo]);

  const ordenadas = useMemo(() => {
    const copia = [...filtradas];
    const { campo, direcao } = ordenacao;
    copia.sort((a, b) => {
      let comparacao = 0;
      if (campo === "valor") comparacao = a.valor - b.valor;
      else comparacao = String(a[campo]).localeCompare(String(b[campo]));
      return direcao === "asc" ? comparacao : -comparacao;
    });
    return copia;
  }, [filtradas, ordenacao]);

  const totalPaginas = Math.max(1, Math.ceil(ordenadas.length / POR_PAGINA));
  const paginaAtual = Math.min(pagina, totalPaginas);
  const visiveis = ordenadas.slice((paginaAtual - 1) * POR_PAGINA, paginaAtual * POR_PAGINA);

  function alternarOrdenacao(campo: Campo) {
    setOrdenacao((atual) =>
      atual.campo === campo
        ? { campo, direcao: atual.direcao === "asc" ? "desc" : "asc" }
        : { campo, direcao: "asc" },
    );
  }

  function IconeOrdenacao({ campo }: { campo: Campo }) {
    if (ordenacao.campo !== campo) return <ArrowUpDown size={13} className="text-tinta-suave" />;
    return ordenacao.direcao === "asc" ? (
      <ArrowUp size={13} className="text-cat-1" />
    ) : (
      <ArrowDown size={13} className="text-cat-1" />
    );
  }

  async function handleExportar() {
    setExportando(true);
    try {
      await exportarTransacoesExcel(ordenadas, `transacoes-${mes === "todos" ? "todas" : mes}.xlsx`);
    } finally {
      setExportando(false);
    }
  }

  const colunas: { campo: Campo; rotulo: string; alinhamento?: "right" }[] = [
    { campo: "data", rotulo: "Data" },
    { campo: "descricao", rotulo: "Descrição" },
    { campo: "categoria", rotulo: "Categoria" },
    { campo: "tipo", rotulo: "Tipo" },
    { campo: "valor", rotulo: "Valor", alinhamento: "right" },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex h-10 min-w-48 flex-1 items-center gap-2 rounded-lg border border-borda bg-superficie px-3">
          <Search size={16} className="text-tinta-suave" />
          <input
            type="text"
            placeholder="Buscar por descrição..."
            value={busca}
            onChange={(e) => atualizarFiltro(() => setBusca(e.target.value))}
            className="h-full flex-1 bg-transparent text-sm text-tinta outline-none placeholder:text-tinta-suave"
          />
        </div>

        <select
          value={mes}
          onChange={(e) => atualizarFiltro(() => setMes(e.target.value))}
          className="h-10 rounded-lg border border-borda bg-superficie px-3 text-sm text-tinta"
        >
          <option value="todos">Todos os meses</option>
          {meses.map((m) => (
            <option key={m} value={m}>
              {formatarMesChave(m)}
            </option>
          ))}
        </select>

        <select
          value={categoria}
          onChange={(e) => atualizarFiltro(() => setCategoria(e.target.value))}
          className="h-10 rounded-lg border border-borda bg-superficie px-3 text-sm text-tinta"
        >
          <option value="todas">Todas as categorias</option>
          {categorias.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <select
          value={tipo}
          onChange={(e) => atualizarFiltro(() => setTipo(e.target.value as typeof tipo))}
          className="h-10 rounded-lg border border-borda bg-superficie px-3 text-sm text-tinta"
        >
          <option value="todas">Receitas e despesas</option>
          <option value="receita">Só receitas</option>
          <option value="despesa">Só despesas</option>
        </select>

        <button
          type="button"
          onClick={handleExportar}
          disabled={exportando || ordenadas.length === 0}
          className="ml-auto flex h-10 items-center gap-2 rounded-lg bg-cat-1 px-4 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
        >
          <Download size={16} />
          {exportando ? "Gerando..." : "Baixar Excel"}
        </button>
      </div>

      <p className="text-sm text-tinta-secundaria">
        {ordenadas.length} {ordenadas.length === 1 ? "transação encontrada" : "transações encontradas"}
      </p>

      <div className="overflow-x-auto rounded-2xl border border-borda bg-superficie shadow-cartao">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-borda">
              {colunas.map((col) => (
                <th
                  key={col.campo}
                  className={`px-4 py-3 text-left font-medium text-tinta-secundaria ${
                    col.alinhamento === "right" ? "text-right" : ""
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => alternarOrdenacao(col.campo)}
                    className={`flex items-center gap-1 hover:text-tinta ${
                      col.alinhamento === "right" ? "ml-auto flex-row-reverse" : ""
                    }`}
                  >
                    {col.rotulo}
                    <IconeOrdenacao campo={col.campo} />
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visiveis.length === 0 ? (
              <tr>
                <td colSpan={colunas.length} className="px-4 py-10 text-center text-tinta-secundaria">
                  Nenhuma transação encontrada com esses filtros.
                </td>
              </tr>
            ) : (
              visiveis.map((t) => (
                <tr key={t.id} className="border-b border-borda/60 last:border-0 hover:bg-plano">
                  <td className="whitespace-nowrap px-4 py-2.5 tabular-nums text-tinta-secundaria">
                    {formatarDataCurta(t.data)}
                  </td>
                  <td className="px-4 py-2.5 text-tinta">{t.descricao}</td>
                  <td className="px-4 py-2.5 text-tinta-secundaria">{t.categoria}</td>
                  <td className="px-4 py-2.5">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        t.tipo === "receita"
                          ? "bg-bom/10 text-delta-positivo"
                          : "bg-critico/10 text-delta-negativo"
                      }`}
                    >
                      {t.tipo === "receita" ? "Receita" : "Despesa"}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right font-medium tabular-nums text-tinta">
                    {t.tipo === "despesa" ? "-" : ""}
                    {formatarMoeda(t.valor)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPaginas > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-tinta-secundaria">
            Página {paginaAtual} de {totalPaginas}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={paginaAtual === 1}
              onClick={() => setPagina((p) => p - 1)}
              className="rounded-lg border border-borda px-3 py-1.5 text-tinta disabled:opacity-40"
            >
              Anterior
            </button>
            <button
              type="button"
              disabled={paginaAtual === totalPaginas}
              onClick={() => setPagina((p) => p + 1)}
              className="rounded-lg border border-borda px-3 py-1.5 text-tinta disabled:opacity-40"
            >
              Próxima
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
