import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { req } from './lib/api';
import { aviso } from './lib/alertas';

export type Produto = { id: string; nome: string; preco: number; ativo: boolean };
export type Producao = { id: string; produto_id: string; quantidade: number; data: string; obs: string | null };
export type Compra = { id: string; item: string; quantidade: number | null; unidade: string | null; valor: number; categoria: string; data: string; obs: string | null };
export type Venda = {
  id: string; pedido_id: string | null; produto_id: string | null; produto_nome: string; quantidade: number; preco_unit: number;
  cliente: string | null; pagamento: string; pago: boolean; data: string; obs: string | null;
};
export type Tabela = 'produtos' | 'producoes' | 'compras' | 'vendas';

// Um pedido = uma venda, que pode ter vários sabores (cada sabor é uma linha em "vendas")
export type Pedido = {
  id: string; itens: Venda[]; cliente: string | null; pagamento: string; pago: boolean; data: string;
  total: number; unidades: number;
};
export type NovoPedido = {
  itens: { produto_id: string; produto_nome: string; quantidade: number; preco_unit: number }[];
  cliente: string | null; pagamento: string; pago: boolean; data: string;
};

export const chavePedido = (v: Venda) => v.pedido_id ?? v.id;

// Agrupa as linhas de venda em pedidos, mantendo a ordem (mais recentes primeiro)
export function agruparPedidos(vendas: Venda[]): Pedido[] {
  const mapa = new Map<string, Pedido>();
  for (const v of vendas) {
    const id = chavePedido(v);
    let p = mapa.get(id);
    if (!p) {
      p = { id, itens: [], cliente: v.cliente, pagamento: v.pagamento, pago: v.pago, data: v.data, total: 0, unidades: 0 };
      mapa.set(id, p);
    }
    p.itens.push(v);
    p.total += v.quantidade * v.preco_unit;
    p.unidades += v.quantidade;
    if (!v.pago) p.pago = false;
  }
  return [...mapa.values()];
}

export const resumoItens = (p: Pedido) => p.itens.map(i => `${i.quantidade}x ${i.produto_nome}`).join(', ');

type Estado = { produtos: Produto[]; producoes: Producao[]; compras: Compra[]; vendas: Venda[] };

type Dados = Estado & {
  pedidos: Pedido[];
  estoque: Record<string, number>;
  criarPedido: (p: NovoPedido) => Promise<boolean>;
  atualizarPedido: (id: string, mudancas: Partial<Pick<Pedido, 'pago' | 'cliente' | 'pagamento' | 'data'>>) => Promise<boolean>;
  excluirPedido: (id: string) => Promise<boolean>;
  carregando: boolean;
  carregar: () => Promise<void>;
  inserir: (t: Tabela, linha: object) => Promise<boolean>;
  atualizar: (t: Tabela, id: string, mudancas: object) => Promise<boolean>;
  excluir: (t: Tabela, id: string) => Promise<boolean>;
  sair: () => void;
};

const Ctx = createContext<Dados | null>(null);

export function useDados() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useDados precisa estar dentro de <DadosProvider>');
  return c;
}

// O MySQL devolve booleanos como 0/1 e datas como texto; aqui deixamos tudo no formato certo
const n = (x: unknown) => Number(x ?? 0);
function normalizar(d: Estado): Estado {
  return {
    produtos: d.produtos.map(p => ({ ...p, preco: n(p.preco), ativo: !!p.ativo })),
    producoes: d.producoes.map(p => ({ ...p, quantidade: n(p.quantidade), data: String(p.data).slice(0, 10) })),
    compras: d.compras.map(c => ({ ...c, valor: n(c.valor), quantidade: c.quantidade == null ? null : n(c.quantidade), data: String(c.data).slice(0, 10) })),
    // Vendas antigas foram gravadas como "Fiado"; hoje o nome é "A receber"
    vendas: d.vendas.map(v => ({ ...v, pagamento: v.pagamento === 'Fiado' ? 'A receber' : v.pagamento, pedido_id: v.pedido_id ?? null, quantidade: n(v.quantidade), preco_unit: n(v.preco_unit), pago: !!v.pago, data: String(v.data).slice(0, 10) })),
  };
}

export function DadosProvider({ children, onSair }: { children: ReactNode; onSair: () => void }) {
  const [estado, setEstado] = useState<Estado>({ produtos: [], producoes: [], compras: [], vendas: [] });
  const [carregando, setCarregando] = useState(true);

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      setEstado(normalizar(await req<Estado>('GET', '/dados')));
    } catch (e) {
      aviso((e as Error).message);
    }
    setCarregando(false);
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  const executar = useCallback(async (acao: () => Promise<unknown>) => {
    try {
      await acao();
      await carregar();
      return true;
    } catch (e) {
      aviso((e as Error).message);
      return false;
    }
  }, [carregar]);

  const estoque = useMemo(() => {
    const e: Record<string, number> = {};
    estado.producoes.forEach(p => { e[p.produto_id] = (e[p.produto_id] ?? 0) + p.quantidade; });
    estado.vendas.forEach(v => { if (v.produto_id) e[v.produto_id] = (e[v.produto_id] ?? 0) - v.quantidade; });
    return e;
  }, [estado]);

  const pedidos = useMemo(() => agruparPedidos(estado.vendas), [estado.vendas]);

  const valor: Dados = {
    ...estado,
    pedidos,
    estoque,
    criarPedido: p => executar(() => req('POST', '/pedidos', p)),
    atualizarPedido: (id, mudancas) => executar(() => req('PATCH', `/pedidos/${id}`, mudancas)),
    excluirPedido: id => executar(() => req('DELETE', `/pedidos/${id}`)),
    carregando,
    carregar,
    inserir: (t, linha) => executar(() => req('POST', `/${t}`, linha)),
    atualizar: (t, id, mudancas) => executar(() => req('PATCH', `/${t}/${id}`, mudancas)),
    excluir: (t, id) => executar(() => req('DELETE', `/${t}/${id}`)),
    sair: onSair,
  };

  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>;
}
