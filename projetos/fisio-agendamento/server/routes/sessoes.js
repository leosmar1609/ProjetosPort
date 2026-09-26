import express from 'express';
import { pool, transacao } from '../../db/database.js';
import { exigirLogin } from '../middleware/auth.js';

const router = express.Router();

const PRAZO_MINIMO_HORAS = 24;

function horarioComoData(data, hora) {
  return new Date(`${data}T${hora}:00`);
}

function horasAte(dataHoraAlvo) {
  return (dataHoraAlvo.getTime() - Date.now()) / (1000 * 60 * 60);
}

async function buscarCodigoDoPaciente(pacienteId) {
  const [linhas] = await pool.execute('SELECT * FROM codigos WHERE usado_por = ?', [pacienteId]);
  return linhas[0];
}

async function contarSessoesAtivas(pacienteId) {
  const [linhas] = await pool.execute(
    `SELECT COUNT(*) AS total FROM sessoes WHERE paciente_id = ? AND status != 'cancelada'`,
    [pacienteId]
  );
  return linhas[0].total;
}

async function saldoDisponivel(pacienteId) {
  const codigo = await buscarCodigoDoPaciente(pacienteId);
  if (!codigo) return { liberadas: 0, usadas: 0, restantes: 0, ilimitado: false };

  const usadas = await contarSessoesAtivas(pacienteId);

  if (codigo.tipo === 'continuo') {
    return { liberadas: null, usadas, restantes: null, ilimitado: true };
  }

  const liberadas = codigo.quantidade_sessoes || 1;
  return { liberadas, usadas, restantes: Math.max(0, liberadas - usadas), ilimitado: false };
}

// Paciente agenda uma sessão num horário livre.
router.post('/', exigirLogin(['paciente']), async (req, res, next) => {
  try {
    const { horario_id } = req.body || {};
    if (!horario_id) {
      return res.status(400).json({ erro: 'Escolha um horário.' });
    }

    const codigo = await buscarCodigoDoPaciente(req.usuario.id);
    if (!codigo) {
      return res.status(400).json({ erro: 'Não encontramos o código vinculado à sua conta.' });
    }

    const saldo = await saldoDisponivel(req.usuario.id);
    if (!saldo.ilimitado && saldo.restantes <= 0) {
      return res.status(400).json({ erro: 'Você não tem sessões disponíveis. Fale com a fisioterapeuta.' });
    }

    const [linhasHorario] = await pool.execute('SELECT * FROM horarios WHERE id = ?', [horario_id]);
    const horario = linhasHorario[0];
    if (!horario || horario.status !== 'livre') {
      return res.status(409).json({ erro: 'Esse horário não está mais disponível. Escolha outro.' });
    }

    const numeroSessao = (await contarSessoesAtivas(req.usuario.id)) + 1;

    const sessaoId = await transacao(async (conn) => {
      const [linhas] = await conn.execute(`SELECT status FROM horarios WHERE id = ? FOR UPDATE`, [horario_id]);
      if (!linhas[0] || linhas[0].status !== 'livre') {
        throw Object.assign(new Error('Esse horário não está mais disponível. Escolha outro.'), { status: 409 });
      }

      await conn.execute(`UPDATE horarios SET status = 'ocupado' WHERE id = ?`, [horario_id]);
      const [resultado] = await conn.execute(
        `INSERT INTO sessoes (paciente_id, horario_id, codigo_id, numero_sessao, status)
         VALUES (?, ?, ?, ?, 'agendada')`,
        [req.usuario.id, horario_id, codigo.id, numeroSessao]
      );
      return resultado.insertId;
    });

    res.status(201).json({ sessao_id: sessaoId, numero_sessao: numeroSessao });
  } catch (erro) {
    if (erro.status) return res.status(erro.status).json({ erro: erro.message });
    next(erro);
  }
});

// Sessões do paciente logado, com o saldo de sessões.
router.get('/minhas', exigirLogin(['paciente']), async (req, res, next) => {
  try {
    const [sessoes] = await pool.execute(
      `SELECT s.id, s.numero_sessao, s.status, h.data, h.hora, h.duracao_minutos
       FROM sessoes s JOIN horarios h ON h.id = s.horario_id
       WHERE s.paciente_id = ?
       ORDER BY h.data, h.hora`,
      [req.usuario.id]
    );

    res.json({ sessoes, saldo: await saldoDisponivel(req.usuario.id) });
  } catch (erro) {
    next(erro);
  }
});

