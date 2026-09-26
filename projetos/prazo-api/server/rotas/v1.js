import express from 'express';
import { ErroApi, sugerir } from '../http/erros.js';
import { identificar } from '../middleware/identificar.js';
import rotasCalendario from './calendario.js';
import rotasChaves from './chaves.js';

// lista de todas as rotas. uso no índice GET /v1 e nas mensagens de 404 e 405
export const ROTAS = [
  { metodo: 'GET', caminho: '/v1/prazo', descricao: 'Soma (ou subtrai) dias úteis a uma data.', exemplo: '/v1/prazo?inicio=hoje&dias=15&uf=SP' },
  { metodo: 'GET', caminho: '/v1/dias-uteis', descricao: 'Conta os dias úteis entre duas datas.', exemplo: '/v1/dias-uteis?inicio=2026-11-01&fim=2026-12-31&uf=SP' },
  { metodo: 'GET', caminho: '/v1/dia-util', descricao: 'Diz se uma data é dia útil e qual é o próximo.', exemplo: '/v1/dia-util?data=2026-10-12&uf=SP' },
  { metodo: 'GET', caminho: '/v1/feriados', descricao: 'Feriados e pontos facultativos de um ano.', exemplo: '/v1/feriados?ano=2026&uf=RJ' },
  { metodo: 'GET', caminho: '/v1/feriados/proximos', descricao: 'Os próximos feriados a partir de hoje.', exemplo: '/v1/feriados/proximos?uf=SP&quantidade=5' },
  { metodo: 'GET', caminho: '/v1/ufs', descricao: 'UFs aceitas e seus feriados estaduais.', exemplo: '/v1/ufs' },
  { metodo: 'POST', caminho: '/v1/chaves', descricao: 'Cria uma chave de API grátis.', exemplo: '/v1/chaves' },
  { metodo: 'GET', caminho: '/v1/uso', descricao: 'Quanto do limite diário já foi usado.', exemplo: '/v1/uso' },
];

const v1 = express.Router();

// GET /v1 -> índice com todas as rotas e exemplos
v1.get('/', (req, res) => {
  res.json({
    explicacao: 'Prazo: API de dias úteis e feriados do Brasil. Funciona sem chave (limite menor); com chave, envie "Authorization: Bearer pz_...".',
    documentacao: '/docs',
    especificacao_openapi: '/openapi.json',
    rotas: ROTAS,
  });
});

// daqui pra baixo toda rota já sabe quem está chamando (req.cliente)
v1.use(identificar);
v1.use(rotasCalendario);
v1.use(rotasChaves);

// nenhuma rota respondeu: se o caminho existe com outro método é 405, se não existe é 404 com sugestão
v1.use((req, res, next) => {
  const caminho = `/v1${req.path.replace(/\/$/, '')}`;
  const mesmaRota = ROTAS.filter((r) => r.caminho === caminho);
  if (mesmaRota.length) {
    const metodos = mesmaRota.map((r) => r.metodo).join(', ');
    return next(new ErroApi(405, 'metodo_nao_permitido', `${caminho} aceita ${metodos}, não ${req.method}.`, { aceitos: metodos }));
  }
  const parecida = sugerir(caminho, ROTAS.map((r) => r.caminho));
  next(new ErroApi(404, 'rota_nao_encontrada',
    parecida ? `${req.method} ${caminho} não existe. Você quis dizer ${parecida}?` : `${req.method} ${caminho} não existe.`,
    { rotas_disponiveis: ROTAS.map((r) => `${r.metodo} ${r.caminho}`) }));
});

export default v1;
