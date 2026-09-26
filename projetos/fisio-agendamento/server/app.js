import 'dotenv/config';
import express from 'express';

import rotasAuth from './routes/auth.js';
import rotasCodigos from './routes/codigos.js';
import rotasHorarios from './routes/horarios.js';
import rotasSessoes from './routes/sessoes.js';
import rotasContato from './routes/contato.js';
import rotasPerfil from './routes/perfil.js';
import rotasLembretes from './routes/lembretes.js';
import rotasDisponibilidade from './routes/disponibilidade.js';

const app = express();
app.use(express.json());

const api = express.Router();
api.use('/auth', rotasAuth);
api.use('/codigos', rotasCodigos);
api.use('/horarios', rotasHorarios);
api.use('/sessoes', rotasSessoes);
api.use('/contato', rotasContato);
api.use('/perfil', rotasPerfil);
api.use('/lembretes', rotasLembretes);
api.use('/disponibilidade', rotasDisponibilidade);

// Local (server/local.js) chama a API em /api/...
// Netlify invoca a function diretamente em /.netlify/functions/api/...
// As duas rotas apontam pro mesmo router, então o mesmo código serve os dois ambientes.
app.use('/api', api);
app.use('/.netlify/functions/api', api);

// Erros passados via next(erro) nas rotas (ex: falha de conexão com o banco) caem aqui,
// em vez de virar a página de erro HTML padrão do Express.
app.use((erro, req, res, next) => {
  console.error(erro);
  res.status(500).json({ erro: 'Erro no servidor. Tente de novo em instantes.' });
});

// Em produção no Netlify, os arquivos de /public são servidos direto pelo Netlify (veja netlify.toml)
// — essa app só cuida da API. O modo local (server/local.js) adiciona o static por conta própria.
export default app;
