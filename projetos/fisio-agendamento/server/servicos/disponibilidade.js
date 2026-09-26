import { pool } from '../../db/database.js';

// Até quantos dias à frente a agenda fica preenchida automaticamente.
export const DIAS_GERADOS_A_FRENTE = 45;

function gerarHorariosDoDia(horaInicio, horaFim, duracaoMinutos) {
  const [hi, mi] = horaInicio.split(':').map(Number);
  const [hf, mf] = horaFim.split(':').map(Number);
  const inicio = hi * 60 + mi;
  const fim = hf * 60 + mf;

  const horarios = [];
  for (let t = inicio; t + duracaoMinutos <= fim; t += duracaoMinutos) {
    const h = String(Math.floor(t / 60)).padStart(2, '0');
    const m = String(t % 60).padStart(2, '0');
    horarios.push(`${h}:${m}`);
  }
  return horarios;
}

function paraDataSql(data) {
  const p = (n) => String(n).padStart(2, '0');
  return `${data.getFullYear()}-${p(data.getMonth() + 1)}-${p(data.getDate())}`;
}

// Preenche a tabela "horarios" (todos como 'livre') a partir do padrão semanal configurado,
// olhando de hoje até DIAS_GERADOS_A_FRENTE dias à frente. Nunca sobrescreve um horário que já
// existe (bloqueado, ocupado, ou já gerado antes) — só completa o que está faltando.
export async function gerarHorarios() {
  const [template] = await pool.execute('SELECT * FROM disponibilidade_padrao');
  if (template.length === 0) {
    return { criados: 0, semTemplate: true };
  }

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  let criados = 0;

  for (let i = 0; i < DIAS_GERADOS_A_FRENTE; i++) {
    const data = new Date(hoje);
    data.setDate(data.getDate() + i);
    const diaSemana = data.getDay();
    const dataSql = paraDataSql(data);

    const regrasDoDia = template.filter((t) => t.dia_semana === diaSemana);
    for (const regra of regrasDoDia) {
      const horarios = gerarHorariosDoDia(regra.hora_inicio, regra.hora_fim, regra.duracao_minutos);
      for (const hora of horarios) {
        const [resultado] = await pool.execute(
          `INSERT IGNORE INTO horarios (data, hora, duracao_minutos, status) VALUES (?, ?, ?, 'livre')`,
          [dataSql, hora, regra.duracao_minutos]
        );
        if (resultado.affectedRows > 0) criados++;
      }
    }
  }

  return { criados, semTemplate: false };
}
