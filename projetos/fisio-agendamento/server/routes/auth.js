import express from 'express';
import { pool, transacao } from '../../db/database.js';
import { gerarHash, conferir } from '../utils/senha.js';
import { gerarToken } from '../utils/token.js';
import { exigirLogin } from '../middleware/auth.js';
import { hojeLocal } from '../utils/data.js';

const router = express.Router();

router.post('/cadastro', async (req, res, next) => {
  try {
    const { nome, email, senha, codigo, telefone, problema_relatado } = req.body || {};

    if (!nome || !email || !senha || !codigo) {
      return res.status(400).json({ erro: 'Preencha nome, e-mail, senha e o código de acesso.' });
    }
    if (senha.length < 6) {
      return res.status(400).json({ erro: 'A senha precisa ter pelo menos 6 caracteres.' });
    }

    const [existentes] = await pool.execute('SELECT id FROM usuarios WHERE email = ?', [email]);
    if (existentes[0]) {
      return res.status(409).json({ erro: 'Já existe uma conta com esse e-mail.' });
    }

    const codigoNormalizado = codigo.trim().toUpperCase();
    const [codigosEncontrados] = await pool.execute('SELECT * FROM codigos WHERE codigo = ?', [
      codigoNormalizado,
    ]);
    const registroCodigo = codigosEncontrados[0];

    if (!registroCodigo) {
      return res.status(400).json({ erro: 'Código não encontrado. Confira com a fisioterapeuta.' });
    }
    if (registroCodigo.usado_por) {
      return res.status(400).json({ erro: 'Esse código já foi usado.' });
    }
    if (registroCodigo.validade && registroCodigo.validade < hojeLocal()) {
      return res.status(400).json({ erro: 'Esse código expirou. Peça um novo.' });
    }

    const usuarioId = await transacao(async (conn) => {
      const senhaHash = gerarHash(senha);
      const [resultado] = await conn.execute(
        `INSERT INTO usuarios (tipo, nome, email, senha_hash, telefone, problema_relatado)
         VALUES ('paciente', ?, ?, ?, ?, ?)`,
        [nome, email, senhaHash, telefone || null, problema_relatado || null]
      );

      await conn.execute('UPDATE codigos SET usado_por = ?, usado_em = NOW() WHERE id = ?', [
        resultado.insertId,
        registroCodigo.id,
      ]);

      return resultado.insertId;
    });

    const [linhas] = await pool.execute('SELECT id, tipo, nome, email FROM usuarios WHERE id = ?', [
      usuarioId,
    ]);
    const usuario = linhas[0];

    res.status(201).json({ token: gerarToken(usuario), usuario });
  } catch (erro) {
    next(erro);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, senha } = req.body || {};
    if (!email || !senha) {
      return res.status(400).json({ erro: 'Informe e-mail e senha.' });
    }

    const [linhas] = await pool.execute('SELECT * FROM usuarios WHERE email = ?', [email]);
    const usuario = linhas[0];

    if (!usuario || !conferir(senha, usuario.senha_hash)) {
      return res.status(401).json({ erro: 'E-mail ou senha incorretos.' });
    }

    res.json({
      token: gerarToken(usuario),
      usuario: { id: usuario.id, tipo: usuario.tipo, nome: usuario.nome, email: usuario.email },
    });
  } catch (erro) {
    next(erro);
  }
});

router.get('/me', exigirLogin(), (req, res) => {
  res.json({ usuario: req.usuario });
});

export default router;
