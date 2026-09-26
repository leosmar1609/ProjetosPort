// especificação OpenAPI da API. a página /docs (Swagger) lê isso e monta a documentação sozinha
import { UFS } from './dominio/feriados.js';

// parâmetros que se repetem em várias rotas
const uf = {
  name: 'uf', in: 'query', required: false,
  description: 'Sigla do estado. Sem ela, só os feriados nacionais entram na conta.',
  schema: { type: 'string', enum: Object.keys(UFS) }, example: 'SP',
};
const pontosFacultativos = {
  name: 'pontos_facultativos', in: 'query', required: false,
  description: '"folga" (padrão): Carnaval e Corpus Christi não são dias úteis. "util": contam como úteis. A Quarta de Cinzas é sempre útil (expediente a partir das 14h).',
  schema: { type: 'string', enum: ['folga', 'util'], default: 'folga' },
};
const data = (nome, descricao, exemplo, obrigatorio = true) => ({
  name: nome, in: 'query', required: obrigatorio, description: `${descricao} Aceita AAAA-MM-DD, DD/MM/AAAA ou "hoje".`,
  schema: { type: 'string' }, example: exemplo,
});

// modelos de resposta de erro e de sucesso, pra não repetir em toda rota
const erro = (descricao, exemplo) => ({
  description: descricao,
  content: { 'application/json': { schema: { $ref: '#/components/schemas/Erro' }, example: { erro: { ...exemplo, documentacao: '/docs' } } } },
});
const errosComuns = {
  422: erro('Algum parâmetro está errado. A mensagem diz qual e como corrigir.', {
    codigo: 'data_invalida', mensagem: '"2026-13-01" não é uma data válida. Use AAAA-MM-DD, DD/MM/AAAA ou a palavra "hoje".',
    campo: 'inicio', recebido: '2026-13-01', exemplo: '2026-09-24',
  }),
  429: erro('Limite diário atingido.', {
    codigo: 'limite_diario_atingido', mensagem: 'Você usou as 50 requisições de hoje. O limite renova à meia-noite (horário de Brasília).',
    limite_diario: 50, renova_em: '2026-09-25T03:00:00.000Z',
  }),
};
const sucesso = (descricao, exemplo) => ({ description: descricao, content: { 'application/json': { example: exemplo } } });

