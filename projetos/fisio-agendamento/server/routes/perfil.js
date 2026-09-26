import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import multer from 'multer';
import { pool } from '../../db/database.js';
import { exigirLogin } from '../middleware/auth.js';
import { gerarHash, conferir } from '../utils/senha.js';

const router = express.Router();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PASTA_UPLOADS = path.join(__dirname, '..', '..', 'public', 'uploads', 'perfil');
fs.mkdirSync(PASTA_UPLOADS, { recursive: true });

const TIPOS_ACEITOS = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, PASTA_UPLOADS),
    filename: (req, file, cb) => {
      const extensao = TIPOS_ACEITOS[file.mimetype];
      cb(null, `${req.usuario.id}-${crypto.randomBytes(6).toString('hex')}${extensao}`);
    },
  }),
  limits: { fileSize: 3 * 1024 * 1024 }, // 3MB
  fileFilter: (req, file, cb) => {
    if (!TIPOS_ACEITOS[file.mimetype]) {
      return cb(new Error('Envie uma imagem JPG, PNG ou WEBP.'));
    }
    cb(null, true);
  },
});

router.get('/', exigirLogin(), async (req, res, next) => {
  try {
    const [linhas] = await pool.execute(
      'SELECT id, tipo, nome, email, foto_url FROM usuarios WHERE id = ?',
      [req.usuario.id]
    );
    res.json({ usuario: linhas[0] });
  } catch (erro) {
    next(erro);
  }
});

router.patch('/senha', exigirLogin(), async (req, res, next) => {
  try {
    const { senha_atual, nova_senha } = req.body || {};

    if (!senha_atual || !nova_senha) {
      return res.status(400).json({ erro: 'Informe a senha atual e a nova senha.' });
    }
    if (nova_senha.length < 6) {
      return res.status(400).json({ erro: 'A nova senha precisa ter pelo menos 6 caracteres.' });
    }

    const [linhas] = await pool.execute('SELECT senha_hash FROM usuarios WHERE id = ?', [req.usuario.id]);
    const usuario = linhas[0];

    if (!usuario || !conferir(senha_atual, usuario.senha_hash)) {
      return res.status(401).json({ erro: 'Senha atual incorreta.' });
    }

    await pool.execute('UPDATE usuarios SET senha_hash = ? WHERE id = ?', [
      gerarHash(nova_senha),
      req.usuario.id,
    ]);

    res.json({ ok: true });
  } catch (erro) {
    next(erro);
  }
});

router.post('/foto', exigirLogin(), (req, res, next) => {
  upload.single('foto')(req, res, async (erroUpload) => {
    try {
      if (erroUpload) {
        return res.status(400).json({ erro: erroUpload.message || 'Não foi possível enviar a imagem.' });
      }
      if (!req.file) {
        return res.status(400).json({ erro: 'Escolha uma imagem.' });
      }

      const [linhas] = await pool.execute('SELECT foto_url FROM usuarios WHERE id = ?', [req.usuario.id]);
      const fotoAntiga = linhas[0]?.foto_url;

      const fotoUrl = `/uploads/perfil/${req.file.filename}`;
      await pool.execute('UPDATE usuarios SET foto_url = ? WHERE id = ?', [fotoUrl, req.usuario.id]);

      if (fotoAntiga) {
        const caminhoAntigo = path.join(PASTA_UPLOADS, path.basename(fotoAntiga));
        fs.unlink(caminhoAntigo, () => {});
      }

      res.json({ foto_url: fotoUrl });
    } catch (erro) {
      next(erro);
    }
  });
});

export default router;
