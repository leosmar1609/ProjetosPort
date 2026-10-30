// Gera a versão web do app e publica tudo (API + web) no Cloudflare.
// Uso: npm run publicar   (lê as variáveis do .env do app)
import { execSync } from 'node:child_process';

const rodar = (cmd, cwd) => execSync(cmd, { cwd, stdio: 'inherit', env: process.env });

console.log('🍯 Gerando a versão web...');
rodar('npx expo export --platform web --output-dir ../worker/public --clear', '../pao-de-mel-app');

console.log('☁️  Publicando no Cloudflare...');
rodar('npx wrangler deploy', '.');
