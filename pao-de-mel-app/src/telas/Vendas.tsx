import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  Botao, BotaoRedondo, Cabecalho, Campo, CampoData, Card, Chips, Folha, formatarValor, Linha, mascaraValor, Tela,
  TotalDestaque, Vazio,
} from '../componentes/ui';
import { resumoItens, useDados, type Produto } from '../dados';
import { aviso, confirmar } from '../lib/alertas';
import { brl, dataBR, hojeBR, hojeISO, isoDeBR, num } from '../lib/formato';
import { C, MARCA } from '../tema';

type Filtro = 'todas' | 'receber' | 'hoje';
const FILTROS: { valor: Filtro; label: string }[] = [
  { valor: 'todas', label: 'Todas' },
  { valor: 'receber', label: 'A receber' },
  { valor: 'hoje', label: 'Hoje' },
];

type Pagamento = 'Pix' | 'Dinheiro' | 'Cartão' | 'A receber';
const PAGAMENTOS: { valor: Pagamento; label: string }[] = [
  { valor: 'Pix', label: 'Pix' },
  { valor: 'Dinheiro', label: 'Dinheiro' },
  { valor: 'Cartão', label: 'Cartão' },
  { valor: 'A receber', label: 'A receber' },
];

const ICONE_PAGAMENTO = { Pix: 'flash-outline', Dinheiro: 'cash-outline', 'Cartão': 'card-outline', 'A receber': 'time-outline' } as const;

export default function Vendas() {
  const { pedidos, carregando, carregar, atualizarPedido, excluirPedido } = useDados();
  const [filtro, setFiltro] = useState<Filtro>('todas');
  // Na web, "#vendas-nova" no endereço já abre a nova venda (usado na demonstração do portfólio)
  const [nova, setNova] = useState(() => Platform.OS === 'web' && window.location.hash === '#vendas-nova');

  const lista = pedidos.filter(p =>
    filtro === 'receber' ? !p.pago : filtro === 'hoje' ? p.data === hojeISO() : true);
  const total = lista.reduce((t, p) => t + p.total, 0);

  return (
    <View style={{ flex: 1 }}>
      <Cabecalho subtitulo={MARCA} titulo="Vendas" direita={<BotaoRedondo icone="add" onPress={() => setNova(true)} />} />

      <Tela carregando={carregando} onRefresh={carregar}>
        <Chips opcoes={FILTROS} valor={filtro} onChange={setFiltro} />
        <Text style={s.resumo}>{lista.length} {lista.length === 1 ? 'venda' : 'vendas'} · {brl(total)}</Text>

        <Card>
          {lista.length ? lista.map(p => (
            <Linha
              key={p.id}
              icone={ICONE_PAGAMENTO[p.pagamento as Pagamento] ?? 'cart-outline'}
              corIcone={p.pago ? C.pri : C.bad}
              fundoIcone={p.pago ? C.melClaro : C.badClaro}
              titulo={p.itens.length === 1 ? resumoItens(p) : `${p.unidades} pães de mel · ${p.itens.length} sabores`}
              sub={[p.itens.length > 1 ? resumoItens(p) : null, p.cliente, p.pagamento, dataBR(p.data)].filter(Boolean).join(' · ')}
              valor={brl(p.total)}
              selo={p.pago ? undefined : { texto: 'A receber', cor: C.bad, fundo: C.badClaro }}
              acoes={[
                ...(p.pago ? [] : [{
                  icone: 'checkmark-circle-outline' as const, cor: C.ok,
                  onPress: () => confirmar(`Marcar a venda${p.cliente ? ` de ${p.cliente}` : ''} como paga?`, 'Marcar pago', () => atualizarPedido(p.id, { pago: true })),
                }]),
                { icone: 'trash-outline' as const, cor: C.bad, onPress: () => confirmar('Excluir esta venda inteira?', 'Excluir', () => excluirPedido(p.id)) },
              ]}
            />
          )) : <Vazio icone="cart-outline" texto={filtro === 'receber' ? 'Ninguém te devendo. 🎉' : 'Nenhuma venda aqui ainda.\nToque no + para registrar.'} />}
        </Card>
      </Tela>

      <NovaVenda visivel={nova} onFechar={() => setNova(false)} />
    </View>
  );
}

