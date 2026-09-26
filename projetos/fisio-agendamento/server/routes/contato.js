import express from 'express';
import { pool } from '../../db/database.js';
import { exigirLogin } from '../middleware/auth.js';

const router = express.Router();

router.get('/', exigirLogin(['fisio']), async (req, res, next) => {
  try {
    const [mensagens] = await pool.execute('SELECT * FROM mensagens_contato ORDER BY criado_em DESC');
    res.json({ mensagens });
  } catch (erro) {
    next(erro);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { nome, telefone, mensagem } = req.body || {};

    if (!nome || !mensagem) {
      return res.status(400).json({ erro: 'Conte seu nome e um pouco sobre o que você está sentindo.' });
    }

    await pool.execute('INSERT INTO mensagens_contato (nome, telefone, mensagem) VALUES (?, ?, ?)', [
      nome,
      telefone || null,
      mensagem,
    ]);

    res.status(201).json({ ok: true });
  } catch (erro) {
    next(erro);
  }
});

export default router;
