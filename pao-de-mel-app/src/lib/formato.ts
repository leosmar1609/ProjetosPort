export function brl(n: number) {
  const [inteiro, centavos] = Math.abs(n).toFixed(2).split('.');
  return (n < 0 ? '-' : '') + 'R$ ' + inteiro.replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ',' + centavos;
}

// Aceita "12,50", "1.234,50" e "12.50"
export function num(s: string) {
  const t = s.trim();
  return parseFloat(t.includes(',') ? t.replace(/\./g, '').replace(',', '.') : t);
}

const pad = (n: number) => String(n).padStart(2, '0');
const isoDe = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const hojeISO = () => isoDe(new Date());
export function diasAtrasISO(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return isoDe(d);
}

// Dias entre duas datas ISO (b - a)
export const diasEntre = (a: string, b: string) => Math.round((Date.parse(b) - Date.parse(a)) / 86400000);

// 0 = domingo ... 6 = sábado
export function diaDaSemana(iso: string) {
  const [a, m, d] = iso.split('-').map(Number);
  return new Date(a, m - 1, d).getDay();
}

export const dataBR = (iso: string) => iso.split('-').reverse().join('/');
export const hojeBR = () => dataBR(hojeISO());

export function isoDeBR(br: string): string | null {
  const m = br.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return null;
  const [, d, mes, a] = m.map(Number);
  if (mes < 1 || mes > 12 || d < 1 || d > 31) return null;
  return `${a}-${pad(mes)}-${pad(d)}`;
}

export type Periodo = 'hoje' | 'semana' | 'mes' | 'tudo';
export const PERIODOS: { valor: Periodo; label: string }[] = [
  { valor: 'hoje', label: 'Hoje' },
  { valor: 'semana', label: '7 dias' },
  { valor: 'mes', label: 'Este mês' },
  { valor: 'tudo', label: 'Tudo' },
];

export function inicioPeriodo(p: Periodo) {
  if (p === 'hoje') return hojeISO();
  if (p === 'semana') return diasAtrasISO(6);
  if (p === 'mes') return hojeISO().slice(0, 8) + '01';
  return '0000-00-00';
}
