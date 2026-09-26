// testes das regras de data e feriado, direto nas funções, sem servidor
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lerTextoData, paraIso } from '../server/dominio/datas.js';
import { pascoa, feriadosDoAno } from '../server/dominio/feriados.js';
import { avaliarDia, somarDiasUteis, contarDiasUteis, proximoDiaUtil } from '../server/dominio/calendario.js';

const d = (texto) => lerTextoData(texto);

test('Páscoa cai na data certa em anos conhecidos', () => {
  assert.equal(paraIso(pascoa(2024)), '2024-03-31');
  assert.equal(paraIso(pascoa(2025)), '2025-04-20');
  assert.equal(paraIso(pascoa(2026)), '2026-04-05');
  assert.equal(paraIso(pascoa(2027)), '2027-03-28');
});

test('feriados móveis de 2026 saem da Páscoa', () => {
  const porNome = Object.fromEntries(feriadosDoAno(2026).map((f) => [f.nome, f.data]));
  assert.equal(porNome['Sexta-feira Santa'], '2026-04-03');
  assert.equal(porNome['Carnaval (terça-feira)'], '2026-02-17');
  assert.equal(porNome['Corpus Christi'], '2026-06-04');
});

test('Consciência Negra: nacional a partir de 2024, estadual antes disso só onde havia lei', () => {
  const tipo = (ano, uf) => feriadosDoAno(ano, uf).find((f) => f.data.endsWith('-11-20'))?.tipo ?? null;
  assert.equal(tipo(2023, null), null);
  assert.equal(tipo(2023, 'RJ'), 'estadual');
  assert.equal(tipo(2023, 'SP'), null);
  assert.equal(tipo(2024, 'SP'), 'nacional');
  assert.equal(feriadosDoAno(2024, 'RJ').filter((f) => f.data === '2024-11-20').length, 1);
});

test('lê datas em AAAA-MM-DD e DD/MM/AAAA, e recusa datas que não existem', () => {
  assert.equal(paraIso(d('24/09/2026')), '2026-09-24');
  assert.equal(d('2026-02-30'), null);
  assert.equal(d('2026-13-01'), null);
  assert.equal(d('ontem'), null);
});

test('feriado estadual só vale no próprio estado', () => {
  assert.equal(avaliarDia(d('2026-07-09'), 'SP').util, false);
  assert.equal(avaliarDia(d('2026-07-09'), 'RJ').util, true);
});

test('ponto facultativo depende da opção; Quarta de Cinzas é sempre útil', () => {
  const carnaval = d('2026-02-17');
  assert.equal(avaliarDia(carnaval, null).util, false);
  assert.equal(avaliarDia(carnaval, null, { pontosFacultativos: 'util' }).util, true);
  assert.equal(avaliarDia(d('2026-02-18'), null).util, true);
});

test('prazo pula fim de semana e feriado, sem contar o dia inicial', () => {
  // 24/09/2026 é quinta e no caminho tem o 12/10, segunda-feira de feriado
  assert.equal(paraIso(somarDiasUteis(d('2026-09-24'), 15, 'SP')), '2026-10-16');
  // começando na sexta, 1 dia útil já é a segunda
  assert.equal(paraIso(somarDiasUteis(d('2026-09-25'), 1, 'SP')), '2026-09-28');
});

test('prazo para trás funciona com dias negativos', () => {
  assert.equal(paraIso(somarDiasUteis(d('2026-10-13'), -1, 'SP')), '2026-10-09');
});

test('contagem inclui as duas pontas', () => {
  const c = contarDiasUteis(d('2026-10-05'), d('2026-10-16'), 'SP');
  assert.deepEqual(c, { uteis: 9, finsDeSemana: 2, feriados: 1, corridos: 12 });
});

test('próximo dia útil depois do Natal de 2026 (sexta)', () => {
  assert.equal(paraIso(proximoDiaUtil(d('2026-12-25'), 'SP')), '2026-12-28');
});
