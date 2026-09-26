import { criarData, paraIso, somarDias, nomeDiaSemana, lerTextoData } from './datas.js';
// anos que a API aceita. antes de 1990 algumas datas nacionais ainda nem eram feriado
export const ANO_MINIMO = 1990;
export const ANO_MAXIMO = 2100;

// feriados nacionais de data fixa. o "desde" é o ano em que a lei passou a valer
const NACIONAIS_FIXOS = [
  { dia: '01-01', nome: 'Confraternização Universal' },
  { dia: '04-21', nome: 'Tiradentes' },
  { dia: '05-01', nome: 'Dia do Trabalho' },
  { dia: '09-07', nome: 'Independência do Brasil' },
  { dia: '10-12', nome: 'Nossa Senhora Aparecida' },
  { dia: '11-02', nome: 'Finados' },
  { dia: '11-15', nome: 'Proclamação da República' },
  { dia: '11-20', nome: 'Dia Nacional de Zumbi e da Consciência Negra', desde: 2024 },
  { dia: '12-25', nome: 'Natal' },
];

// feriados que mudam de data todo ano porque dependem da Páscoa. "dias" é a distância até o domingo de Páscoa
const MOVEIS = [
  { dias: -48, nome: 'Carnaval (segunda-feira)', tipo: 'ponto_facultativo' },
  { dias: -47, nome: 'Carnaval (terça-feira)', tipo: 'ponto_facultativo' },
  { dias: -46, nome: 'Quarta-feira de Cinzas', tipo: 'ponto_facultativo', meio_periodo: true },
  { dias: -2, nome: 'Sexta-feira Santa', tipo: 'nacional' },
  { dias: 60, nome: 'Corpus Christi', tipo: 'ponto_facultativo' },
];

// antes de 2024 o 20/11 era feriado só em alguns estados, por isso o "ate: 2023"
const CONSCIENCIA_NEGRA_ESTADUAL = { dia: '11-20', nome: 'Dia da Consciência Negra', ate: 2023 };

// feriados estaduais mais adotados. municipal (aniversário da cidade, padroeiro) não entra
export const UFS = {
  AC: { nome: 'Acre', feriados: [
    { dia: '01-23', nome: 'Dia do Evangélico' },
    { dia: '06-15', nome: 'Aniversário do Acre' },
    { dia: '09-05', nome: 'Dia da Amazônia' },
    { dia: '11-17', nome: 'Assinatura do Tratado de Petrópolis' },
  ] },
  AL: { nome: 'Alagoas', feriados: [
    { dia: '06-24', nome: 'São João' },
    { dia: '06-29', nome: 'São Pedro' },
    { dia: '09-16', nome: 'Emancipação Política de Alagoas' },
    CONSCIENCIA_NEGRA_ESTADUAL,
  ] },
  AP: { nome: 'Amapá', feriados: [
    { dia: '03-19', nome: 'Dia de São José' },
    { dia: '09-13', nome: 'Criação do Território Federal do Amapá' },
    CONSCIENCIA_NEGRA_ESTADUAL,
  ] },
  AM: { nome: 'Amazonas', feriados: [
    { dia: '09-05', nome: 'Elevação do Amazonas à Categoria de Província' },
    CONSCIENCIA_NEGRA_ESTADUAL,
  ] },
  BA: { nome: 'Bahia', feriados: [{ dia: '07-02', nome: 'Independência da Bahia' }] },
  CE: { nome: 'Ceará', feriados: [
    { dia: '03-19', nome: 'Dia de São José' },
    { dia: '03-25', nome: 'Data Magna do Ceará' },
  ] },
  DF: { nome: 'Distrito Federal', feriados: [{ dia: '11-30', nome: 'Dia do Evangélico' }] },
  ES: { nome: 'Espírito Santo', feriados: [] },
  GO: { nome: 'Goiás', feriados: [] },
  MA: { nome: 'Maranhão', feriados: [{ dia: '07-28', nome: 'Adesão do Maranhão à Independência' }] },
  MT: { nome: 'Mato Grosso', feriados: [CONSCIENCIA_NEGRA_ESTADUAL] },
  MS: { nome: 'Mato Grosso do Sul', feriados: [{ dia: '10-11', nome: 'Criação do Estado de Mato Grosso do Sul' }] },
  MG: { nome: 'Minas Gerais', feriados: [] },
  PA: { nome: 'Pará', feriados: [{ dia: '08-15', nome: 'Adesão do Pará à Independência' }] },
  PB: { nome: 'Paraíba', feriados: [{ dia: '08-05', nome: 'Fundação do Estado da Paraíba' }] },
  PR: { nome: 'Paraná', feriados: [{ dia: '12-19', nome: 'Emancipação Política do Paraná' }] },
  PE: { nome: 'Pernambuco', feriados: [{ dia: '03-06', nome: 'Data Magna de Pernambuco' }] },
  PI: { nome: 'Piauí', feriados: [{ dia: '10-19', nome: 'Dia do Piauí' }] },
  RJ: { nome: 'Rio de Janeiro', feriados: [
    { dia: '04-23', nome: 'Dia de São Jorge' },
    CONSCIENCIA_NEGRA_ESTADUAL,
  ] },
  RN: { nome: 'Rio Grande do Norte', feriados: [{ dia: '10-03', nome: 'Mártires de Cunhaú e Uruaçu' }] },
  RS: { nome: 'Rio Grande do Sul', feriados: [{ dia: '09-20', nome: 'Revolução Farroupilha' }] },
  RO: { nome: 'Rondônia', feriados: [
    { dia: '01-04', nome: 'Criação do Estado de Rondônia' },
    { dia: '06-18', nome: 'Dia do Evangélico' },
  ] },
  RR: { nome: 'Roraima', feriados: [{ dia: '10-05', nome: 'Criação do Estado de Roraima' }] },
  SC: { nome: 'Santa Catarina', feriados: [] },
  SP: { nome: 'São Paulo', feriados: [{ dia: '07-09', nome: 'Revolução Constitucionalista' }] },
  SE: { nome: 'Sergipe', feriados: [{ dia: '07-08', nome: 'Emancipação Política de Sergipe' }] },
  TO: { nome: 'Tocantins', feriados: [
    { dia: '03-18', nome: 'Autonomia do Tocantins' },
    { dia: '09-08', nome: 'Nossa Senhora da Natividade' },
    { dia: '10-05', nome: 'Criação do Estado do Tocantins' },
  ] },
};

