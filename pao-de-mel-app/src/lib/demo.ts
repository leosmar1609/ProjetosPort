// Modo demonstração (portfólio): um "servidor" falso que roda no próprio navegador.
// Responde as mesmas rotas da API de verdade, com dados de exemplo gerados a partir de hoje.
// Nada sai do aparelho: o que o visitante faz fica salvo só no navegador dele.
import AsyncStorage from '@react-native-async-storage/async-storage';

type Linha = Record<string, any> & { id: string };
type Banco = { produtos: Linha[]; producoes: Linha[]; compras: Linha[]; vendas: Linha[] };

const CHAVE = 'dn-demo-v1';
const TABELAS: Record<keyof Banco, string[]> = {
  produtos: ['nome', 'preco', 'ativo'],
  producoes: ['produto_id', 'quantidade', 'data', 'obs'],
  compras: ['item', 'quantidade', 'unidade', 'valor', 'categoria', 'data', 'obs'],
  vendas: ['produto_id', 'produto_nome', 'quantidade', 'preco_unit', 'cliente', 'pagamento', 'pago', 'data', 'obs'],
};

let banco: Banco | null = null;
let contador = 0;
const novoId = () => `demo-${Date.now().toString(36)}-${(contador++).toString(36)}`;
const agora = () => new Date(Date.now() + contador++).toISOString();

