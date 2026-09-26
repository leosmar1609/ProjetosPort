# Prazo API

API REST de **dias úteis, prazos e feriados do Brasil**. Responde perguntas como:

- "15 dias úteis depois de hoje, em São Paulo, caem em que dia?"
- "Quantos dias úteis tem entre 01/11 e 31/12?"
- "12/10/2026 é dia útil? Se não for, qual é o próximo?"
- "Quais são os feriados de 2026 no Rio de Janeiro?"

Vem com um **console web** para testar a API ao vivo (monta a requisição, mostra o JSON, os headers e o
resultado desenhado num calendário) e uma **documentação interativa** em Swagger gerada a partir da
especificação OpenAPI.

## Rodando

```bash
npm install
npm run dev
```

- Console: http://localhost:3000
- Documentação: http://localhost:3000/docs
- Testes: `npm test`

Não precisa de banco pra rodar: por padrão as chaves e a contagem de uso ficam em memória. Pra usar o
MySQL, veja [Banco de dados](#banco-de-dados).

## Rotas

| Método | Rota | O que faz |
|---|---|---|
| GET | `/v1/prazo?inicio=hoje&dias=15&uf=SP` | Soma (ou subtrai, com dias negativos) dias úteis a uma data |
| GET | `/v1/dias-uteis?inicio=2026-11-01&fim=2026-12-31&uf=SP` | Conta dias úteis entre duas datas |
| GET | `/v1/dia-util?data=2026-10-12&uf=SP` | Diz se a data é útil, o motivo e o próximo dia útil |
| GET | `/v1/feriados?ano=2026&uf=RJ` | Feriados e pontos facultativos do ano |
| GET | `/v1/feriados/proximos?uf=SP&quantidade=5` | Próximos feriados a partir de hoje |
| GET | `/v1/ufs` | UFs aceitas e seus feriados estaduais |
| POST | `/v1/chaves` | Cria uma chave de API grátis |
| GET | `/v1/uso` | Quanto do limite diário já foi usado (não conta como requisição) |

`GET /v1` lista tudo isso com exemplos, e `/openapi.json` tem a especificação completa.

Parâmetros comuns:

- **Datas** aceitam `2026-09-24`, `24/09/2026` ou `hoje`.
- **`uf`** é opcional. Sem ela, só os feriados nacionais entram na conta (e a resposta avisa isso).
- **`pontos_facultativos`**: `folga` (padrão: Carnaval e Corpus Christi não são úteis) ou `util`.
  A Quarta-feira de Cinzas é sempre útil, porque tem expediente a partir das 14h.

## Formato das respostas

Toda resposta de sucesso começa com `explicacao`, uma frase em português dizendo o que foi calculado.
Dá pra mostrar direto pro usuário final ou usar pra conferir se a pergunta foi a certa:

```json
{
  "explicacao": "15 dias úteis depois de 24/09/2026 (quinta-feira), em São Paulo, caem em 16/10/2026 (sexta-feira). O dia inicial não entra na contagem. Um feriado foi pulado: 12/10/2026 Nossa Senhora Aparecida.",
  "inicio": "2026-09-24",
  "dias_uteis": 15,
  "uf": "SP",
  "data_final": "2026-10-16",
  "dia_semana_final": "sexta-feira",
  "dias_corridos": 22,
  "feriados_no_periodo": [
    { "data": "2026-10-12", "nome": "Nossa Senhora Aparecida", "tipo": "nacional", "afetou_contagem": true }
  ]
}
```

Todo erro vem no mesmo formato: `codigo` é estável (bom pra usar num `if`), `mensagem` diz o que
fazer, e `campo` aponta o parâmetro com problema.

```json
{
  "erro": {
    "codigo": "parametro_desconhecido",
    "mensagem": "O parâmetro \"inico\" não existe. Você quis dizer \"inicio\"?",
    "campo": "inico",
    "aceitos": ["inicio", "dias", "uf", "pontos_facultativos"],
    "documentacao": "/docs"
  }
}
```

| Status | Quando |
|---|---|
| 400 | Corpo JSON mal formatado |
| 401 | Chave inexistente ou header `Authorization` fora do formato `Bearer pz_...` |
| 404 | Rota não existe (a resposta sugere a mais parecida) |
| 405 | Rota existe, mas com outro método |
| 409 | E-mail já tem 3 chaves ativas |
| 422 | Parâmetro faltando, com formato errado, fora do intervalo ou desconhecido |
| 429 | Limite diário atingido (com header `Retry-After`) |

## Chave de API e limite de uso

A API funciona sem chave, com **50 requisições por dia por IP**. Com uma chave grátis, o limite sobe
pra **1000 por dia**:

```bash
curl -X POST http://localhost:3000/v1/chaves -H "Content-Type: application/json" -d '{"email":"voce@exemplo.com"}'
curl "http://localhost:3000/v1/prazo?inicio=hoje&dias=15&uf=SP" -H "Authorization: Bearer pz_..."
```

- A chave aparece uma única vez. O banco guarda só o hash SHA-256 dela.
- O IP de quem usa sem chave também é guardado como hash.
- Toda resposta traz `X-RateLimit-Limit`, `X-RateLimit-Remaining` e `X-RateLimit-Reset`.
- O contador zera à meia-noite de Brasília.

## Decisões de projeto

- **Parâmetro desconhecido é erro, não é ignorado.** Se alguém manda `estado=SP` em vez de `uf=SP`,
  uma API que ignora o parâmetro devolve uma resposta que parece certa, mas não considera o estado.
  Aqui isso vira 422 com a sugestão do nome certo.
- **Datas sem fuso horário.** Datas são guardadas como milissegundos UTC à meia-noite, então
  `2026-10-12` é sempre `2026-10-12`, rodando em qualquer servidor.
- **Feriados calculados, não cadastrados.** Os fixos ficam numa tabela no código e os móveis saem da
  Páscoa (algoritmo de Meeus/Jones/Butcher), então qualquer ano de 1990 a 2100 funciona sem manutenção.
  Mudanças de lei têm vigência: o Dia da Consciência Negra é nacional a partir de 2024 e, antes disso,
  estadual só nos estados que tinham lei própria.
- **Cache em memória (LRU)** das respostas calculadas, indicado no header `X-Cache: HIT/MISS`.
- **Armazenamento trocável.** As rotas só conhecem funções como `criarChave` e `registrarUso`. Existe
  uma implementação em memória (desenvolvimento e testes) e outra em MySQL (produção).

## Estrutura

```
server/
  dominio/        regras puras: datas, feriados, contagem de dias úteis (sem HTTP)
  http/           validação de parâmetros, formato de erro, cache
  middleware/     identificação por chave/IP, limite diário, CORS, tempo de resposta
  rotas/          /v1/* (calendário, chaves e uso)
  armazenamento/  memória ou MySQL, com a mesma interface
  openapi.js      especificação usada pela página /docs
public/           console web e documentação
test/             testes das regras e da API (node:test, sem dependências)
```

## Banco de dados

1. Preencha `DB_USER` e `DB_PASSWORD` no `.env` (as mesmas credenciais do seu MySQL Workbench).
2. Rode `npm run criar-schema`, que cria o banco `prazo_api` com as tabelas `chaves` e `uso_diario`.
3. Troque `ARMAZENAMENTO=memoria` por `ARMAZENAMENTO=mysql` no `.env`.

## Deploy no Netlify

O `netlify.toml` já está configurado: o `/public` vai pro CDN e as rotas `/v1/*` rodam numa function
(`netlify/functions/api.js`, com `serverless-http`). Em produção, use `ARMAZENAMENTO=mysql` com um
MySQL hospedado, porque cada function começa com a memória vazia.

## Limitações

- Feriados municipais (aniversário da cidade, padroeiro) não estão incluídos.
- A lista de feriados estaduais segue as datas mais adotadas. Confira a legislação do seu estado
  antes de usar em cálculo com consequência jurídica.
