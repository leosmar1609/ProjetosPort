import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Barra, Cabecalho, Card, Chips, Colunas, Grade, Linha, Stat, Tela, Vazio, type Icone } from '../componentes/ui';
import { chavePedido, useDados } from '../dados';
import { brl, dataBR, diaDaSemana, diasAtrasISO, diasEntre, hojeISO } from '../lib/formato';
import { C, MARCA } from '../tema';

type Periodo = '30' | '90' | 'tudo';
const PERIODOS: { valor: Periodo; label: string }[] = [
  { valor: '30', label: '30 dias' },
  { valor: '90', label: '90 dias' },
  { valor: 'tudo', label: 'Tudo' },
];
const DIAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const DIAS_LONGO = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];

type Dica = { tipo: 'bom' | 'alerta' | 'ideia'; titulo: string; texto: string };
const ESTILO_DICA: Record<Dica['tipo'], { icone: Icone; cor: string; fundo: string; rotulo: string }> = {
  bom: { icone: 'checkmark-circle', cor: C.ok, fundo: C.okClaro, rotulo: 'Ponto forte' },
  alerta: { icone: 'warning', cor: C.bad, fundo: C.badClaro, rotulo: 'Atenção' },
  ideia: { icone: 'bulb', cor: '#B7791F', fundo: '#FEF3C7', rotulo: 'Estratégia' },
};

const pct = (n: number) => `${Math.round(n * 100)}%`;
const soma = <T,>(lista: T[], f: (x: T) => number) => lista.reduce((t, x) => t + f(x), 0);

