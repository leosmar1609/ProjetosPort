import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import type { Transacao } from "@/lib/types";

export async function exportarTransacoesExcel(transacoes: Transacao[], nomeArquivo = "transacoes.xlsx") {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Painel Financeiro";
  workbook.created = new Date();

  const planilha = workbook.addWorksheet("Transações");
  planilha.columns = [
    { header: "Data", key: "data", width: 14 },
    { header: "Descrição", key: "descricao", width: 28 },
    { header: "Categoria", key: "categoria", width: 20 },
    { header: "Tipo", key: "tipo", width: 12 },
    { header: "Conta", key: "conta", width: 18 },
    { header: "Valor", key: "valor", width: 14 },
  ];
  planilha.getRow(1).font = { bold: true };
  planilha.getRow(1).eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF0F0EE" } };
  });

  for (const t of transacoes) {
    planilha.addRow({
      data: t.data,
      descricao: t.descricao,
      categoria: t.categoria,
      tipo: t.tipo === "receita" ? "Receita" : "Despesa",
      conta: t.conta,
      valor: t.tipo === "despesa" ? -t.valor : t.valor,
    });
  }
  planilha.getColumn("valor").numFmt = '"R$" #,##0.00;[Red]-"R$" #,##0.00';

  const receitaTotal = transacoes
    .filter((t) => t.tipo === "receita")
    .reduce((acc, t) => acc + t.valor, 0);
  const despesaTotal = transacoes
    .filter((t) => t.tipo === "despesa")
    .reduce((acc, t) => acc + t.valor, 0);

  const resumo = workbook.addWorksheet("Resumo");
  resumo.columns = [
    { header: "Indicador", key: "indicador", width: 24 },
    { header: "Valor", key: "valor", width: 18 },
  ];
  resumo.getRow(1).font = { bold: true };
  resumo.addRow({ indicador: "Receita total", valor: receitaTotal });
  resumo.addRow({ indicador: "Despesa total", valor: despesaTotal });
  resumo.addRow({ indicador: "Saldo", valor: receitaTotal - despesaTotal });
  resumo.addRow({ indicador: "Total de transações", valor: transacoes.length });
  resumo.getColumn("valor").numFmt = '"R$" #,##0.00';

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  saveAs(blob, nomeArquivo);
}
