import crypto from 'node:crypto';
import express from 'express';
import { armazenamento } from '../armazenamento/index.js';
import { config } from '../config.js';
import { ErroApi } from '../http/erros.js';
import { problemaNoEmail } from '../http/email.js';
import { hashDe } from '../middleware/identificar.js';
import { limitar, renovacao } from '../middleware/limite.js';

// rotas de conta: criar chave e ver o uso do dia
const rotas = express.Router();

// POST /v1/chaves { "email": "..." } -> cria chave grátis. ela só aparece nessa resposta, no banco fica só o hash
rotas.post('/chaves', limitar, async (req, res, next) => {
  try {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const problema = problemaNoEmail(email);
    if (problema) {
      throw new ErroApi(422, 'email_invalido', problema, { campo: 'email', recebido: req.body?.email ?? null, exemplo: '{"email": "voce@exemplo.com"}' });
    }

    const banco = await armazenamento();
    // no máximo 3 chaves por e-mail
    if ((await banco.contarChavesDoEmail(email)) >= config.maxChavesPorEmail) {
      throw new ErroApi(409, 'limite_de_chaves', `Esse e-mail já tem ${config.maxChavesPorEmail} chaves ativas, o máximo por e-mail.`, { campo: 'email' });
    }

    // chave aleatória com prefixo pz_, pra ficar fácil reconhecer de onde ela é
    const chave = `pz_${crypto.randomBytes(20).toString('hex')}`;
    const prefixo = chave.slice(0, 10);
    await banco.criarChave({ email, hash: hashDe(chave), prefixo, plano: 'gratis' });

    res.status(201).json({
      explicacao: 'Chave criada. Guarde agora: ela não aparece de novo. Envie no header Authorization de cada requisição.',
      chave,
      prefixo,
      plano: 'gratis',
      limite_diario: config.limites.gratis,
      como_usar: { header: 'Authorization', valor: `Bearer ${chave}` },
    });
  } catch (erro) {
    next(erro);
  }
});

// GET /v1/uso -> quanto já usou hoje. essa rota não gasta requisição
rotas.get('/uso', async (req, res, next) => {
  try {
    const { dia, renovaEm } = renovacao();
    const usadas = await (await armazenamento()).consultarUso(req.cliente.identificador, dia);
    const { limite, tipo, plano, prefixo } = req.cliente;
    const restantes = Math.max(0, limite - usadas);
    const quem = tipo === 'chave' ? `A chave ${prefixo}…` : 'Sem chave, este IP';
    res.json({
      explicacao: `${quem} usou ${usadas} de ${limite} requisições hoje. Restam ${restantes}.`,
      tipo,
      plano,
      chave: tipo === 'chave' ? `${prefixo}…` : null,
      limite_diario: limite,
      usadas_hoje: usadas,
      restantes,
      renova_em: renovaEm.toISOString(),
    });
  } catch (erro) {
    next(erro);
  }
});

export default rotas;
