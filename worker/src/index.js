// API Delícias da Neide no Cloudflare Workers.
// Mesmas rotas e respostas da versão Node (pasta api/), para o app não precisar mudar.
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { connect } from '@tidbcloud/serverless';

// Colunas que o app pode gravar em cada tabela
const TABELAS = {
  produtos: ['nome', 'preco', 'ativo'],
  producoes: ['produto_id', 'quantidade', 'data', 'obs'],
  compras: ['item', 'quantidade', 'unidade', 'valor', 'categoria', 'data', 'obs'],
  vendas: ['produto_id', 'produto_nome', 'quantidade', 'preco_unit', 'cliente', 'pagamento', 'pago', 'data', 'obs'],
};

const ORDEM = {
  produtos: 'nome',
  producoes: 'data DESC, criado_em DESC',
  compras: 'data DESC, criado_em DESC',
  vendas: 'data DESC, criado_em DESC',
};

const CAMPOS_PEDIDO = ['cliente', 'pagamento', 'pago', 'data', 'obs'];
const ITEM_PEDIDO = ['produto_id', 'produto_nome', 'quantidade', 'preco_unit'];

// Pega só as colunas permitidas; booleanos viram 1/0 para o MySQL
function escolher(obj, lista) {
  return Object.fromEntries(
    lista.filter(c => obj && c in obj).map(c => [c, typeof obj[c] === 'boolean' ? Number(obj[c]) : obj[c] ?? null]),
  );
}

const banco = env => connect({ host: env.DB_HOST, username: env.DB_USER, password: env.DB_PASSWORD, database: env.DB_NAME });

// O driver não expande objetos como o mysql2 ("SET ?"), então montamos o SQL aqui
function sqlInsert(tabela, dados) {
  const cols = Object.keys(dados);
  return [`INSERT INTO ${tabela} (${cols.join(', ')}) VALUES (${cols.map(() => '?').join(', ')})`, Object.values(dados)];
}
const sqlSet = dados => [Object.keys(dados).map(c => `${c} = ?`).join(', '), Object.values(dados)];

// ---------- login (token assinado com HMAC-SHA256, válido por 30 dias) ----------
const codificador = new TextEncoder();

