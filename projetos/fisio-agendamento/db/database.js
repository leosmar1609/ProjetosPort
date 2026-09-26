import 'dotenv/config';
import mysql from 'mysql2/promise';

export const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'fisio_agendamento',
  waitForConnections: true,
  connectionLimit: 10,
  dateStrings: true, // datas/horas voltam como texto ('2026-09-22'), não como objeto Date
});

// Roda uma sequência de queries numa transação de verdade (tudo ou nada).
// Uso: await transacao(async (conn) => { await conn.execute(...); ... });
export async function transacao(fn) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const resultado = await fn(conn);
    await conn.commit();
    return resultado;
  } catch (erro) {
    await conn.rollback();
    throw erro;
  } finally {
    conn.release();
  }
}
