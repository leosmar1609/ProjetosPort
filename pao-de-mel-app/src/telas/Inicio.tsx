import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Barra, BotaoRedondo, Cabecalho, Card, Chips, Grade, Linha, Stat, Tela, Vazio } from '../componentes/ui';
import { chavePedido, resumoItens, useDados } from '../dados';
import { confirmar } from '../lib/alertas';
import { brl, dataBR, inicioPeriodo, PERIODOS, type Periodo } from '../lib/formato';
import { C, MARCA } from '../tema';

export default function Inicio() {
  const { vendas, pedidos, compras, produtos, estoque, carregando, carregar, sair } = useDados();
  const [periodo, setPeriodo] = useState<Periodo>('mes');

  const r = useMemo(() => {
    const ini = inicioPeriodo(periodo);
    const vs = vendas.filter(v => v.data >= ini);
    const faturamento = vs.reduce((t, v) => t + v.quantidade * v.preco_unit, 0);
    const gastos = compras.filter(c => c.data >= ini).reduce((t, c) => t + c.valor, 0);
    const unidades = vs.reduce((t, v) => t + v.quantidade, 0);
    const aReceber = vendas.filter(v => !v.pago).reduce((t, v) => t + v.quantidade * v.preco_unit, 0);

    const porProduto: Record<string, { qtd: number; total: number }> = {};
    vs.forEach(v => {
      porProduto[v.produto_nome] ??= { qtd: 0, total: 0 };
      porProduto[v.produto_nome].qtd += v.quantidade;
      porProduto[v.produto_nome].total += v.quantidade * v.preco_unit;
    });
    const ranking = Object.entries(porProduto).sort((a, b) => b[1].total - a[1].total);

    return { faturamento, gastos, lucro: faturamento - gastos, unidades, aReceber, ranking, qtdVendas: new Set(vs.map(chavePedido)).size };
  }, [vendas, compras, periodo]);

  const estoqueBaixo = produtos.filter(p => p.ativo && (estoque[p.id] ?? 0) <= 5);
  const maiorTotal = r.ranking[0]?.[1].total || 1;
  const nomePeriodo = PERIODOS.find(p => p.valor === periodo)!.label.toLowerCase();

  return (
    <View style={{ flex: 1 }}>
      <Cabecalho
        subtitulo="Olá, Neide 👋"
        titulo={MARCA}
        direita={<BotaoRedondo icone="log-out-outline" onPress={() => confirmar('Deseja sair da conta?', 'Sair', sair)} />}
      >
        <View style={s.destaque}>
          <Text style={s.destaqueLabel}>Faturamento · {nomePeriodo}</Text>
          <Text style={s.destaqueValor}>{brl(r.faturamento)}</Text>
          <Text style={s.destaqueSub}>{r.qtdVendas} vendas · {r.unidades} pães de mel</Text>
        </View>
      </Cabecalho>

      <Tela carregando={carregando} onRefresh={carregar}>
        <Chips opcoes={PERIODOS} valor={periodo} onChange={setPeriodo} />

        <Grade>
          <Stat titulo="Lucro" valor={brl(r.lucro)} icone="trending-up" cor={r.lucro >= 0 ? C.ok : C.bad} fundo={r.lucro >= 0 ? C.okClaro : C.badClaro} />
          <Stat titulo="Gastos" valor={brl(r.gastos)} icone="basket-outline" />
          <Stat titulo="A receber" valor={brl(r.aReceber)} icone="time-outline" cor={r.aReceber > 0 ? C.bad : C.pri} fundo={r.aReceber > 0 ? C.badClaro : C.melClaro} />
          <Stat titulo="Ticket médio" valor={brl(r.qtdVendas ? r.faturamento / r.qtdVendas : 0)} icone="receipt-outline" />
        </Grade>

        <Card titulo="Mais vendidos">
          {r.ranking.length ? r.ranking.map(([nome, x]) => (
            <View key={nome} style={s.rank}>
              <View style={s.rankTopo}>
                <Text style={s.rankNome}>{nome}</Text>
                <Text style={s.rankValor}>{x.qtd} un · {brl(x.total)}</Text>
              </View>
              <Barra fracao={x.total / maiorTotal} />
            </View>
          )) : <Vazio icone="stats-chart-outline" texto="Nenhuma venda nesse período." />}
        </Card>

        {estoqueBaixo.length > 0 && (
          <Card titulo="⚠️ Estoque baixo">
            {estoqueBaixo.map(p => (
              <Linha key={p.id} icone="cube-outline" corIcone={C.bad} fundoIcone={C.badClaro} titulo={p.nome}
                valor={`${estoque[p.id] ?? 0} un`} />
            ))}
          </Card>
        )}

        <Card titulo="Últimas vendas">
          {pedidos.length ? pedidos.slice(0, 5).map(p => (
            <Linha key={p.id} icone="cart-outline" titulo={resumoItens(p)}
              sub={[p.cliente, dataBR(p.data)].filter(Boolean).join(' · ')} valor={brl(p.total)}
              selo={p.pago ? undefined : { texto: 'A receber', cor: C.bad, fundo: C.badClaro }} />
          )) : <Vazio icone="cart-outline" texto="Ainda não tem vendas. Bora vender! 🍯" />}
        </Card>
      </Tela>
    </View>
  );
}

const s = StyleSheet.create({
  destaque: { marginTop: 18, width: '100%', maxWidth: 720, alignSelf: 'center' },
  destaqueLabel: { color: '#F3D9B5', fontSize: 14 },
  destaqueValor: { color: '#fff', fontSize: 36, fontWeight: '800', marginTop: 2 },
  destaqueSub: { color: '#F3D9B5', fontSize: 14, marginTop: 2 },
  rank: { paddingVertical: 8 },
  rankTopo: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  rankNome: { color: C.txt, fontWeight: '600', fontSize: 15, flex: 1 },
  rankValor: { color: C.mut, fontSize: 14 },
});
