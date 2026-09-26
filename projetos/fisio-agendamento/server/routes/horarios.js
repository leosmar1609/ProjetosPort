import express from 'express';
import { pool } from '../../db/database.js';
import { exigirLogin } from '../middleware/auth.js';
import { hojeLocal } from '../utils/data.js';

const router = express.Router();

router.post('/', exigirLogin(['fisio']), async (req, res, next) => {
  try {
    const { data, hora, duracao_minutos } = req.body || {};

    if (!data || !hora) {
      return res.status(400).json({ erro: 'Informe data e hora.' });
    }

    const [existentes] = await pool.execute('SELECT 1 FROM horarios WHERE data = ? AND hora = ?', [
      data,
      hora,
    ]);
    if (existentes[0]) {
      return res.status(409).json({ erro: 'Já existe um horário cadastrado nesse dia e hora.' });
    }

    const [resultado] = await pool.execute(
      'INSERT INTO horarios (data, hora, duracao_minutos) VALUES (?, ?, ?)',
      [data, hora, duracao_minutos || 50]
    );

    const [linhas] = await pool.execute('SELECT * FROM horarios WHERE id = ?', [resultado.insertId]);
    res.status(201).json({ horario: linhas[0] });
  } catch (erro) {
    next(erro);
  }
});

router.get('/', exigirLogin(), async (req, res, next) => {
  try {
    const somenteLivres = req.query.status === 'livre';
    const hoje = hojeLocal();

    const [horarios] = somenteLivres
      ? await pool.execute(`SELECT * FROM horarios WHERE status = 'livre' AND data >= ? ORDER BY data, hora`, [hoje])
      : await pool.execute('SELECT * FROM horarios WHERE data >= ? ORDER BY data, hora', [hoje]);

    res.json({ horarios });
  } catch (erro) {
    next(erro);
  }
});

router.delete('/:id', exigirLogin(['fisio']), async (req, res, next) => {
  try {
    const [linhas] = await pool.execute('SELECT * FROM horarios WHERE id = ?', [req.params.id]);
    const horario = linhas[0];

    if (!horario) {
      return res.status(404).json({ erro: 'Horário não encontrado.' });
    }
    if (horario.status !== 'livre') {
      return res.status(400).json({ erro: 'Só é possível remover horários livres (sem agendamento).' });
    }

    await pool.execute('DELETE FROM horarios WHERE id = ?', [req.params.id]);
    res.json({ ok: true });
  } catch (erro) {
    next(erro);
  }
});

// Marca um horário livre como indisponível (ex: compromisso pessoal), sem apagar ele — assim ele
// continua aparecendo na agenda da fisio (cinza) e pode ser liberado de novo depois.
router.patch('/:id/bloquear', exigirLogin(['fisio']), async (req, res, next) => {
  try {
    const [linhas] = await pool.execute('SELECT * FROM horarios WHERE id = ?', [req.params.id]);
    const horario = linhas[0];

    if (!horario) {
      return res.status(404).json({ erro: 'Horário não encontrado.' });
    }
    if (horario.status !== 'livre') {
      return res.status(400).json({ erro: 'Só dá pra bloquear um horário livre (sem agendamento).' });
    }

    await pool.execute(`UPDATE horarios SET status = 'bloqueado' WHERE id = ?`, [req.params.id]);
    res.json({ ok: true });
  } catch (erro) {
    next(erro);
  }
});

router.patch('/:id/desbloquear', exigirLogin(['fisio']), async (req, res, next) => {
  try {
    const [linhas] = await pool.execute('SELECT * FROM horarios WHERE id = ?', [req.params.id]);
    const horario = linhas[0];

    if (!horario) {
      return res.status(404).json({ erro: 'Horário não encontrado.' });
    }
    if (horario.status !== 'bloqueado') {
      return res.status(400).json({ erro: 'Esse horário não está bloqueado.' });
    }

    await pool.execute(`UPDATE horarios SET status = 'livre' WHERE id = ?`, [req.params.id]);
    res.json({ ok: true });
  } catch (erro) {
    next(erro);
  }
});

export default router;
