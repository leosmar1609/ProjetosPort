import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import app from '../server/app.js';
import { definirArmazenamento } from '../server/armazenamento/index.js';
import { criarArmazenamentoMemoria } from '../server/armazenamento/memoria.js';
import { limparCache } from '../server/http/cache.js';
import { config } from '../server/config.js';

// sobe o servidor numa porta livre e zera o armazenamento e o cache antes de cada teste
let servidor;
let base;

before(async () => {
  servidor = app.listen(0);
  await new Promise((ok) => servidor.once('listening', ok));
  base = `http://localhost:${servidor.address().port}`;
});
after(() => servidor.close());
beforeEach(() => {
  definirArmazenamento(criarArmazenamentoMemoria());
  limparCache();
});

// atalho pra fazer GET e já ler o JSON
const get = async (caminho, headers = {}) => {
  const r = await fetch(base + caminho, { headers });
  return { status: r.status, headers: r.headers, corpo: await r.json() };
};

test('prazo devolve a data final e uma explicação em português', async () => {
  const r = await get('/v1/prazo?inicio=2026-09-24&dias=15&uf=SP');
  assert.equal(r.status, 200);
  assert.equal(r.corpo.data_final, '2026-10-16');
  assert.match(r.corpo.explicacao, /16\/10\/2026/);
  assert.match(r.corpo.explicacao, /Nossa Senhora Aparecida/);
  assert.equal(r.corpo.feriados_no_periodo.find((f) => f.data === '2026-10-12').afetou_contagem, true);
});

test('segunda chamada igual vem do cache', async () => {
  const caminho = '/v1/feriados?ano=2026&uf=RJ';
  assert.equal((await get(caminho)).headers.get('x-cache'), 'MISS');
  assert.equal((await get(caminho)).headers.get('x-cache'), 'HIT');
});

test('parâmetro com erro de digitação recebe sugestão', async () => {
  const r = await get('/v1/prazo?inico=2026-09-24&dias=15');
  assert.equal(r.status, 422);
  assert.equal(r.corpo.erro.codigo, 'parametro_desconhecido');
  assert.match(r.corpo.erro.mensagem, /Você quis dizer "inicio"/);
});

test('data inválida explica o formato esperado', async () => {
  const r = await get('/v1/dia-util?data=2026-02-30');
  assert.equal(r.status, 422);
  assert.equal(r.corpo.erro.codigo, 'data_invalida');
  assert.equal(r.corpo.erro.campo, 'data');
});

test('nome do estado por extenso sugere a sigla', async () => {
  const r = await get('/v1/feriados?uf=bahia');
  assert.equal(r.status, 422);
  assert.match(r.corpo.erro.mensagem, /"BA"/);
});

test('rota errada sugere a certa; método errado vira 405', async () => {
  const r = await get('/v1/feriado');
  assert.equal(r.status, 404);
  assert.match(r.corpo.erro.mensagem, /\/v1\/feriados/);
  assert.equal((await get('/v1/chaves')).status, 405);
});

test('sem chave, o limite anônimo bloqueia com 429 e Retry-After', async () => {
  let r;
  for (let i = 0; i <= config.limites.anonimo; i++) r = await get(`/v1/dia-util?data=2026-10-${String((i % 28) + 1).padStart(2, '0')}`);
  assert.equal(r.status, 429);
  assert.equal(r.corpo.erro.codigo, 'limite_diario_atingido');
  assert.ok(Number(r.headers.get('retry-after')) > 0);
});

test('chave criada funciona e tem limite maior', async () => {
  const criada = await fetch(`${base}/v1/chaves`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'teste@exemplo.com' }),
  });
  assert.equal(criada.status, 201);
  const { chave } = await criada.json();
  assert.match(chave, /^pz_[0-9a-f]{40}$/);

  const r = await get('/v1/prazo?inicio=hoje&dias=5', { Authorization: `Bearer ${chave}` });
  assert.equal(r.status, 200);
  assert.equal(r.headers.get('x-ratelimit-limit'), String(config.limites.gratis));

  const uso = await get('/v1/uso', { Authorization: `Bearer ${chave}` });
  assert.equal(uso.corpo.usadas_hoje, 1);
});

test('chave inexistente responde 401 em vez de cair no anônimo', async () => {
  const r = await get('/v1/prazo?inicio=hoje&dias=5', { Authorization: 'Bearer pz_naoexiste' });
  assert.equal(r.status, 401);
  assert.equal(r.corpo.erro.codigo, 'chave_invalida');
});

test('JSON mal formatado no corpo vira 400 com mensagem clara', async () => {
  const r = await fetch(`${base}/v1/chaves`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{email:' });
  assert.equal(r.status, 400);
  assert.equal((await r.json()).erro.codigo, 'json_invalido');
});
