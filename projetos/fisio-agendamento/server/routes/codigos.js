import express from 'express';
import { pool } from '../../db/database.js';
import { gerarCodigo } from '../utils/codigo.js';
import { exigirLogin } from '../middleware/auth.js';

const router = express.Router();

const TIPOS_VALIDOS = ['sessao_unica', 'pacote', 'continuo'];

router.post('/', exigirLogin(['fisio']), async (req, res, next) => {
  try {
    const { tipo, quantidade_sessoes, validade, observacao } = req.body || {};

    if (!TIPOS_VALIDOS.includes(tipo)) {
      return res.status(400).json({ erro: 'Tipo de código inválido.' });
    }
    if (tipo === 'pacote' && (!quantidade_sessoes || quantidade_sessoes < 1)) {
      return res.status(400).json({ erro: 'Informe quantas sessões o pacote libera.' });
    }

    let codigo;
    let tentativas = 0;
    let jaExiste = true;
    do {
      codigo = gerarCodigo();
      const [linhas] = await pool.execute('SELECT 1 FROM codigos WHERE codigo = ?', [codigo]);
      jaExiste = linhas.length > 0;
      tentativas++;
    } while (jaExiste && tentativas < 5);

    const quantidade = tipo === 'pacote' ? quantidade_sessoes : tipo === 'sessao_unica' ? 1 : null;

    const [resultado] = await pool.execute(
      `INSERT INTO codigos (codigo, tipo, quantidade_sessoes, validade, observacao)
       VALUES (?, ?, ?, ?, ?)`,
      [codigo, tipo, quantidade, validade || null, observacao || null]
    );

    const [linhas] = await pool.execute('SELECT * FROM codigos WHERE id = ?', [resultado.insertId]);
    res.status(201).json({ codigo: linhas[0] });
  } catch (erro) {
    next(erro);
  }
});

router.get('/', exigirLogin(['fisio']), async (req, res, next) => {
  try {
    const [codigos] = await pool.execute('SELECT * FROM codigos ORDER BY criado_em DESC');
    res.json({ codigos });
  } catch (erro) {
    next(erro);
  }
});

export default router;