// Agenda geral (fisio).
router.get('/', exigirLogin(['fisio']), async (req, res, next) => {
  try {
    const [sessoes] = await pool.execute(
      `SELECT s.id, s.numero_sessao, s.status, h.data, h.hora, h.duracao_minutos,
              u.nome AS paciente_nome, u.telefone AS paciente_telefone, u.foto_url AS paciente_foto
       FROM sessoes s
       JOIN horarios h ON h.id = s.horario_id
       JOIN usuarios u ON u.id = s.paciente_id
       ORDER BY h.data, h.hora`
    );

    res.json({ sessoes });
  } catch (erro) {
    next(erro);
  }
});

// Paciente remarca, respeitando o prazo mínimo em relação ao horário atual.
router.patch('/:id/remarcar', exigirLogin(['paciente']), async (req, res, next) => {
  try {
    const { novo_horario_id } = req.body || {};
    if (!novo_horario_id) {
      return res.status(400).json({ erro: 'Escolha o novo horário.' });
    }

    const [linhas] = await pool.execute(
      `SELECT s.*, h.data, h.hora FROM sessoes s JOIN horarios h ON h.id = s.horario_id WHERE s.id = ?`,
      [req.params.id]
    );
    const sessao = linhas[0];

    if (!sessao || sessao.paciente_id !== req.usuario.id) {
      return res.status(404).json({ erro: 'Sessão não encontrada.' });
    }
    if (sessao.status !== 'agendada') {
      return res.status(400).json({ erro: 'Essa sessão não pode mais ser remarcada.' });
    }
    if (horasAte(horarioComoData(sessao.data, sessao.hora)) < PRAZO_MINIMO_HORAS) {
      return res.status(400).json({
        erro: `Remarcações precisam ser feitas com pelo menos ${PRAZO_MINIMO_HORAS}h de antecedência. Fale direto com a fisioterapeuta.`,
      });
    }

    const [novoHorarioLinhas] = await pool.execute('SELECT * FROM horarios WHERE id = ?', [novo_horario_id]);
    const novoHorario = novoHorarioLinhas[0];
    if (!novoHorario || novoHorario.status !== 'livre') {
      return res.status(409).json({ erro: 'Esse novo horário não está disponível.' });
    }

    await transacao(async (conn) => {
      await conn.execute(`UPDATE horarios SET status = 'livre' WHERE id = ?`, [sessao.horario_id]);
      await conn.execute(`UPDATE horarios SET status = 'ocupado' WHERE id = ?`, [novo_horario_id]);
      await conn.execute(`UPDATE sessoes SET horario_id = ? WHERE id = ?`, [novo_horario_id, sessao.id]);
    });

    res.json({ ok: true });
  } catch (erro) {
    next(erro);
  }
});

// Paciente cancela, respeitando o mesmo prazo mínimo.
router.patch('/:id/cancelar', exigirLogin(['paciente']), async (req, res, next) => {
  try {
    const [linhas] = await pool.execute(
      `SELECT s.*, h.data, h.hora FROM sessoes s JOIN horarios h ON h.id = s.horario_id WHERE s.id = ?`,
      [req.params.id]
    );
    const sessao = linhas[0];

    if (!sessao || sessao.paciente_id !== req.usuario.id) {
      return res.status(404).json({ erro: 'Sessão não encontrada.' });
    }
    if (sessao.status !== 'agendada') {
      return res.status(400).json({ erro: 'Essa sessão não pode mais ser cancelada.' });
    }
    if (horasAte(horarioComoData(sessao.data, sessao.hora)) < PRAZO_MINIMO_HORAS) {
      return res.status(400).json({
        erro: `Cancelamentos precisam ser feitos com pelo menos ${PRAZO_MINIMO_HORAS}h de antecedência. Fale direto com a fisioterapeuta.`,
      });
    }

    await transacao(async (conn) => {
      await conn.execute(`UPDATE horarios SET status = 'livre' WHERE id = ?`, [sessao.horario_id]);
      await conn.execute(`UPDATE sessoes SET status = 'cancelada' WHERE id = ?`, [sessao.id]);
    });

    res.json({ ok: true });
  } catch (erro) {
    next(erro);
  }
});

// Fisio marca uma sessão como concluída.
router.patch('/:id/concluir', exigirLogin(['fisio']), async (req, res, next) => {
  try {
    const [linhas] = await pool.execute('SELECT * FROM sessoes WHERE id = ?', [req.params.id]);
    if (!linhas[0]) {
      return res.status(404).json({ erro: 'Sessão não encontrada.' });
    }

    await pool.execute(`UPDATE sessoes SET status = 'concluida' WHERE id = ?`, [req.params.id]);
    res.json({ ok: true });
  } catch (erro) {
    next(erro);
  }
});

export default router;
