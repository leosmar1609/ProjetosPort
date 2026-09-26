// cria o banco e as tabelas no MySQL usando o .env. uso: npm run criar-schema
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
  await conexao.query(fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8'));
  console.log('Banco prazo_api pronto. Agora use ARMAZENAMENTO=mysql no .env.');
  await conexao.end();
}

main().catch((erro) => {
  console.error('Não foi possível rodar o schema:', erro.message);
  process.exit(1);
});