const pad = (n: number) => String(n).padStart(2, '0');
function diaISO(diasAtras: number) {
  const d = new Date();
  d.setDate(d.getDate() - diasAtras);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// Gerador aleatório com semente: os dados de exemplo saem sempre iguais
function aleatorio(semente: number) {
  return () => {
    semente = (semente + 0x6d2b79f5) | 0;
    let t = Math.imul(semente ^ (semente >>> 15), 1 | semente);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function gerarExemplo(): Banco {
  const r = aleatorio(20261029);
  const sorteia = <T,>(lista: T[]) => lista[Math.floor(r() * lista.length)];
  const entre = (a: number, b: number) => a + Math.floor(r() * (b - a + 1));

  const produtos: Linha[] = [
    { id: 'p1', nome: 'Chocolate ao leite', preco: 6, ativo: 1 },
    { id: 'p2', nome: 'Doce de leite', preco: 6, ativo: 1 },
    { id: 'p3', nome: 'Brigadeiro', preco: 6.5, ativo: 1 },
    { id: 'p4', nome: 'Beijinho', preco: 6, ativo: 1 },
    { id: 'p5', nome: 'Nutella', preco: 8, ativo: 1 },
  ];
  // Popularidade de cada sabor (Nutella vende menos, Brigadeiro mais)
  const peso: Record<string, number> = { p1: 3, p2: 3, p3: 4, p4: 2, p5: 1 };
  const sorteiaProduto = () => {
    let x = r() * 13;
    for (const p of produtos) { x -= peso[p.id]; if (x <= 0) return p; }
    return produtos[0];
  };

  const clientes = ['Ana Paula', 'Carla', 'Dona Teresa', 'Marcos', 'Juliana', 'Fernanda', 'Roberto', 'Patrícia', 'Lúcia', 'Seu Jorge'];
  const producoes: Linha[] = [];
  const compras: Linha[] = [];
  const vendas: Linha[] = [];
  const estoque: Record<string, number> = { p1: 0, p2: 0, p3: 0, p4: 0, p5: 0 };

  for (let d = 60; d >= 0; d--) {
    const data = diaISO(d);
    const diaSemana = new Date(`${data}T12:00:00`).getDay();

    // Compras: ingredientes toda segunda, embalagem e gás no começo do mês
    if (diaSemana === 1) {
      compras.push({ id: novoId(), item: 'Chocolate meio amargo', quantidade: 2, unidade: 'kg', valor: 89.9, categoria: 'Ingredientes', data, obs: null, criado_em: agora() });
      compras.push({ id: novoId(), item: 'Leite condensado', quantidade: 6, unidade: 'un', valor: 41.4, categoria: 'Ingredientes', data, obs: null, criado_em: agora() });
      compras.push({ id: novoId(), item: 'Mel', quantidade: 1, unidade: 'kg', valor: 32, categoria: 'Ingredientes', data, obs: null, criado_em: agora() });
      compras.push({ id: novoId(), item: 'Farinha de trigo', quantidade: 5, unidade: 'kg', valor: 24.5, categoria: 'Ingredientes', data, obs: null, criado_em: agora() });
    }
    if (data.endsWith('-01') || d === 60) {
      compras.push({ id: novoId(), item: 'Saquinhos e fitas', quantidade: 2, unidade: 'pct', valor: 38, categoria: 'Embalagens', data, obs: null, criado_em: agora() });
      compras.push({ id: novoId(), item: 'Botijão de gás', quantidade: 1, unidade: 'un', valor: 115, categoria: 'Gás/Energia', data, obs: null, criado_em: agora() });
    }

    // Produção: repõe o que está acabando
    for (const p of produtos) {
      if (estoque[p.id] < 8 + peso[p.id] * 2) {
        const qtd = 10 + peso[p.id] * 5;
        estoque[p.id] += qtd;
        producoes.push({ id: novoId(), produto_id: p.id, quantidade: qtd, data, obs: null, criado_em: agora() });
      }
    }

    // Vendas: mais movimento na sexta e no sábado, menos no domingo
    const qtdPedidos = diaSemana === 0 ? entre(0, 1) : diaSemana >= 5 ? entre(4, 7) : entre(1, 4);
    for (let i = 0; i < qtdPedidos; i++) {
      const pedido_id = novoId();
      const cliente = r() < 0.75 ? sorteia(clientes) : null;
      let pagamento = sorteia(['Pix', 'Pix', 'Pix', 'Pix', 'Dinheiro', 'Dinheiro', 'Cartão', 'A receber']);
      if (pagamento === 'A receber' && !cliente) pagamento = 'Pix';
      const pago = pagamento !== 'A receber' || d > 20 ? 1 : 0;
      const sabores = new Set<string>();
      const itens = entre(1, 10) <= 7 ? 1 : entre(2, 3);
      for (let j = 0; j < itens; j++) {
        const p = sorteiaProduto();
        if (sabores.has(p.id)) continue;
        const quantidade = Math.min(entre(1, 4), estoque[p.id]);
        if (quantidade <= 0) continue;
        sabores.add(p.id);
        estoque[p.id] -= quantidade;
        vendas.push({
          id: novoId(), pedido_id, produto_id: p.id, produto_nome: p.nome, quantidade, preco_unit: p.preco,
          cliente, pagamento, pago, data, obs: null, criado_em: agora(),
        });
      }
    }
  }

  return { produtos, producoes, compras, vendas };
}

async function carregar(): Promise<Banco> {
  if (banco) return banco;
  try {
    const salvo = await AsyncStorage.getItem(CHAVE);
    banco = salvo ? JSON.parse(salvo) : gerarExemplo();
  } catch {
    banco = gerarExemplo();
  }
  return banco!;
}

async function salvar() {
  try { await AsyncStorage.setItem(CHAVE, JSON.stringify(banco)); } catch { /* sem armazenamento: segue só na memória */ }
}

const escolher = (obj: any, campos: string[]) =>
  Object.fromEntries(campos.filter(c => obj && c in obj).map(c => [c, typeof obj[c] === 'boolean' ? Number(obj[c]) : obj[c] ?? null]));

function ordenado(b: Banco) {
  const porData = (x: Linha, y: Linha) => y.data.localeCompare(x.data) || String(y.criado_em).localeCompare(String(x.criado_em));
  return {
    produtos: [...b.produtos].sort((x, y) => x.nome.localeCompare(y.nome)),
    producoes: [...b.producoes].sort(porData),
    compras: [...b.compras].sort(porData),
    vendas: [...b.vendas].sort(porData),
  };
}

class ErroDemo extends Error {}

export async function demoReq(metodo: string, caminho: string, corpo?: any): Promise<any> {
  const b = await carregar();
  const [, recurso, id] = caminho.split('/');

  if (recurso === 'login') return { token: 'demo' };
  if (recurso === 'dados') return ordenado(b);

  if (recurso === 'pedidos') {
    if (metodo === 'POST') {
      const itens: any[] = corpo?.itens ?? [];
      if (!itens.length) throw new ErroDemo('O pedido precisa ter pelo menos um sabor.');
      for (const item of itens) {
        const produzido = b.producoes.filter(p => p.produto_id === item.produto_id).reduce((t, p) => t + p.quantidade, 0);
        const vendido = b.vendas.filter(v => v.produto_id === item.produto_id).reduce((t, v) => t + v.quantidade, 0);
        if (item.quantidade > produzido - vendido) {
          throw new ErroDemo(`Sem estoque suficiente de ${item.produto_nome} (tem ${Math.max(0, produzido - vendido)}).`);
        }
      }
      const pedido_id = novoId();
      const comum = escolher(corpo, ['cliente', 'pagamento', 'pago', 'data', 'obs']);
      for (const item of itens) {
        b.vendas.push({ id: novoId(), pedido_id, ...comum, ...escolher(item, ['produto_id', 'produto_nome', 'quantidade', 'preco_unit']), criado_em: agora() });
      }
      await salvar();
      return { id: pedido_id };
    }
    const doPedido = (v: Linha) => v.pedido_id === id || v.id === id;
    if (metodo === 'PATCH') {
      const mudancas = escolher(corpo, ['cliente', 'pagamento', 'pago', 'data', 'obs']);
      b.vendas = b.vendas.map(v => (doPedido(v) ? { ...v, ...mudancas } : v));
    }
    if (metodo === 'DELETE') b.vendas = b.vendas.filter(v => !doPedido(v));
    await salvar();
    return { ok: true };
  }

  const tabela = recurso as keyof Banco;
  if (!(tabela in TABELAS)) throw new ErroDemo('Tabela não encontrada.');

  if (metodo === 'POST') {
    const novo = { id: novoId(), ...escolher(corpo, TABELAS[tabela]), criado_em: agora() };
    b[tabela].push(novo);
    await salvar();
    return { id: novo.id };
  }
  if (metodo === 'PATCH') {
    const mudancas = escolher(corpo, TABELAS[tabela]);
    b[tabela] = b[tabela].map(l => (l.id === id ? { ...l, ...mudancas } : l));
  }
  if (metodo === 'DELETE') {
    if (tabela === 'produtos') {
      b.producoes = b.producoes.filter(p => p.produto_id !== id);
      b.vendas = b.vendas.map(v => (v.produto_id === id ? { ...v, produto_id: null } : v));
    }
    b[tabela] = b[tabela].filter(l => l.id !== id);
  }
  await salvar();
  return { ok: true };
}
