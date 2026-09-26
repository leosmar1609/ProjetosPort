import crypto from 'node:crypto';
import { armazenamento } from '../armazenamento/index.js';
import { config } from '../config.js';
import { ErroApi } from '../http/erros.js';

// sha256 de um texto. uso pra guardar chave e IP sem guardar o valor de verdade
export const hashDe = (texto) => crypto.createHash('sha256').update(texto).digest('hex');

// descobre quem está chamando: com chave usa o plano dela, sem chave conta pelo IP
export async function identificar(req, res, next) {
  try {
    const chave = lerChave(req);

    if (!chave) {
      // no Netlify o IP real vem nesse header. fora dele eu ignoro, senão qualquer um trocava o IP e furava o limite
      const noNetlify = Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME);
      const ip = (noNetlify && req.headers['x-nf-client-connection-ip']) || req.socket.remoteAddress || 'desconhecido';
      req.cliente = { tipo: 'anonimo', plano: 'anonimo', limite: config.limites.anonimo, identificador: `ip:${hashDe(ip).slice(0, 24)}` };
      return next();
    }

    // chave enviada mas não encontrada é 401. não deixo cair pro anônimo, senão a pessoa nem percebe que a chave está errada
    const registro = await (await armazenamento()).buscarChavePorHash(hashDe(chave));
    if (!registro) {
      throw new ErroApi(401, 'chave_invalida',
        'Essa chave de API não existe ou foi desativada. Confira se copiou inteira (começa com "pz_") ou crie outra em POST /v1/chaves.');
    }
    req.cliente = { tipo: 'chave', plano: registro.plano, limite: config.limites[registro.plano] ?? config.limites.gratis, identificador: `chave:${registro.id}`, prefixo: registro.prefixo };
    next();
  } catch (erro) {
    next(erro);
  }
}

// aceita "Authorization: Bearer pz_..." ou "X-Api-Key: pz_..."
function lerChave(req) {
  const auth = req.headers.authorization;
  if (auth) {
    const m = auth.match(/^Bearer\s+(\S+)$/i);
    if (!m) {
      throw new ErroApi(401, 'autorizacao_mal_formatada', 'O header Authorization precisa ser no formato "Bearer pz_suachave".');
    }
    return m[1];
  }
  return req.headers['x-api-key'] || null;
}
