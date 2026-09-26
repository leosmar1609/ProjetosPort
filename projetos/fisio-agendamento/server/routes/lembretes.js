import express from 'express';
import { verificarLembretes } from '../servicos/lembretes.js';

const router = express.Router();

// Rota pensada pra ser chamada por um agendador (cron local, Netlify Scheduled Function,
// cron-job.org, etc.) — não é uma rota de usuário logado, por isso usa uma chave simples
// em vez de token de sessão.
router.post('/verificar', async (req, res, next) => {
  try {
    const chaveEsperada = process.env.LEMBRETES_SECRET;
    const chaveRecebida = req.headers['x-lembretes-secret'];

    if (!chaveEsperada || chaveRecebida !== chaveEsperada) {
      return res.status(401).json({ erro: 'Chave inválida.' });
    }

    const resultado = await verificarLembretes();
    res.json(resultado);
  } catch (erro) {
    next(erro);
  }
});

export default router;
