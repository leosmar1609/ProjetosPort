// um dia em milissegundos. trato toda data como número (meia-noite em UTC) pra fuso horário nunca atrapalhar
export const DIA_MS = 86_400_000;

// nomes na ordem do getUTCDay(): 0 é domingo
const NOMES_DIAS = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];

// transforma 9 em "09"
const doisDigitos = (n) => String(n).padStart(2, '0');

// monta a data a partir de ano/mês/dia. no Date o mês começa em 0, por isso o -1
export function criarData(ano, mes, dia) {
  return Date.UTC(ano, mes - 1, dia);
}

// número -> "2026-09-24", o formato que vai nas respostas
export function paraIso(t) {
  const d = new Date(t);
  return `${d.getUTCFullYear()}-${doisDigitos(d.getUTCMonth() + 1)}-${doisDigitos(d.getUTCDate())}`;
}

// número -> "24/09/2026", o formato das frases de explicação
export function paraBr(t) {
  const d = new Date(t);
  return `${doisDigitos(d.getUTCDate())}/${doisDigitos(d.getUTCMonth() + 1)}/${d.getUTCFullYear()}`;
}

// data de hoje no horário de Brasília. o "en-CA" é só um truque pra já sair no formato AAAA-MM-DD
export function hoje() {
  const texto = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date());
  return lerTextoData(texto);
}

// aceita "2026-09-24", "24/09/2026" ou "hoje". devolve null se a data não existir
export function lerTextoData(texto) {
  if (typeof texto !== 'string') return null;
  const limpo = texto.trim().toLowerCase();
  if (limpo === 'hoje') return hoje();

  let ano, mes, dia;
  let m = limpo.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) [, ano, mes, dia] = m.map(Number);
  else {
    m = limpo.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!m) return null;
    [, dia, mes, ano] = m.map(Number);
  }

  // o Date aceita 30/02 e joga pra março sozinho, então confiro se voltou o mesmo dia que entrou
  const t = criarData(ano, mes, dia);
  const d = new Date(t);
  const existe = d.getUTCFullYear() === ano && d.getUTCMonth() === mes - 1 && d.getUTCDate() === dia;
  return existe ? t : null;
}

// atalhos pequenos que uso no resto do código
export const anoDe = (t) => new Date(t).getUTCFullYear();
export const diaDaSemana = (t) => new Date(t).getUTCDay();
export const nomeDiaSemana = (t) => NOMES_DIAS[diaDaSemana(t)];
export const ehFimDeSemana = (t) => diaDaSemana(t) === 0 || diaDaSemana(t) === 6;
export const somarDias = (t, n) => t + n * DIA_MS;
export const diferencaEmDias = (a, b) => Math.round((b - a) / DIA_MS);
