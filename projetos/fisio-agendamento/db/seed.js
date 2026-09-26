import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { pool } from './database.js';

async function main() {
  const nome = process.env.FISIO_NOME || 'Fisioterapeuta';
  const email = process.env.FISIO_EMAIL || 'fisio@exemplo.com';
  const senha = process.env.FISIO_SENHA || 'troque-esta-senha';

  const [linhas] = await pool.execute('SELECT id FROM usuarios WHERE tipo = ? AND email = ?', [
    'fisio',
    email,
  ]);

  if (linhas[0]) {
    console.log(`Já existe uma conta de fisio com o e-mail ${email} (id ${linhas[0].id}). Nada foi alterado.`);
    console.log('Pra trocar a senha dela, rode: npm run resetar-senha -- email@x.com novaSenha');
  } else {
    const senhaHash = bcrypt.hashSync(senha, 10);
    const [resultado] = await pool.execute(
      'INSERT INTO usuarios (tipo, nome, email, senha_hash) VALUES (?, ?, ?, ?)',
      ['fisio', nome, email, senhaHash]
    );

    console.log(`Conta da fisio criada (id ${resultado.insertId}).`);
    console.log(`  E-mail: ${email}`);
    console.log(`  Senha:  ${senha}`);
    console.log('Troque essa senha depois do primeiro login (ou edite o .env e rode o seed de novo antes de usar em produção).');
  }

  await pool.end();
}

main().catch((erro) => {
  console.error('Não foi possível rodar o seed:', erro.message);
  console.error('Confira se o MySQL está rodando e se DB_HOST/DB_USER/DB_PASSWORD/DB_NAME no .env estão corretos.');
  process.exit(1);
});
