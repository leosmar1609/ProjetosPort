// Gera a versão de demonstração (dados de exemplo no navegador, sem servidor) para o portfólio.
// Uso: npm run build:demo   (saída padrão: ../demos/delicias-da-neide; para outra pasta, defina DEMO_OUT)
import { execSync } from 'node:child_process';
import path from 'node:path';

const saida = path.resolve(process.env.DEMO_OUT || '../demos/delicias-da-neide');

execSync(`npx expo export --platform web --clear --output-dir "${saida}"`, {
  stdio: 'inherit',
  env: {
    ...process.env,
    EXPO_PUBLIC_DEMO: '1',
    EXPO_PUBLIC_API_URL: '', // o demo nunca fala com o servidor de verdade
    EXPO_BASE_URL: '/demos/delicias-da-neide',
  },
});

console.log(`\n✅ Demonstração gerada em ${saida}`);
