export function formatarMoeda(valor: number) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function formatarMoedaCompacta(valor: number) {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    notation: "compact",
    maximumFractionDigits: 1,
  });
}

const MESES_ABREV = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
];

export function formatarMesChave(chave: string) {
  const [ano, mes] = chave.split("-").map(Number);
  return `${MESES_ABREV[mes - 1]}/${String(ano).slice(2)}`;
}

export function formatarDataCurta(dataISO: string) {
  const [ano, mes, dia] = dataISO.split("-").map(Number);
  return `${String(dia).padStart(2, "0")}/${String(mes).padStart(2, "0")}/${ano}`;
}

export function formatarPercentual(valor: number) {
  return `${valor >= 0 ? "+" : ""}${valor.toFixed(1)}%`;
}