export default function Analises() {
  const { vendas, compras, producoes, produtos, estoque, carregando, carregar } = useDados();
  const [periodo, setPeriodo] = useState<Periodo>('30');

  const a = useMemo(() => {
    const hoje = hojeISO();
    const primeira = [...vendas, ...compras].reduce((m, x) => (x.data < m ? x.data : m), hoje);
    const dias = periodo === 'tudo' ? Math.max(1, diasEntre(primeira, hoje) + 1) : Number(periodo);
    const ini = periodo === 'tudo' ? '0000-00-00' : diasAtrasISO(dias - 1);

    const vs = vendas.filter(v => v.data >= ini);
    const cs = compras.filter(c => c.data >= ini);
    const ps = producoes.filter(p => p.data >= ini);
    const totalVenda = (v: (typeof vendas)[number]) => v.quantidade * v.preco_unit;

    const faturamento = soma(vs, totalVenda);
    const gastos = soma(cs, c => c.valor);
    const lucro = faturamento - gastos;
    const unidVendidas = soma(vs, v => v.quantidade);
    const unidProduzidas = soma(ps, p => p.quantidade);
    const custoUnit = unidProduzidas ? gastos / unidProduzidas : null;
    const precoMedio = unidVendidas ? faturamento / unidVendidas : 0;
    const margem = faturamento ? lucro / faturamento : 0;

    // Comparação com o período anterior de mesmo tamanho
    let crescimento: number | null = null;
    if (periodo !== 'tudo') {
      const iniAnt = diasAtrasISO(dias * 2 - 1);
      const fatAnt = soma(vendas.filter(v => v.data >= iniAnt && v.data < ini), totalVenda);
      crescimento = fatAnt ? (faturamento - fatAnt) / fatAnt : null;
    }

    // Faturamento dos últimos 14 dias
    const ultimos14 = Array.from({ length: 14 }, (_, i) => {
      const dia = diasAtrasISO(13 - i);
      return { label: dia.slice(8), valor: soma(vendas.filter(v => v.data === dia), totalVenda), dia };
    });

    // Por dia da semana
    const semana = DIAS.map(label => ({ label, valor: 0 }));
    vs.forEach(v => { semana[diaDaSemana(v.data)].valor += totalVenda(v); });

    // Por produto
    const porProdutoMap: Record<string, { nome: string; qtd: number; total: number }> = {};
    vs.forEach(v => {
      porProdutoMap[v.produto_nome] ??= { nome: v.produto_nome, qtd: 0, total: 0 };
      porProdutoMap[v.produto_nome].qtd += v.quantidade;
      porProdutoMap[v.produto_nome].total += totalVenda(v);
    });
    const porProduto = Object.values(porProdutoMap).sort((x, y) => y.total - x.total);

    // Formas de pagamento
    const pagMap: Record<string, number> = {};
    vs.forEach(v => { pagMap[v.pagamento] = (pagMap[v.pagamento] ?? 0) + totalVenda(v); });
    const pagamentos = Object.entries(pagMap).sort((x, y) => y[1] - x[1]);

    // Clientes
    const cliMap: Record<string, { nome: string; total: number; pedidos: Set<string> }> = {};
    vs.filter(v => v.cliente).forEach(v => {
      const nome = v.cliente!.trim();
      cliMap[nome.toLowerCase()] ??= { nome, total: 0, pedidos: new Set() };
      cliMap[nome.toLowerCase()].total += totalVenda(v);
      cliMap[nome.toLowerCase()].pedidos.add(chavePedido(v));
    });
    const clientes = Object.values(cliMap)
      .map(c => ({ nome: c.nome, total: c.total, compras: c.pedidos.size }))
      .sort((x, y) => y.total - x.total).slice(0, 5);

    // A receber pendente (todo o histórico)
    const receberMap: Record<string, { nome: string; total: number; desde: string }> = {};
    vendas.filter(v => !v.pago).forEach(v => {
      const nome = v.cliente?.trim() || 'Sem nome';
      const f = (receberMap[nome.toLowerCase()] ??= { nome, total: 0, desde: v.data });
      f.total += totalVenda(v);
      if (v.data < f.desde) f.desde = v.data;
    });
    const aReceber = Object.values(receberMap).sort((x, y) => x.desde.localeCompare(y.desde));
    const totalReceber = soma(aReceber, f => f.total);

    // Quantos dias o estoque dura (média dos últimos 30 dias)
    const ini30 = diasAtrasISO(29);
    const cobertura = produtos.filter(p => p.ativo).map(p => {
      const vendidos30 = soma(vendas.filter(v => v.produto_id === p.id && v.data >= ini30), v => v.quantidade);
      const porDia = vendidos30 / 30;
      const qtd = estoque[p.id] ?? 0;
      return { produto: p, qtd, porDia, dias: porDia > 0 ? qtd / porDia : null };
    }).sort((x, y) => (x.dias ?? 9999) - (y.dias ?? 9999));

    // Gastos por categoria
    const catMap: Record<string, number> = {};
    cs.forEach(c => { catMap[c.categoria] = (catMap[c.categoria] ?? 0) + c.valor; });
    const categorias = Object.entries(catMap).sort((x, y) => y[1] - x[1]);

    // Ponto de equilíbrio do mês atual
    const iniMes = hoje.slice(0, 8) + '01';
    const vendasMes = vendas.filter(v => v.data >= iniMes);
    const gastosMes = soma(compras.filter(c => c.data >= iniMes), c => c.valor);
    const unidMes = soma(vendasMes, v => v.quantidade);
    const precoMedioGeral = soma(vendas, v => v.quantidade) ? soma(vendas, totalVenda) / soma(vendas, v => v.quantidade) : 0;
    const unidEquilibrio = precoMedioGeral ? Math.ceil(gastosMes / precoMedioGeral) : 0;

    return {
      dias, faturamento, gastos, lucro, margem, unidVendidas, custoUnit, precoMedio, crescimento, qtdVendas: new Set(vs.map(chavePedido)).size,
      ultimos14, semana, porProduto, pagamentos, clientes, aReceber, totalReceber, cobertura, categorias,
      gastosMes, unidMes, unidEquilibrio,
    };
  }, [vendas, compras, producoes, produtos, estoque, periodo]);

  const dicas = useMemo(() => gerarDicas(a), [a]);
  const maiorProduto = a.porProduto[0]?.total || 1;
  const semDados = a.qtdVendas === 0;

  return (
    <View style={{ flex: 1 }}>
      <Cabecalho subtitulo={MARCA} titulo="Análises" />

      <Tela carregando={carregando} onRefresh={carregar}>
        <Chips opcoes={PERIODOS} valor={periodo} onChange={setPeriodo} />

        <Grade>
          <Stat titulo="Margem de lucro" valor={semDados ? '—' : pct(a.margem)} icone="pie-chart-outline"
            cor={a.margem >= 0.3 ? C.ok : a.margem >= 0 ? C.pri : C.bad} fundo={a.margem >= 0.3 ? C.okClaro : a.margem >= 0 ? C.melClaro : C.badClaro} />
          <Stat titulo="Crescimento" valor={a.crescimento == null ? '—' : `${a.crescimento >= 0 ? '+' : ''}${pct(a.crescimento)}`}
            icone={a.crescimento != null && a.crescimento < 0 ? 'trending-down' : 'trending-up'}
            cor={a.crescimento == null ? C.pri : a.crescimento >= 0 ? C.ok : C.bad}
            fundo={a.crescimento == null ? C.melClaro : a.crescimento >= 0 ? C.okClaro : C.badClaro} />
          <Stat titulo="Custo por unidade" valor={a.custoUnit == null ? '—' : brl(a.custoUnit)} icone="calculator-outline" />
          <Stat titulo="Preço médio" valor={a.precoMedio ? brl(a.precoMedio) : '—'} icone="pricetag-outline" />
        </Grade>

        <Card titulo="💡 Estratégias para você">
          {dicas.map((d, i) => {
            const e = ESTILO_DICA[d.tipo];
            return (
              <View key={i} style={[s.dica, i === dicas.length - 1 && { borderBottomWidth: 0 }]}>
                <View style={[s.dicaIcone, { backgroundColor: e.fundo }]}><Ionicons name={e.icone} size={18} color={e.cor} /></View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.dicaRotulo, { color: e.cor }]}>{e.rotulo}</Text>
                  <Text style={s.dicaTitulo}>{d.titulo}</Text>
                  <Text style={s.dicaTexto}>{d.texto}</Text>
                </View>
              </View>
            );
          })}
        </Card>

        <Card titulo="Faturamento · últimos 14 dias">
          <Colunas dados={a.ultimos14.map(d => ({ label: d.label, valor: d.valor }))} formato={brl} />
          <Text style={s.nota}>Toque numa coluna para ver o valor do dia.</Text>
        </Card>

        <Card titulo="Vendas por dia da semana">
          <Colunas dados={a.semana} formato={brl} />
        </Card>

        <Card titulo="Desempenho por sabor">
          {a.porProduto.length ? a.porProduto.map(p => {
            const lucroUnit = a.custoUnit != null ? p.total / p.qtd - a.custoUnit : null;
            return (
              <View key={p.nome} style={s.item}>
                <View style={s.itemTopo}>
                  <Text style={s.itemNome}>{p.nome}</Text>
                  <Text style={s.itemValor}>{brl(p.total)}</Text>
                </View>
                <Barra fracao={p.total / maiorProduto} />
                <Text style={s.itemSub}>
                  {p.qtd} un · {pct(p.total / (a.faturamento || 1))} do faturamento
                  {lucroUnit != null ? ` · lucro aprox. ${brl(lucroUnit)}/un` : ''}
                </Text>
              </View>
            );
          }) : <Vazio icone="stats-chart-outline" texto="Sem vendas no período." />}
        </Card>

        <Card titulo="Ponto de equilíbrio do mês">
          {a.gastosMes > 0 && a.unidEquilibrio > 0 ? (
            <>
              <Text style={s.texto}>
                Para pagar os {brl(a.gastosMes)} gastos este mês, você precisa vender cerca de <Text style={s.forte}>{a.unidEquilibrio} pães de mel</Text>.
              </Text>
              <Barra fracao={a.unidMes / a.unidEquilibrio} />
              <Text style={s.itemSub}>
                {a.unidMes >= a.unidEquilibrio
                  ? `✅ Meta batida! Tudo que vender agora (${a.unidMes} un até aqui) é lucro.`
                  : `${a.unidMes} de ${a.unidEquilibrio} vendidos · faltam ${a.unidEquilibrio - a.unidMes}`}
              </Text>
            </>
          ) : <Text style={s.texto}>Registre compras e vendas deste mês para calcular.</Text>}
        </Card>

        <Card titulo="A receber" direita={a.totalReceber > 0 ? <Text style={s.receberTotal}>{brl(a.totalReceber)}</Text> : undefined}>
          {a.aReceber.length ? a.aReceber.map(f => {
            const dias = diasEntre(f.desde, hojeISO());
            return (
              <Linha key={f.nome} icone="person-outline" corIcone={dias > 15 ? C.bad : C.pri} fundoIcone={dias > 15 ? C.badClaro : C.melClaro}
                titulo={f.nome} sub={`desde ${dataBR(f.desde)} · ${dias} ${dias === 1 ? 'dia' : 'dias'}`} valor={brl(f.total)} />
            );
          }) : <Vazio icone="happy-outline" texto="Ninguém devendo. 🎉" />}
        </Card>

        <Card titulo="Melhores clientes">
          {a.clientes.length ? a.clientes.map((c, i) => (
            <Linha key={c.nome} icone={i === 0 ? 'trophy-outline' : 'person-outline'} titulo={c.nome}
              sub={`${c.compras} ${c.compras === 1 ? 'compra' : 'compras'}`} valor={brl(c.total)} />
          )) : <Vazio icone="people-outline" texto="Coloque o nome do cliente nas vendas para ver quem compra mais." />}
        </Card>

        <Card titulo="Estoque · dura quantos dias?">
          {a.cobertura.length ? a.cobertura.map(c => (
            <Linha key={c.produto.id} icone="cube-outline" titulo={c.produto.nome}
              sub={c.porDia > 0 ? `${c.qtd} un · vende ~${c.porDia.toFixed(1).replace('.', ',')} por dia` : `${c.qtd} un · sem vendas em 30 dias`}
              valor={c.dias == null ? '—' : c.qtd <= 0 ? 'Acabou' : `${Math.floor(c.dias)} dias`}
              selo={c.dias != null && c.dias < 3 ? { texto: 'Produzir', cor: C.bad, fundo: C.badClaro }
                : c.dias != null && c.dias > 21 ? { texto: 'Parado', cor: '#B7791F', fundo: '#FEF3C7' } : undefined} />
          )) : <Vazio icone="cube-outline" texto="Cadastre produtos para ver o estoque." />}
        </Card>

        <Card titulo="Formas de pagamento">
          {a.pagamentos.length ? a.pagamentos.map(([nome, total]) => (
            <View key={nome} style={s.item}>
              <View style={s.itemTopo}>
                <Text style={s.itemNome}>{nome}</Text>
                <Text style={s.itemValor}>{pct(total / (a.faturamento || 1))} · {brl(total)}</Text>
              </View>
              <Barra fracao={total / (a.faturamento || 1)} />
            </View>
          )) : <Vazio icone="wallet-outline" texto="Sem vendas no período." />}
        </Card>

        <Card titulo="Para onde vai o dinheiro">
          {a.categorias.length ? a.categorias.map(([nome, total]) => (
            <View key={nome} style={s.item}>
              <View style={s.itemTopo}>
                <Text style={s.itemNome}>{nome}</Text>
                <Text style={s.itemValor}>{pct(total / (a.gastos || 1))} · {brl(total)}</Text>
              </View>
              <Barra fracao={total / (a.gastos || 1)} />
            </View>
          )) : <Vazio icone="basket-outline" texto="Sem compras no período." />}
        </Card>
      </Tela>
    </View>
  );
}

