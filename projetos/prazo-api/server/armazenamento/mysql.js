// as mesmas funções da versão em memória, só que salvando no MySQL (tabelas do db/schema.sql)
export async function criarArmazenamentoMysql(config) {
  const { default: mysql } = await import('mysql2/promise');
  const pool = mysql.createPool({ ...config, waitForConnections: true, connectionLimit: 10, dateStrings: true });

  return {
    nome: 'mysql',

    async criarChave({ email, hash, prefixo, plano }) {
      const [r] = await pool.execute(
        'INSERT INTO chaves (email, hash, prefixo, plano) VALUES (?, ?, ?, ?)',
        [email, hash, prefixo, plano],
      );
      return { id: r.insertId, email, prefixo, plano, ativa: true };
    },

    async contarChavesDoEmail(email) {
      const [linhas] = await pool.execute('SELECT COUNT(*) AS total FROM chaves WHERE email = ? AND ativa = 1', [email]);
      return Number(linhas[0].total);
    },

    async buscarChavePorHash(hash) {
      const [linhas] = await pool.execute(
        'SELECT id, email, prefixo, plano, ativa, criada_em FROM chaves WHERE hash = ? AND ativa = 1',
        [hash],
      );
      return linhas[0] || null;
    },

    // cria a linha do dia ou soma 1 nela num comando só, assim duas requisições ao mesmo tempo não se atropelam
    async registrarUso(identificador, dia) {
      await pool.execute(
        'INSERT INTO uso_diario (identificador, dia, total) VALUES (?, ?, 1) ON DUPLICATE KEY UPDATE total = total + 1',
        [identificador, dia],
      );
      return this.consultarUso(identificador, dia);
    },

    async consultarUso(identificador, dia) {
      const [linhas] = await pool.execute('SELECT total FROM uso_diario WHERE identificador = ? AND dia = ?', [identificador, dia]);
      return linhas[0] ? Number(linhas[0].total) : 0;
    },
  };
}