// pra frase sair certa: "no Rio de Janeiro", "na Bahia", "em São Paulo"
const NO = ['AC', 'AP', 'AM', 'CE', 'DF', 'ES', 'MA', 'PA', 'PR', 'PI', 'RJ', 'RN', 'RS', 'TO'];
const NA = ['BA', 'PB'];
export function emUf(uf) {
  const preposicao = NO.includes(uf) ? 'no' : NA.includes(uf) ? 'na' : 'em';
  return `${preposicao} ${UFS[uf].nome}`;
}

// domingo de Páscoa pelo algoritmo de Meeus/Jones/Butcher. é conta pronta, não precisa decorar cada letra
export function pascoa(ano) {
  const a = ano % 19;
  const b = Math.floor(ano / 100);
  const c = ano % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mes = Math.floor((h + l - 7 * m + 114) / 31);
  const dia = ((h + l - 7 * m + 114) % 31) + 1;
  return criarData(ano, mes, dia);
}

// confere se a regra já valia (ou ainda valia) naquele ano
const valeNoAno = (regra, ano) => (!regra.desde || ano >= regra.desde) && (!regra.ate || ano <= regra.ate);

// formato padrão de um feriado nas respostas
function montar(t, nome, tipo, abrangencia, extras = {}) {
  return { data: paraIso(t), dia_semana: nomeDiaSemana(t), nome, tipo, abrangencia, ...extras };
}

// guardo a lista de cada ano/UF pra não recalcular toda hora
const memo = new Map();

// lista do ano inteiro: nacionais fixos, móveis e os estaduais se tiver UF, tudo ordenado por data
export function feriadosDoAno(ano, uf = null) {
  const chave = `${ano}:${uf || 'BR'}`;
  if (memo.has(chave)) return memo.get(chave);

  const lista = [];
  for (const regra of NACIONAIS_FIXOS) {
    if (valeNoAno(regra, ano)) lista.push(montar(lerTextoData(`${ano}-${regra.dia}`), regra.nome, 'nacional', 'BR'));
  }

  const domingoDePascoa = pascoa(ano);
  for (const movel of MOVEIS) {
    const extras = movel.meio_periodo ? { meio_periodo: true, observacao: 'Expediente a partir das 14h; conta como dia útil.' } : {};
    lista.push(montar(somarDias(domingoDePascoa, movel.dias), movel.nome, movel.tipo, 'BR', extras));
  }

  if (uf) {
    for (const regra of UFS[uf].feriados) {
      if (valeNoAno(regra, ano)) lista.push(montar(lerTextoData(`${ano}-${regra.dia}`), regra.nome, 'estadual', uf));
    }
  }

  lista.sort((a, b) => (a.data < b.data ? -1 : a.data > b.data ? 1 : 0));
  memo.set(chave, lista);
  return lista;
}

// consulta rápida de "esse dia é feriado?". se dois caem no mesmo dia, o feriado de verdade ganha do ponto facultativo
const memoIndice = new Map();
export function feriadoDoDia(t, uf = null) {
  const iso = paraIso(t);
  const ano = Number(iso.slice(0, 4));
  const chave = `${ano}:${uf || 'BR'}`;
  let indice = memoIndice.get(chave);
  if (!indice) {
    indice = new Map();
    for (const f of feriadosDoAno(ano, uf)) {
      const atual = indice.get(f.data);
      if (!atual || atual.tipo === 'ponto_facultativo') indice.set(f.data, f);
    }
    memoIndice.set(chave, indice);
  }
  return indice.get(iso) || null;
}
