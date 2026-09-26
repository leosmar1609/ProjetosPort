import express from 'express';
import { pool } from '../../db/database.js';
import { exigirLogin } from '../middleware/auth.js';
import { gerarHorarios } from '../servicos/disponibilidade.js';

const router = express.Router();

router.get('/', exigirLogin(['fisio']), async (req, res, next) => {
  try {
    const [linhas] = await pool.execute(
      'SELECT * FROM disponibilidade_padrao ORDER BY dia_semana, hora_inicio'
    );
    res.json({ disponibilidade: linhas });
  } catch (erro) {
    next(erro);
  }
});

router.post('/', exigirLogin(['fisio']), async (req, res, next) => {
  try {
    const { dia_semana, hora_inicio, hora_fim, duracao_minutos } = req.body || {};

    if (dia_semana === undefined || dia_semana === null || !hora_inicio || !hora_fim) {
      return res.status(400).json({ erro: 'Informe o dia da semana e os horários de início e fim.' });
    }
    if (hora_inicio >= hora_fim) {
      return res.status(400).json({ erro: 'O horário de início precisa ser antes do horário de fim.' });
    }

    const [resultado] = await pool.execute(
      'INSERT INTO disponibilidade_padrao (dia_semana, hora_inicio, hora_fim, duracao_minutos) VALUES (?, ?, ?, ?)',
      [dia_semana, hora_inicio, hora_fim, duracao_minutos || 50]
    );

    const [linhas] = await pool.execute('SELECT * FROM disponibilidade_padrao WHERE id = ?', [
      resultado.insertId,
    ]);
    res.status(201).json({ disponibilidade: linhas[0] });
  } catch (erro) {
    next(erro);
  }
});

router.delete('/:id', exigirLogin(['fisio']), async (req, res, next) => {
  try {
    await pool.execute('DELETE FROM disponibilidade_padrao WHERE id = ?', [req.params.id]);
    res.json({ ok: true });
  } catch (erro) {
    next(erro);
  }
});

// Preenche a agenda (tabela horarios) a partir do padrão semanal configurado.
router.post('/gerar', exigirLogin(['fisio']), async (req, res, next) => {
  try {
    const resultado = await gerarHorarios();
    if (resultado.semTemplate) {
      return res.status(400).json({ erro: 'Configure pelo menos um horário de atendimento antes de gerar a agenda.' });
    }
    res.json(resultado);
  } catch (erro) {
    next(erro);
  }
});

export default router;