// a especificação em si: descrição, segurança (chave Bearer), schemas e rotas
export const especificacao = {
  openapi: '3.1.0',
  info: {
    title: 'Prazo API',
    version: '1.0.0',
    description: [
      'Dias úteis, prazos e feriados do Brasil (nacionais, estaduais e pontos facultativos).',
      '',
      '**Sem chave:** 50 requisições por dia por IP. **Com chave grátis:** 1000 por dia. Crie a chave em `POST /v1/chaves` e envie `Authorization: Bearer pz_...`.',
      '',
      'Toda resposta de sucesso começa com `explicacao`, uma frase dizendo o que foi calculado. Todo erro vem como `{ "erro": { "codigo", "mensagem", "campo" } }`.',
    ].join('\n'),
  },
  servers: [{ url: '/' }],
  tags: [
    { name: 'Calendário', description: 'Prazos, dias úteis e feriados.' },
    { name: 'Conta', description: 'Chave de API e limite de uso.' },
  ],
  components: {
    securitySchemes: { chave: { type: 'http', scheme: 'bearer', description: 'Chave criada em POST /v1/chaves (começa com pz_).' } },
    schemas: {
      Erro: {
        type: 'object',
        properties: {
          erro: {
            type: 'object',
            required: ['codigo', 'mensagem'],
            properties: {
              codigo: { type: 'string', description: 'Identificador estável do erro, bom para usar em if.' },
              mensagem: { type: 'string', description: 'Explicação em português, com o que fazer.' },
              campo: { type: 'string', description: 'Parâmetro que causou o erro, quando houver.' },
              recebido: { type: 'string' },
              exemplo: { type: 'string' },
            },
          },
        },
      },
      Feriado: {
        type: 'object',
        properties: {
          data: { type: 'string', example: '2026-10-12' },
          dia_semana: { type: 'string', example: 'segunda-feira' },
          nome: { type: 'string', example: 'Nossa Senhora Aparecida' },
          tipo: { type: 'string', enum: ['nacional', 'estadual', 'ponto_facultativo'] },
          abrangencia: { type: 'string', example: 'BR' },
        },
      },
    },
  },
  security: [{}, { chave: [] }],
  paths: {
    '/v1/prazo': {
      get: {
        tags: ['Calendário'],
        summary: 'Somar dias úteis a uma data',
        description: 'Responde "15 dias úteis depois de tal data caem em que dia?". O dia inicial não entra na conta. Use dias negativos para contar para trás.',
        parameters: [
          data('inicio', 'Data de partida.', '2026-09-24'),
          { name: 'dias', in: 'query', required: true, description: 'Dias úteis a somar, de -365 a 365 (diferente de zero).', schema: { type: 'integer' }, example: 15 },
          uf, pontosFacultativos,
        ],
        responses: {
          200: sucesso('Data final calculada.', {
            explicacao: '15 dias úteis depois de 24/09/2026 (quinta-feira), em São Paulo, caem em 16/10/2026 (sexta-feira). O dia inicial não entra na contagem. Um feriado foi pulado: 12/10/2026 Nossa Senhora Aparecida.',
            inicio: '2026-09-24', dias_uteis: 15, uf: 'SP', pontos_facultativos: 'folga',
            data_final: '2026-10-16', dia_semana_final: 'sexta-feira', dias_corridos: 22,
            feriados_no_periodo: [{ data: '2026-10-12', dia_semana: 'segunda-feira', nome: 'Nossa Senhora Aparecida', tipo: 'nacional', afetou_contagem: true }],
          }),
          ...errosComuns,
        },
      },
    },
    '/v1/dias-uteis': {
      get: {
        tags: ['Calendário'],
        summary: 'Contar dias úteis entre duas datas',
        description: 'Conta incluindo as duas pontas. Período máximo de 2 anos.',
        parameters: [data('inicio', 'Primeiro dia.', '2026-11-01'), data('fim', 'Último dia.', '2026-12-31'), uf, pontosFacultativos],
        responses: {
          200: sucesso('Contagem do período.', {
            explicacao: 'De 01/11/2026 a 31/12/2026, em São Paulo, há 41 dias úteis em 61 dias corridos, contando as duas pontas. Os outros 20 são 17 de fim de semana e 3 de feriado.',
            inicio: '2026-11-01', fim: '2026-12-31', uf: 'SP', dias_corridos: 61, dias_uteis: 41,
            dias_nao_uteis: { fim_de_semana: 17, feriado: 3 }, feriados_no_periodo: [],
          }),
          ...errosComuns,
        },
      },
    },
    '/v1/dia-util': {
      get: {
        tags: ['Calendário'],
        summary: 'Ver se uma data é dia útil',
        description: 'Se não for, diz o motivo e o próximo dia útil.',
        parameters: [data('data', 'Data a consultar. Padrão: hoje.', '2026-10-12', false), uf, pontosFacultativos],
        responses: {
          200: sucesso('Resultado da consulta.', {
            explicacao: '12/10/2026 (segunda-feira) não é dia útil em São Paulo: Nossa Senhora Aparecida. O próximo dia útil é 13/10/2026 (terça-feira).',
            data: '2026-10-12', dia_semana: 'segunda-feira', uf: 'SP', dia_util: false,
            motivo: 'Nossa Senhora Aparecida', proximo_dia_util: '2026-10-13',
          }),
          ...errosComuns,
        },
      },
    },
    '/v1/feriados': {
      get: {
        tags: ['Calendário'],
        summary: 'Listar feriados de um ano',
        description: 'Inclui os feriados móveis (Sexta-feira Santa, Carnaval, Corpus Christi) já calculados a partir da Páscoa.',
        parameters: [
          { name: 'ano', in: 'query', required: false, description: 'De 1990 a 2100. Padrão: ano atual.', schema: { type: 'integer' }, example: 2026 },
          uf,
          { name: 'tipo', in: 'query', required: false, description: 'Filtra por tipo.', schema: { type: 'string', enum: ['nacional', 'estadual', 'ponto_facultativo'] } },
        ],
        responses: { 200: sucesso('Lista do ano.', { explicacao: 'Em 2026, no Rio de Janeiro, são 10 feriados nacionais, 1 estadual e 4 pontos facultativos.', ano: 2026, uf: 'RJ', total: 15, feriados: [] }), ...errosComuns },
      },
    },
    '/v1/feriados/proximos': {
      get: {
        tags: ['Calendário'],
        summary: 'Próximos feriados',
        parameters: [
          uf,
          { name: 'quantidade', in: 'query', required: false, description: 'De 1 a 20. Padrão: 5.', schema: { type: 'integer' } },
          data('a_partir_de', 'Data de referência. Padrão: hoje.', '2026-09-24', false),
        ],
        responses: { 200: sucesso('Lista com "dias_ate" em cada feriado.', { explicacao: 'O próximo, em São Paulo, é Nossa Senhora Aparecida em 12/10/2026 (segunda-feira), daqui a 18 dias.' }), ...errosComuns },
      },
    },
    '/v1/ufs': {
      get: {
        tags: ['Calendário'], summary: 'UFs aceitas e seus feriados estaduais', responses: { 200: sucesso('As 27 UFs.', { total: 27, ufs: [{ sigla: 'SP', nome: 'São Paulo', feriados_estaduais: [{ dia: 9, mes: 7, nome: 'Revolução Constitucionalista' }] }] }) } },
    },
    '/v1/chaves': {
      post: {
        tags: ['Conta'],
        summary: 'Criar chave de API grátis',
        description: 'A chave aparece só nesta resposta. Máximo de 3 chaves por e-mail.',
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['email'], properties: { email: { type: 'string', format: 'email' } } }, example: { email: 'voce@exemplo.com' } } } },
        responses: {
          201: sucesso('Chave criada.', { explicacao: 'Chave criada. Guarde agora: ela não aparece de novo.', chave: 'pz_3f9c…', prefixo: 'pz_3f9c1a2', plano: 'gratis', limite_diario: 1000 }),
          409: erro('E-mail já tem o máximo de chaves.', { codigo: 'limite_de_chaves', mensagem: 'Esse e-mail já tem 3 chaves ativas, o máximo por e-mail.' }),
          422: erro('E-mail inválido.', { codigo: 'email_invalido', mensagem: 'Envie um JSON com um e-mail válido, ex: {"email": "voce@exemplo.com"}.', campo: 'email' }),
        },
      },
    },
    '/v1/uso': {
      get: { tags: ['Conta'], summary: 'Uso de hoje', description: 'Não conta como requisição.', responses: { 200: sucesso('Uso do dia.', { explicacao: 'Sem chave, este IP usou 3 de 50 requisições hoje. Restam 47.', limite_diario: 50, usadas_hoje: 3, restantes: 47 }) } },
    },
  },
};
