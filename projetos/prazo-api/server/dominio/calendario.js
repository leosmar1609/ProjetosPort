import { ehFimDeSemana, diaDaSemana, somarDias, diferencaEmDias, paraIso } from './datas.js';
import { feriadoDoDia } from './feriados.js';

// o coração da API: diz se o dia é útil e o motivo quando não é. a ordem é feriado, fim de semana, ponto facultativo
export function avaliarDia(t, uf, opcoes = {}) {
  const facultativosSaoFolga = (opcoes.pontosFacultativos || 'folga') === 'folga';
  const feriado = feriadoDoDia(t, uf);
  const fimDeSemana = ehFimDeSemana(t);

  if (feriado && feriado.tipo !== 'ponto_facultativo') {
    return { util: false, motivo: feriado.nome, feriado, fimDeSemana };
  }
  if (fimDeSemana) {
    return { util: false, motivo: diaDaSemana(t) === 0 ? 'Domingo' : 'Sábado', feriado, fimDeSemana };
  }
  if (feriado && !feriado.meio_periodo && facultativosSaoFolga) {
    return { util: false, motivo: `${feriado.nome} (ponto facultativo)`, feriado, fimDeSemana };
  }
  return { util: true, motivo: null, feriado, fimDeSemana };
}

// anda um dia por vez até achar um dia útil (o próprio dia conta)
export function proximoDiaUtil(t, uf, opcoes) {
  let atual = t;
  while (!avaliarDia(atual, uf, opcoes).util) atual = somarDias(atual, 1);
  return atual;
}

// soma n dias úteis, ou volta se n for negativo. o dia inicial não conta, igual prazo de processo
export function somarDiasUteis(t, n, uf, opcoes) {
  const passo = n >= 0 ? 1 : -1;
  let atual = t;
  let contados = 0;
  while (contados < Math.abs(n)) {
    atual = somarDias(atual, passo);
    if (avaliarDia(atual, uf, opcoes).util) contados++;
  }
  return atual;
}

// conta os dias úteis entre as duas datas, incluindo a primeira e a última
export function contarDiasUteis(a, b, uf, opcoes) {
  let uteis = 0;
  let finsDeSemana = 0;
  let feriados = 0;
  for (let t = a; t <= b; t = somarDias(t, 1)) {
    const dia = avaliarDia(t, uf, opcoes);
    if (dia.util) uteis++;
    else if (dia.fimDeSemana) finsDeSemana++;
    else feriados++;
  }
  return { uteis, finsDeSemana, feriados, corridos: diferencaEmDias(a, b) + 1 };
}

// feriados do intervalo e se cada um mudou a conta (feriado no sábado não muda nada)
export function feriadosNoPeriodo(a, b, uf, opcoes) {
  const [inicio, fim] = a <= b ? [a, b] : [b, a];
  const lista = [];
  for (let t = inicio; t <= fim; t = somarDias(t, 1)) {
    const dia = avaliarDia(t, uf, opcoes);
    if (!dia.feriado) continue;
    lista.push({
      data: paraIso(t),
      dia_semana: dia.feriado.dia_semana,
      nome: dia.feriado.nome,
      tipo: dia.feriado.tipo,
      afetou_contagem: !dia.util && !dia.fimDeSemana,
    });
  }
  return lista;
}
