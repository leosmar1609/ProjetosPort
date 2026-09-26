import { pool } from '../../db/database.js';
import { enviarEmail } from '../utils/email.js';

const SITE_URL = process.env.SITE_URL || 'http://localhost:3000';

function formatarDataBr(data) {
  const [ano, mes, dia] = data.split('-');
  return `${dia}/${mes}/${ano}`;
}

function corpoLembrete24h({ nome, data, hora }) {
  const texto =
    `Oi, ${nome}!\n\n` +
    `Passando para lembrar que sua sessão de fisioterapia com a Anna Barbosa é amanhã, ` +
    `${formatarDataBr(data)} às ${hora}.\n\n` +
    `Precisa remarcar ou cancelar? Até 24h antes você consegue fazer isso sozinho(a), ` +
    `direto no site: ${SITE_URL}/paciente/painel.html\n\n` +
    `Até lá!\nAnna Barbosa Fisioterapia`;

  const html =
    `<p>Oi, ${nome}!</p>` +
    `<p>Passando para lembrar que sua sessão de fisioterapia com a Anna Barbosa é <strong>amanhã, ` +
    `${formatarDataBr(data)} às ${hora}</strong>.</p>` +
    `<p>Precisa remarcar ou cancelar? Até 24h antes você consegue fazer isso sozinho(a), ` +
    `direto no <a href="${SITE_URL}/paciente/painel.html">site</a>.</p>` +
    `<p>Até lá!<br>Anna Barbosa Fisioterapia</p>`;

  return { assunto: 'Lembrete: sua sessão de fisioterapia é amanhã', texto, html };
}

function corpoLembrete1h({ nome, hora }) {
  const texto =
    `Oi, ${nome}!\n\n` +
    `Só lembrando que sua sessão de fisioterapia com a Anna Barbosa é daqui a pouco, hoje às ${hora}.\n\n` +
    `Te espero!\nAnna Barbosa Fisioterapia`;

  const html =
    `<p>Oi, ${nome}!</p>` +
    `<p>Só lembrando que sua sessão de fisioterapia com a Anna Barbosa é <strong>daqui a pouco, hoje às ${hora}</strong>.</p>` +
    `<p>Te espero!<br>Anna Barbosa Fisioterapia</p>`;

  return { assunto: 'Sua sessão é daqui a 1 hora', texto, html };
}

async function buscarSessoesNaJanela(coluna, horas) {
  const [linhas] = await pool.execute(
    `SELECT s.id, s.numero_sessao, u.nome AS paciente_nome, u.email AS paciente_email,
            h.data, h.hora
     FROM sessoes s
     JOIN horarios h ON h.id = s.horario_id
     JOIN usuarios u ON u.id = s.paciente_id
     WHERE s.status = 'agendada'
       AND s.${coluna} IS NULL
       AND TIMESTAMP(h.data, h.hora) > NOW()
       AND TIMESTAMP(h.data, h.hora) <= NOW() + INTERVAL ${horas} HOUR`
  );
  return linhas;
}

async function processarJanela({ coluna, horas, montarMensagem }) {
  const sessoes = await buscarSessoesNaJanela(coluna, horas);
  let enviados = 0;
  const erros = [];

  for (const sessao of sessoes) {
    try {
      const { assunto, texto, html } = montarMensagem({
        nome: sessao.paciente_nome,
        data: sessao.data,
        hora: sessao.hora,
      });

      await enviarEmail({ para: sessao.paciente_email, assunto, texto, html });
      await pool.execute(`UPDATE sessoes SET ${coluna} = NOW() WHERE id = ?`, [sessao.id]);
      enviados++;
    } catch (erro) {
      erros.push({ sessao_id: sessao.id, erro: erro.message });
    }
  }

  return { enviados, erros };
}

// Verifica as sessões agendadas e manda lembrete por e-mail pra quem está entrando na janela
// de 24h ou de 1h antes do horário — cada sessão recebe cada lembrete só uma vez (controlado
// pelas colunas lembrete_24h_enviado_em / lembrete_1h_enviado_em).
export async function verificarLembretes() {
  const resultado24h = await processarJanela({
    coluna: 'lembrete_24h_enviado_em',
    horas: 24,
    montarMensagem: corpoLembrete24h,
  });

  const resultado1h = await processarJanela({
    coluna: 'lembrete_1h_enviado_em',
    horas: 1,
    montarMensagem: corpoLembrete1h,
  });

  return { lembrete_24h: resultado24h, lembrete_1h: resultado1h };
}
