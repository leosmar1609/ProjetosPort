import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import app from './app.js';
import { config } from './config.js';

// pasta public, onde ficam o console e a documentação
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publico = path.join(__dirname, '..', 'public');

// rodando local o próprio Express serve o front. no Netlify quem faz isso é o CDN
app.use(express.static(publico, { extensions: ['html'] }));

// sobe o servidor
app.listen(config.porta, () => {
  console.log(`Prazo rodando em http://localhost:${config.porta}`);
  console.log(`Documentação:  http://localhost:${config.porta}/docs`);
  console.log(`Armazenamento: ${config.armazenamento}`);
});