type Analise = {
  dias: number; faturamento: number; gastos: number; margem: number; unidVendidas: number; custoUnit: number | null;
  precoMedio: number; crescimento: number | null; qtdVendas: number; semana: { label: string; valor: number }[];
  porProduto: { nome: string; qtd: number; total: number }[]; pagamentos: [string, number][];
  clientes: { nome: string; total: number; compras: number }[]; aReceber: { nome: string; total: number; desde: string }[];
  totalReceber: number; cobertura: { produto: { nome: string }; qtd: number; porDia: number; dias: number | null }[];
  categorias: [string, number][];
};

function gerarDicas(a: Analise): Dica[] {
  const d: Dica[] = [];

  if (a.qtdVendas < 5) {
    d.push({ tipo: 'ideia', titulo: 'Registre todas as vendas', texto: 'Com mais vendas registradas, as análises e estratégias ficam bem mais certeiras.' });
  }

  // Margem e preço
  if (a.custoUnit != null && a.precoMedio > 0) {
    const precoIdeal = a.custoUnit / 0.5;
    if (a.margem < 0.3) {
      d.push({
        tipo: 'alerta', titulo: `Margem baixa (${pct(a.margem)})`,
        texto: `Cada pão de mel custa ~${brl(a.custoUnit)} pra fazer e sai em média por ${brl(a.precoMedio)}. Para ter 50% de margem, o preço ideal seria por volta de ${brl(precoIdeal)}. Outra saída: comprar ingredientes no atacado.`,
      });
    } else if (a.margem >= 0.5) {
      d.push({ tipo: 'bom', titulo: `Margem saudável (${pct(a.margem)})`, texto: 'Seu preço está cobrindo bem os custos. Dá espaço para fazer promoções pontuais sem ter prejuízo.' });
    }
  } else if (a.faturamento > 0 && a.custoUnit == null) {
    d.push({ tipo: 'ideia', titulo: 'Registre a produção', texto: 'Lançando quantos pães de mel você produz (aba Produtos), o app calcula o custo por unidade e o preço ideal.' });
  }

  // Crescimento
  if (a.crescimento != null) {
    if (a.crescimento >= 0.1) d.push({ tipo: 'bom', titulo: `Vendas subiram ${pct(a.crescimento)}`, texto: `Comparado aos ${a.dias} dias anteriores. Continue com o que está funcionando!` });
    else if (a.crescimento <= -0.1) d.push({ tipo: 'alerta', titulo: `Vendas caíram ${pct(-a.crescimento)}`, texto: 'Experimente postar fotos no status do WhatsApp, chamar clientes antigos ou lançar um sabor novo.' });
  }

  // Campeão e lanterna
  if (a.porProduto.length >= 2) {
    const top = a.porProduto[0];
    const fim = a.porProduto[a.porProduto.length - 1];
    d.push({ tipo: 'bom', titulo: `${top.nome} é o campeão`, texto: `Representa ${pct(top.total / a.faturamento)} do faturamento. Nunca deixe faltar e use ele para puxar vendas de outros sabores em kits.` });
    if (fim.total / a.faturamento < 0.1) {
      d.push({ tipo: 'ideia', titulo: `${fim.nome} vende pouco`, texto: 'Teste colocar em um kit com o campeão, fazer degustação ou avaliar se vale continuar produzindo.' });
    }
  }

  // Dia da semana
  const comVenda = a.semana.filter(x => x.valor > 0);
  if (comVenda.length >= 3) {
    const ordenado = a.semana.map((x, i) => ({ ...x, i })).sort((x, y) => y.valor - x.valor);
    const melhor = ordenado[0];
    const pior = ordenado.filter(x => x.valor > 0).pop()!;
    d.push({ tipo: 'ideia', titulo: `${DIAS_LONGO[melhor.i][0].toUpperCase() + DIAS_LONGO[melhor.i].slice(1)} é seu melhor dia`, texto: `Produza mais na véspera e reforce a divulgação na ${DIAS_LONGO[melhor.i]} de manhã. Na ${DIAS_LONGO[pior.i]}, que é mais fraca, tente uma promoção relâmpago.` });
  }

  // Ticket médio
  if (a.qtdVendas >= 5) {
    const unPorVenda = a.unidVendidas / a.qtdVendas;
    if (unPorVenda < 2) {
      d.push({ tipo: 'ideia', titulo: 'Aumente o ticket médio', texto: `Cada cliente leva em média ${unPorVenda.toFixed(1).replace('.', ',')} unidade. Ofereça "leve 3 pague menos" ou kits de presente para vender mais por cliente.` });
    }
  }

  // A receber
  if (a.totalReceber > 0) {
    const antigo = a.aReceber[0];
    const dias = diasEntre(antigo.desde, hojeISO());
    d.push({
      tipo: dias > 15 ? 'alerta' : 'ideia', titulo: `${brl(a.totalReceber)} a receber`,
      texto: `São ${a.aReceber.length} ${a.aReceber.length === 1 ? 'cliente' : 'clientes'} devendo. ${antigo.nome} deve há ${dias} dias. Mande uma mensagem gentil com a chave Pix.`,
    });
  }
  const receberPag = a.pagamentos.find(([n]) => n === 'A receber')?.[1] ?? 0;
  if (a.faturamento > 0 && receberPag / a.faturamento > 0.25) {
    d.push({ tipo: 'alerta', titulo: 'Muitas vendas a receber', texto: `${pct(receberPag / a.faturamento)} das vendas ficaram para receber depois. Incentive o Pix na hora (um descontinho ajuda) para não ficar sem caixa.` });
  }

  // Estoque
  const acabando = a.cobertura.filter(c => c.dias != null && c.dias < 3);
  if (acabando.length) {
    d.push({ tipo: 'alerta', titulo: 'Hora de produzir', texto: `${acabando.map(c => c.produto.nome).join(', ')} ${acabando.length === 1 ? 'deve acabar' : 'devem acabar'} em menos de 3 dias no ritmo atual.` });
  }
  const parados = a.cobertura.filter(c => c.dias != null && c.dias > 21);
  if (parados.length) {
    d.push({ tipo: 'ideia', titulo: 'Estoque parado', texto: `${parados.map(c => c.produto.nome).join(', ')} ${parados.length === 1 ? 'tem' : 'têm'} estoque para mais de 3 semanas. Atenção à validade: faça uma promoção para girar.` });
  }

  // Clientes fiéis
  if (a.clientes.length && a.clientes[0].compras >= 3) {
    d.push({ tipo: 'ideia', titulo: `Fidelize ${a.clientes[0].nome}`, texto: `É seu melhor cliente (${a.clientes[0].compras} compras). Um brinde ou cartão fidelidade ("a cada 10, ganhe 1") mantém essa pessoa por perto.` });
  }

  // Gastos
  const embalagens = a.categorias.find(([n]) => n === 'Embalagens')?.[1] ?? 0;
  if (a.gastos > 0 && embalagens / a.gastos > 0.25) {
    d.push({ tipo: 'ideia', titulo: 'Embalagens pesando', texto: `${pct(embalagens / a.gastos)} dos gastos são com embalagens. Comprar em maior quantidade costuma baixar bastante o preço.` });
  }

  if (!d.length) d.push({ tipo: 'bom', titulo: 'Tudo em ordem', texto: 'Nenhum ponto de atenção no período. Continue registrando para acompanhar.' });

  const ordem = { alerta: 0, ideia: 1, bom: 2 };
  return d.sort((x, y) => ordem[x.tipo] - ordem[y.tipo]);
}

const s = StyleSheet.create({
  dica: { flexDirection: 'row', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F6EEE3' },
  dicaIcone: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  dicaRotulo: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  dicaTitulo: { color: C.txt, fontSize: 15, fontWeight: '700', marginTop: 2 },
  dicaTexto: { color: C.mut, fontSize: 14, marginTop: 3, lineHeight: 20 },
  nota: { color: C.mut, fontSize: 12, marginTop: 8 },
  item: { paddingVertical: 8 },
  itemTopo: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  itemNome: { color: C.txt, fontSize: 15, fontWeight: '600', flex: 1 },
  itemValor: { color: C.txt, fontSize: 14, fontWeight: '600' },
  itemSub: { color: C.mut, fontSize: 13, marginTop: 6 },
  texto: { color: C.txt, fontSize: 14, lineHeight: 21, marginBottom: 4 },
  forte: { fontWeight: '800', color: C.pri },
  receberTotal: { color: C.bad, fontSize: 18, fontWeight: '800' },
});
