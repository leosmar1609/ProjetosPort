import dotenv from 'dotenv';

// carrega o .env (o quiet é pra não imprimir aviso no terminal)
dotenv.config({ quiet: true });

// lê um número do .env e usa o padrão se não tiver
const numero = (valor, padrao) => (valor === undefined || valor === '' ? padrao : Number(valor));

// todas as configurações num lugar só
export const config = {
  porta: numero(process.env.PORT, 3000),
  armazenamento: process.env.ARMAZENAMENTO === 'mysql' ? 'mysql' : 'memoria',

  // requisições por dia. sem chave o limite é por IP
  limites: {
    anonimo: numero(process.env.LIMITE_ANONIMO, 50),
    gratis: numero(process.env.LIMITE_GRATIS, 1000),
  },
  maxChavesPorEmail: 3,

  // conexão com o MySQL, só usada com ARMAZENAMENTO=mysql
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: numero(process.env.DB_PORT, 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'prazo_api',
  },
};
