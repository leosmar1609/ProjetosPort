# Anna Barbosa — Agendamento por Código

Sistema de agendamento pra atendimento de fisioterapia da Anna Beatriz Barbosa Rosa
(CREFITO-3/391020-F). Site público com formulário de contato, cadastro de paciente liberado por
código, agenda da fisioterapeuta e agendamento/remarcação online.

## Como funciona

1. Paciente manda uma mensagem pelo site contando o que está sentindo.
2. A fisio conversa com ele (fora do sistema) e decide o que liberar.
3. A fisio gera um **código** no painel dela — na hora, ela escolhe se ele libera uma sessão avulsa,
   um pacote de N sessões, ou acesso contínuo (além de validade e uma observação pra ela mesma).
4. O paciente usa esse código pra criar login e senha.
5. O paciente agenda a sessão escolhendo um horário livre na agenda. Cada sessão fica numerada
   (Sessão #1, #2...).
6. O paciente pode remarcar ou cancelar sozinho, desde que com 24h de antecedência — depois disso,
   só falando direto com a fisio.

Tanto a fisio quanto o paciente têm uma página **"Meu perfil"** (link no menu, depois de logado) pra
trocar a senha e subir uma foto de perfil.

O sistema manda um **e-mail de lembrete** pro paciente 24h e depois de novo 1h antes de cada sessão
agendada (cada lembrete é enviado só uma vez por sessão).

## Agenda automática

Em vez de cadastrar horário por horário, a fisio configura o **padrão semanal** dela uma vez (ex:
"segunda a sexta, das 8h às 18h, sessões de 50 minutos" — dá pra ter mais de uma faixa por dia, tipo
manhã e tarde separadas por um almoço) na tela **Horário de atendimento**. A partir disso:

- O sistema preenche a agenda automaticamente pros próximos 45 dias (e mantém preenchido, rodando
  de novo toda madrugada) — sem sobrescrever nada que já existe.
- A fisio vê um calendário com os horários gerados e só precisa **clicar** num horário livre pra
  bloqueá-lo (ex: consulta médica, compromisso pessoal) — e clicar de novo pra liberar.
- Horário com paciente agendado aparece cinza e não pode ser bloqueado (precisa cancelar a sessão
  primeiro, o que o próprio paciente pode fazer até 24h antes).

## Lembretes por e-mail

- `EMAIL_PROVIDER=console` (padrão): não manda e-mail de verdade, só imprime no terminal — bom pra
  testar a lógica sem precisar de conta em nenhum serviço.
- `EMAIL_PROVIDER=resend`: manda de verdade pela [Resend](https://resend.com) (free até 3.000
  e-mails/mês). Crie uma conta, gere uma **API Key** e cole em `RESEND_API_KEY` no `.env`. Pra usar
  um remetente com o domínio da fisio (em vez do `onboarding@resend.dev` de teste), verifique o
  domínio lá no painel da Resend e troque `EMAIL_REMETENTE`.

**Como os lembretes são disparados:**
- Rodando localmente (`npm run dev`), um agendador interno (`node-cron`) confere a cada 5 minutos se
  alguma sessão entrou na janela de 24h ou de 1h e manda o e-mail.
- Em produção no Netlify, functions não ficam rodando o tempo todo, então isso *não* roda sozinho —
  alguma coisa de fora precisa chamar `POST /api/lembretes/verificar` (com o header
  `X-Lembretes-Secret: <valor do LEMBRETES_SECRET do .env>`) periodicamente. Duas opções simples:
  - [cron-job.org](https://cron-job.org) (grátis) chamando essa URL a cada 5-15 minutos.
  - Uma Netlify Scheduled Function pequena que só faz esse `fetch`.

## Banco de dados: MySQL local (MySQL Workbench)

O banco roda no MySQL local da sua máquina — o mesmo servidor que aparece no seu MySQL Workbench.
Nada de arquivo solto: dá pra abrir o Workbench, conectar no seu servidor local e ver as tabelas
(`fisio_agendamento` → `usuarios`, `codigos`, `horarios`, `sessoes`, `mensagens_contato`) e os dados
direto por lá.

### Criar o banco

**Pelo Workbench (visual):**
1. Abra o MySQL Workbench, conecte no seu servidor local.
2. Abra o arquivo `db/schema.sql` (File → Open SQL Script).
3. Rode o script inteiro (ícone do raio ⚡, ou Ctrl+Shift+Enter). Isso cria o banco
   `fisio_agendamento` e as 5 tabelas.

**Ou pelo terminal**, sem precisar abrir o Workbench (usa as credenciais do `.env`):
```bash
npm run criar-schema
```

## Rodar localmente

Precisa do Node.js e de um servidor MySQL local rodando (`node -v` e o MySQL Workbench conectando
normalmente pra conferir).

```bash
npm install
cp .env.example .env      # preencha DB_PASSWORD (senha do seu MySQL local) e o e-mail/senha da fisio
npm run criar-schema        # cria o banco fisio_agendamento e as tabelas (ou faça isso pelo Workbench)
npm run seed                 # cria a conta da fisio no banco
npm run dev                   # sobe o site em http://localhost:3000
```

- Login da fisio: o e-mail/senha que você colocou no `.env` antes de rodar `npm run seed`.
- Esqueceu uma senha (sua ou de um paciente) durante os testes? `npm run resetar-senha -- email@x.com novaSenha`
- Pra ver/editar os dados direto: abra o MySQL Workbench, conecte no servidor local e navegue até o
  schema `fisio_agendamento`.

## Estrutura

```
db/
  schema.sql              cria o banco + as 5 tabelas (rode no Workbench ou via npm run criar-schema)
  database.js               pool de conexão MySQL (lê host/usuário/senha do .env)
  executar-schema.js         roda o schema.sql pelo terminal, sem precisar abrir o Workbench
  seed.js                    cria a conta da fisio
server/
  app.js                    monta a API (rotas em /auth, /codigos, /horarios, /sessoes, /contato)
  local.js                   sobe a API + serve os arquivos de public/ (uso local)
  routes/                    uma rota por área
  middleware/auth.js          confere o token de login em rotas protegidas
  utils/                      hash de senha, token JWT, gerador de código, envio de e-mail
  servicos/lembretes.js       lógica dos lembretes de 24h/1h (quem avisar, texto, marca como enviado)
  servicos/disponibilidade.js  gera a agenda a partir do padrão semanal configurado
  scripts/resetar-senha.js    reseta a senha de qualquer conta pelo terminal
netlify/functions/api.js    mesma app.js rodando como Netlify Function (produção)
public/                    frontend (HTML/CSS/JS puro, sem build) — imagens em public/img/
  uploads/perfil/             fotos de perfil enviadas pelos usuários (gitignored, geradas em runtime)
```

O projeto usa ES Modules (`import`/`export`) em todo o código, não `require`.

## Publicar no Netlify (quando for apresentar pra fisio)

Netlify hospeda o `public/` como site estático e roda a API como Netlify Function — o mesmo código
de `server/app.js` serve os dois ambientes.

1. Suba esta pasta num repositório Git (ou use `netlify deploy` direto da pasta).
2. No Netlify: **New site from Git** (ou arraste a pasta, se preferir deploy manual).
3. Nas configurações do site, adicione as variáveis de ambiente: `JWT_SECRET`, `DB_HOST`, `DB_PORT`,
   `DB_USER`, `DB_PASSWORD`, `DB_NAME`.
4. **Importante**: o MySQL local da sua máquina só existe na sua máquina — o Netlify não enxerga ele.
   Antes de publicar de verdade (não só pra demonstrar a tela), esses `DB_*` do passo 3 precisam
   apontar pra um banco MySQL **online** (ex: PlanetScale, Railway, ou qualquer MySQL gerenciado — o
   `db/schema.sql` roda igual em qualquer um deles, é MySQL puro).
5. **Fotos de perfil**: hoje elas são salvas em `public/uploads/perfil/` no disco local — funciona
   rodando na sua máquina, mas o Netlify Functions não tem disco persistente (cada execução começa
   do zero), então o upload de foto não vai persistir em produção. Antes de publicar de verdade,
   troque `server/routes/perfil.js` pra enviar a imagem a um serviço externo (Cloudinary, S3,
   Supabase Storage) em vez de salvar em disco.
6. **Lembretes por e-mail**: adicione `EMAIL_PROVIDER=resend`, `RESEND_API_KEY` e `LEMBRETES_SECRET`
   nas variáveis de ambiente do Netlify, e configure um agendador externo pra chamar
   `POST /api/lembretes/verificar` (veja a seção "Lembretes por e-mail" acima) — sem isso, os
   lembretes não são enviados sozinhos em produção.
6.1. **Agenda automática**: pelo mesmo motivo (Netlify não fica com processo rodando o tempo todo),
   a agenda também não se preenche sozinha em produção — o mesmo agendador externo do item acima
   pode chamar `POST /api/disponibilidade/gerar` (autenticado como fisio) uma vez por dia.
7. Depois que a fisio aprovar e (se for o caso) pagar por um domínio próprio, é só apontar o domínio
   pro site no Netlify (e atualizar o `SITE_URL` nas variáveis de ambiente, pra o link dentro do
   e-mail de lembrete apontar pro domínio certo).

Até lá, dá pra abrir o site publicado no Netlify só pra mostrar as telas — mas cadastro/login, foto
de perfil e lembretes só vão funcionar de verdade em produção depois dos passos 4, 5 e 6.

## Decisões que ainda faltam (perguntar pra fisio)

- Endereço do consultório e se atende online também
- Duração padrão da sessão e valores/pacotes
- Pagamento: pelo site, ou só combinado por fora?
- Prontuário/evolução por sessão — não está implementado ainda (hoje só marca "concluída")
- "Esqueci minha senha" self-service — por enquanto só dá pra resetar manualmente (veja acima)
- Instagram/e-mail real dela pra colocar no rodapé e no login da conta (hoje o `.env` está com um
  e-mail placeholder — troque por um real e rode `npm run seed` de novo)