type Item = { qtd: number; preco: string };

function NovaVenda({ visivel, onFechar }: { visivel: boolean; onFechar: () => void }) {
  const { produtos, estoque, criarPedido } = useDados();
  const ativos = produtos.filter(p => p.ativo);

  const [itens, setItens] = useState<Record<string, Item>>({});
  const [cliente, setCliente] = useState('');
  const [pagamento, setPagamento] = useState<Pagamento>('Pix');
  const [data, setData] = useState(hojeBR());
  const [salvando, setSalvando] = useState(false);

  const mudarQtd = (p: Produto, qtd: number) => setItens(atual => {
    const novo = { ...atual };
    if (qtd <= 0) delete novo[p.id];
    else novo[p.id] = { qtd, preco: atual[p.id]?.preco ?? formatarValor(p.preco) };
    return novo;
  });
  const mudarPreco = (id: string, preco: string) => setItens(atual => ({ ...atual, [id]: { ...atual[id], preco } }));

  const escolhidos = ativos.filter(p => itens[p.id]);
  const total = escolhidos.reduce((t, p) => t + itens[p.id].qtd * (num(itens[p.id].preco) || 0), 0);
  const unidades = escolhidos.reduce((t, p) => t + itens[p.id].qtd, 0);

  const limpar = () => { setItens({}); setCliente(''); setPagamento('Pix'); setData(hojeBR()); };

  const salvar = async () => {
    const iso = isoDeBR(data);
    if (!escolhidos.length) return aviso('Escolha pelo menos um sabor.');
    if (escolhidos.some(p => isNaN(num(itens[p.id].preco)))) return aviso('Confira o preço dos sabores.');
    const faltando = escolhidos.filter(p => itens[p.id].qtd > (estoque[p.id] ?? 0));
    if (faltando.length) {
      return aviso(`Sem estoque suficiente: ${faltando.map(p => `${p.nome} (tem ${Math.max(0, estoque[p.id] ?? 0)})`).join(', ')}.\nRegistre a produção na aba Produtos.`);
    }
    if (!iso) return aviso('Data inválida. Use dd/mm/aaaa.');
    if (pagamento === 'A receber' && !cliente.trim()) return aviso('Para venda a receber, informe o nome do cliente.');

    setSalvando(true);
    const ok = await criarPedido({
      itens: escolhidos.map(p => ({ produto_id: p.id, produto_nome: p.nome, quantidade: itens[p.id].qtd, preco_unit: num(itens[p.id].preco) })),
      cliente: cliente.trim() || null, pagamento, pago: pagamento !== 'A receber', data: iso,
    });
    setSalvando(false);
    if (ok) { limpar(); onFechar(); }
  };

  return (
    <Folha visivel={visivel} titulo="Nova venda" onFechar={onFechar}>
      <Text style={s.label}>Sabores e quantidades</Text>
      {ativos.length ? (
        <View style={s.lista}>
          {ativos.map((p, i) => (
            <ItemSabor
              key={p.id}
              produto={p}
              item={itens[p.id]}
              disponivel={estoque[p.id] ?? 0}
              ultimo={i === ativos.length - 1}
              onQtd={q => mudarQtd(p, q)}
              onPreco={v => mudarPreco(p.id, v)}
            />
          ))}
        </View>
      ) : <Text style={s.aviso}>Cadastre um produto primeiro, na aba Produtos.</Text>}

      <Chips label="Pagamento" opcoes={PAGAMENTOS} valor={pagamento} onChange={setPagamento} />
      <Campo label={pagamento === 'A receber' ? 'Cliente' : 'Cliente (opcional)'} value={cliente} onChangeText={setCliente} placeholder="Nome do cliente" />
      <CampoData valor={data} onChange={setData} />

      <TotalDestaque label={unidades ? `Total · ${unidades} ${unidades === 1 ? 'unidade' : 'unidades'}` : 'Total'} valor={brl(total)} />
      <Botao texto="Salvar venda" icone="checkmark" onPress={salvar} carregando={salvando} />
    </Folha>
  );
}

