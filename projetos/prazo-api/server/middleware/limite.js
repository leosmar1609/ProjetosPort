import { armazenamento } from '../armazenamento/index.js';
import { ErroApi } from '../http/erros.js';
import { hoje, paraIso, somarDias } from '../dominio/datas.js';

// dia de hoje e quando o contador zera: meia-noite de Brasília, que é 03:00 em UTC
export function renovacao() {
  const dia = hoje();
  return { dia: paraIso(dia), renovaEm: new Date(somarDias(dia, 1) + 3 * 3600_000) };
}

// soma 1 no uso do dia, manda os headers X-RateLimit-* e bloqueia com 429 quando passa do limite
export async function limitar(req, res, next) {
  try {
    const { dia, renovaEm } = renovacao();
    const total = await (await armazenamento()).registrarUso(req.cliente.identificador, dia);
    const limite = req.cliente.limite;
    const restantes = Math.max(0, limite - total);

    res.set('X-RateLimit-Limit', String(limite));
    res.set('X-RateLimit-Remaining', String(restantes));
    res.set('X-RateLimit-Reset', String(Math.floor(renovaEm.getTime() / 1000)));

    if (total > limite) {
      const segundos = Math.ceil((renovaEm.getTime() - Date.now()) / 1000);
      res.set('Retry-After', String(segundos));
      const dica = req.cliente.tipo === 'anonimo'
        ? ' Crie uma chave grátis em POST /v1/chaves pra ter um limite maior.'
        : '';
      throw new ErroApi(429, 'limite_diario_atingido',
        `Você usou as ${limite} requisições de hoje. O limite renova à meia-noite (horário de Brasília).${dica}`,
        { limite_diario: limite, renova_em: renovaEm.toISOString() });
    }
    next();
  } catch (erro) {
    next(erro);
  }
}
