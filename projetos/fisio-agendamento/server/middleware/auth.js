import { verificarToken } from '../utils/token.js';
import { pool } from '../../db/database.js';

export function exigirLogin(tiposPermitidos) {
  return async function (req, res, next) {
    const cabecalho = req.headers.authorization || '';
    const token = cabecalho.startsWith('Bearer ') ? cabecalho.slice(7) : null;

    if (!token) {
      return res.status(401).json({ erro: 'Faça login pra continuar.' });
    }

    let payload;
    try {
      payload = verificarToken(token);
    } catch {
      return res.status(401).json({ erro: 'Sessão inválida ou expirada. Faça login de novo.' });
    }

    try {
      const [linhas] = await pool.execute('SELECT id, tipo, nome, email FROM usuarios WHERE id = ?', [
        payload.sub,
      ]);
      const usuario = linhas[0];

      if (!usuario) {
        return res.status(401).json({ erro: 'Usuário não encontrado.' });
      }
      if (tiposPermitidos && !tiposPermitidos.includes(usuario.tipo)) {
        return res.status(403).json({ erro: 'Você não tem permissão pra acessar isso.' });
      }

      req.usuario = usuario;
      next();
    } catch (erro) {
      next(erro);
    }
  };
}