function ItemSabor({ produto, item, disponivel, ultimo, onQtd, onPreco }: {
  produto: Produto; item?: Item; disponivel: number; ultimo: boolean; onQtd: (q: number) => void; onPreco: (v: string) => void;
}) {
  const qtd = item?.qtd ?? 0;
  const ativo = qtd > 0;
  const semEstoque = disponivel <= 0 && !ativo;
  const noLimite = qtd >= disponivel;
  return (
    <View style={[s.item, ativo && s.itemOn, semEstoque && { opacity: 0.45 }, ultimo && { borderBottomWidth: 0 }]}>
      <View style={{ flex: 1 }}>
        <Text style={[s.itemNome, ativo && { color: C.pri }]}>{produto.nome}</Text>
        {ativo ? (
          <View style={s.precoLinha}>
            <Text style={s.itemSub}>R$</Text>
            <TextInput style={s.precoInput} value={item!.preco} onChangeText={t => onPreco(mascaraValor(t))} keyboardType="number-pad" />
            <Text style={s.itemSub}>cada</Text>
          </View>
        ) : (
          <Text style={s.itemSub}>{brl(produto.preco)} · {semEstoque ? 'sem estoque' : `${disponivel} em estoque`}</Text>
        )}
        {ativo && qtd > disponivel && <Text style={s.aviso}>Só tem {Math.max(0, disponivel)} em estoque</Text>}
        {ativo && qtd === disponivel && <Text style={s.limite}>Máximo do estoque</Text>}
      </View>
      <View style={s.passos}>
        {ativo && (
          <Pressable style={s.passoBtn} onPress={() => onQtd(qtd - 1)} hitSlop={6}>
            <Ionicons name={qtd === 1 ? 'trash-outline' : 'remove'} size={18} color={C.pri} />
          </Pressable>
        )}
        {ativo && <Text style={s.passoQtd}>{qtd}</Text>}
        <Pressable
          style={[s.passoBtn, !ativo && s.passoBtnAdd, noLimite && s.passoBtnOff]}
          onPress={() => onQtd(qtd + 1)}
          disabled={noLimite}
          hitSlop={6}
        >
          <Ionicons name="add" size={18} color={noLimite ? C.mut : ativo ? C.pri : '#fff'} />
        </Pressable>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  resumo: { color: C.mut, fontSize: 14, fontWeight: '600' },
  aviso: { color: C.bad, fontSize: 12, marginTop: 4 },
  label: { color: C.mut, fontSize: 13, fontWeight: '600', marginTop: 14, marginBottom: 6 },
  lista: { backgroundColor: C.card, borderRadius: 14, borderWidth: 1, borderColor: C.bd, overflow: 'hidden' },
  item: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F6EEE3' },
  itemOn: { backgroundColor: C.melClaro },
  itemNome: { color: C.txt, fontSize: 15, fontWeight: '700' },
  itemSub: { color: C.mut, fontSize: 13 },
  precoLinha: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  precoInput: {
    borderWidth: 1, borderColor: C.bd, borderRadius: 8, backgroundColor: '#fff', paddingHorizontal: 8, paddingVertical: 3,
    fontSize: 14, color: C.txt, minWidth: 70,
  },
  passos: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  passoBtn: { width: 34, height: 34, borderRadius: 17, borderWidth: 1.5, borderColor: C.pri, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  passoBtnAdd: { backgroundColor: C.pri },
  passoBtnOff: { backgroundColor: '#F1E9DF', borderColor: C.bd },
  limite: { color: C.mut, fontSize: 12, marginTop: 4 },
  passoQtd: { fontSize: 17, fontWeight: '800', color: C.txt, minWidth: 22, textAlign: 'center' },
});
