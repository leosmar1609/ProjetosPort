// Uso: npm run resetar-senha -- email@exemplo.com novaSenha123
import 'dotenv/config';
import { pool } from '../../db/database.js';
import { gerarHash } from '../utils/senha.js';

async function main() {
  const [, , email, novaSenha] = process.argv;

  if (!email || !novaSenha) {
    console.log('Uso: npm run resetar-senha -- email@exemplo.com novaSenha123');
    process.exit(1);
  }

  const [linhas] = await pool.execute('SELECT id, nome FROM usuarios WHERE email = ?', [email]);
  const usuario = linhas[0];

  if (!usuario) {
    console.log(`Nenhum usuário encontrado com o e-mail ${email}.`);
    process.exit(1);
  }

  await pool.execute('UPDATE usuarios SET senha_hash = ? WHERE id = ?', [gerarHash(novaSenha), usuario.id]);
  console.log(`Senha de ${usuario.nome} (${email}) atualizada.`);
  await pool.end();
}

main().catch((erro) => {
  console.error('Erro:', erro.message);
  process.exit(1);
});
