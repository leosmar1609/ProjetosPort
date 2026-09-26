import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cron from 'node-cron';
import app from './app.js';
import { verificarLembretes } from './servicos/lembretes.js';
import { gerarHorarios } from './servicos/disponibilidade.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.use(express.static(path.join(__dirname, '..', 'public')));

const PORTA = process.env.PORT || 3000;
app.listen(PORTA, () => {
  console.log(`Rodando em http://localhost:${PORTA}`);
});

// Mantém a agenda preenchida à frente a partir do padrão semanal (sem sobrescrever horários que
// já existem — só completa os dias novos que vão entrando na janela). Roda ao subir o servidor
// e depois todo dia às 00:10.
gerarHorarios().catch((erro) => console.error('[disponibilidade] falha ao gerar horários:', erro.message));
cron.schedule('10 0 * * *', () => {
  gerarHorarios().catch((erro) => console.error('[disponibilidade] falha ao gerar horários:', erro.message));
});

// Só faz sentido ter um cron rodando aqui — no Netlify (serverless) cada function encerra
// depois de responder, então lá a verificação precisa ser disparada por fora (veja README).
cron.schedule('*/5 * * * *', async () => {
  try {
    const resultado = await verificarLembretes();
    const total = resultado.lembrete_24h.enviados + resultado.lembrete_1h.enviados;
    if (total > 0) {
      console.log(`[lembretes] ${resultado.lembrete_24h.enviados} de 24h e ${resultado.lembrete_1h.enviados} de 1h enviados.`);
    }
  } catch (erro) {
    console.error('[lembretes] falha ao verificar:', erro.message);
  }
});
