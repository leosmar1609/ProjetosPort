import express from 'express';
import './config.js';
import v1 from './rotas/v1.js';
import { especificacao } from './openapi.js';
import { ErroApi } from './http/erros.js';
import { cors, tempoDeResposta } from './middleware/cabecalhos.js';

// app principal. tiro o header que entrega que é Express
const app = express();
app.disable('x-powered-by');

// vale pra tudo: CORS, tempo de resposta e leitura de JSON no corpo (no máximo 10kb)
app.use(cors);
app.use(tempoDeResposta);
app.use(express.json({ limit: '10kb' }));

// rotas da API: saúde do servidor, especificação OpenAPI e a v1
const api = express.Router();
api.get('/saude', (req, res) => res.json({ status: 'ok' }));
api.get('/openapi.json', (req, res) => res.json(especificacao));
api.use('/v1', v1);

// local a API fica na raiz. no Netlify a function recebe o caminho com /.netlify/functions/api na frente
app.use('/', api);
app.use('/.netlify/functions/api', api);

// tratador de erro: ErroApi sai com o status dele, JSON quebrado vira 400 e o resto é 500 sem vazar detalhe
app.use((erro, req, res, next) => {
  if (erro instanceof ErroApi) return res.status(erro.status).json(erro.paraJson());
  if (erro.type === 'entity.parse.failed') {
    return res.status(400).json(new ErroApi(400, 'json_invalido', 'O corpo da requisição não é um JSON válido. Confira aspas e vírgulas.').paraJson());
  }
  console.error(erro);
  res.status(500).json(new ErroApi(500, 'erro_interno', 'Erro no servidor. Tente de novo em instantes.').paraJson());
});

export default app;
