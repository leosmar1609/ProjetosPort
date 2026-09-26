// Roda o schema.sql direto no MySQL usando as credenciais do .env (uso interno / setup inicial).
// Uso: node db/executar-schema.js
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mysql from 'mysql2/promise';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  const conexao = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true,
  });

  const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  await conexao.query(sql);
  console.log('Schema criado/atualizado com sucesso no banco fisio_agendamento.');
  await conexao.end();
}

main().catch((erro) => {
  console.error('Não foi possível rodar o schema:', erro.message);
  process.exit(1);
});