async function assinar(texto, segredo) {
  const chave = await crypto.subtle.importKey('raw', codificador.encode(segredo), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = new Uint8Array(await crypto.subtle.sign('HMAC', chave, codificador.encode(texto)));
  return btoa(String.fromCharCode(...sig)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// Comparação em tempo constante, para não vazar a senha pelo tempo de resposta
function iguais(a, b) {
  const x = codificador.encode(a);
  const y = codificador.encode(b);
  if (x.length !== y.length) return false;
  let dif = 0;
  for (let i = 0; i < x.length; i++) dif |= x[i] ^ y[i];
  return dif === 0;
}

// ---------- rotas ----------
const app = new Hono();

app.use('*', cors({
  origin: '*',
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
}));

app.get('/status', c => c.json({ ok: true, app: 'Delícias da Neide' }));

app.post('/login', async c => {
  const { usuario = '', senha = '' } = await c.req.json().catch(() => ({}));
  if (!iguais(String(usuario), c.env.APP_USUARIO) || !iguais(String(senha), c.env.APP_SENHA)) {
    return c.json({ erro: 'Usuário ou senha incorretos.' }, 401);
  }
  const exp = String(Date.now() + 30 * 24 * 60 * 60 * 1000);
  return c.json({ token: `${exp}.${await assinar(exp, c.env.APP_SEGREDO)}` });
});

// Tudo daqui para baixo exige login
app.use('*', async (c, next) => {
  const [exp, sig] = (c.req.header('Authorization') || '').replace('Bearer ', '').split('.');
  if (exp && sig && iguais(sig, await assinar(exp, c.env.APP_SEGREDO)) && Number(exp) > Date.now()) return next();
  return c.json({ erro: 'Sessão expirada. Entre novamente.' }, 401);
});

app.get('/dados', async c => {
  const db = banco(c.env);
  const nomes = Object.keys(TABELAS);
  const resultados = await Promise.all(nomes.map(t => db.execute(`SELECT * FROM ${t} ORDER BY ${ORDEM[t]}`)));
  return c.json(Object.fromEntries(nomes.map((t, i) => [t, resultados[i]])));
});

// ---------- pedidos (uma venda com vários sabores = várias linhas em "vendas" com o mesmo pedido_id) ----------
app.post('/pedidos', async c => {
  const corpo = await c.req.json().catch(() => ({}));
  const itens = Array.isArray(corpo.itens) ? corpo.itens : [];
  if (!itens.length) return c.json({ erro: 'O pedido precisa ter pelo menos um sabor.' }, 400);

  const pedido_id = crypto.randomUUID();
  const comum = escolher(corpo, CAMPOS_PEDIDO);
  const tx = await banco(c.env).begin();
  try {
    for (const item of itens) {
      const [{ estoque }] = await tx.execute(
        `SELECT (SELECT COALESCE(SUM(quantidade), 0) FROM producoes WHERE produto_id = ?)
              - (SELECT COALESCE(SUM(quantidade), 0) FROM vendas WHERE produto_id = ?) AS estoque`,
        [item.produto_id, item.produto_id],
      );
      if (Number(item.quantidade) > Number(estoque)) {
        await tx.rollback();
        return c.json({ erro: `Sem estoque suficiente de ${item.produto_nome} (tem ${Math.max(0, Number(estoque))}).` }, 409);
      }
    }
    for (const item of itens) {
      await tx.execute(...sqlInsert('vendas', { id: crypto.randomUUID(), pedido_id, ...comum, ...escolher(item, ITEM_PEDIDO) }));
    }
    await tx.commit();
  } catch (e) {
    await tx.rollback().catch(() => {});
    throw e;
  }
  return c.json({ id: pedido_id }, 201);
});

// Vendas antigas não têm pedido_id: nesse caso o "pedido" é a própria linha
app.patch('/pedidos/:id', async c => {
  const dados = escolher(await c.req.json().catch(() => ({})), CAMPOS_PEDIDO);
  if (!Object.keys(dados).length) return c.json({ erro: 'Nada para atualizar.' }, 400);
  const [set, valores] = sqlSet(dados);
  const id = c.req.param('id');
  await banco(c.env).execute(`UPDATE vendas SET ${set} WHERE pedido_id = ? OR id = ?`, [...valores, id, id]);
  return c.json({ ok: true });
});

app.delete('/pedidos/:id', async c => {
  const id = c.req.param('id');
  await banco(c.env).execute('DELETE FROM vendas WHERE pedido_id = ? OR id = ?', [id, id]);
  return c.json({ ok: true });
});

// ---------- rotas genéricas por tabela ----------
const tabelaValida = async (c, next) => {
  if (c.req.param('tabela') in TABELAS) return next();
  return c.json({ erro: 'Tabela não encontrada.' }, 404);
};

app.post('/:tabela', tabelaValida, async c => {
  const tabela = c.req.param('tabela');
  const id = crypto.randomUUID();
  const dados = escolher(await c.req.json().catch(() => ({})), TABELAS[tabela]);
  await banco(c.env).execute(...sqlInsert(tabela, { id, ...dados }));
  return c.json({ id }, 201);
});

app.patch('/:tabela/:id', tabelaValida, async c => {
  const tabela = c.req.param('tabela');
  const dados = escolher(await c.req.json().catch(() => ({})), TABELAS[tabela]);
  if (!Object.keys(dados).length) return c.json({ erro: 'Nada para atualizar.' }, 400);
  const [set, valores] = sqlSet(dados);
  await banco(c.env).execute(`UPDATE ${tabela} SET ${set} WHERE id = ?`, [...valores, c.req.param('id')]);
  return c.json({ ok: true });
});

app.delete('/:tabela/:id', tabelaValida, async c => {
  const tabela = c.req.param('tabela');
  const id = c.req.param('id');
  const db = banco(c.env);
  if (tabela === 'produtos') {
    await db.execute('DELETE FROM producoes WHERE produto_id = ?', [id]);
    await db.execute('UPDATE vendas SET produto_id = NULL WHERE produto_id = ?', [id]);
  }
  await db.execute(`DELETE FROM ${tabela} WHERE id = ?`, [id]);
  return c.json({ ok: true });
});

app.onError((err, c) => {
  console.error(err);
  return c.json({ erro: 'Erro no servidor: ' + err.message }, 500);
});

export default app;
