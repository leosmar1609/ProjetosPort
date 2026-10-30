import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  Barra, Botao, BotaoRedondo, Cabecalho, Campo, CampoData, CampoValor, Card, Chips, Folha, Linha, Linha2, Tela, Vazio, type Icone,
} from '../componentes/ui';
import { useDados } from '../dados';
import { aviso, confirmar } from '../lib/alertas';
import { brl, dataBR, hojeBR, inicioPeriodo, isoDeBR, num, PERIODOS, type Periodo } from '../lib/formato';
import { C, MARCA } from '../tema';

type Categoria = 'Ingredientes' | 'Embalagens' | 'Gás/Energia' | 'Outros';
const CATEGORIAS: { valor: Categoria; label: string }[] = [
  { valor: 'Ingredientes', label: 'Ingredientes' },
  { valor: 'Embalagens', label: 'Embalagens' },
  { valor: 'Gás/Energia', label: 'Gás/Energia' },
  { valor: 'Outros', label: 'Outros' },
];
const ICONE_CATEGORIA: Record<string, Icone> = {
  Ingredientes: 'nutrition-outline', Embalagens: 'gift-outline', 'Gás/Energia': 'flame-outline', Outros: 'pricetag-outline',
};

type Unidade = 'un' | 'kg' | 'g' | 'L' | 'ml' | 'pct';
const UNIDADES: { valor: Unidade; label: string }[] = (['un', 'kg', 'g', 'L', 'ml', 'pct'] as Unidade[]).map(u => ({ valor: u, label: u }));

export default function Compras() {
  const { compras, carregando, carregar, excluir } = useDados();
  const [periodo, setPeriodo] = useState<Periodo>('mes');
  const [nova, setNova] = useState(false);

  const { lista, total, porCategoria } = useMemo(() => {
    const ini = inicioPeriodo(periodo);
    const lista = compras.filter(c => c.data >= ini);
    const porCategoria: Record<string, number> = {};
    lista.forEach(c => { porCategoria[c.categoria] = (porCategoria[c.categoria] ?? 0) + c.valor; });
    return { lista, total: lista.reduce((t, c) => t + c.valor, 0), porCategoria: Object.entries(porCategoria).sort((a, b) => b[1] - a[1]) };
  }, [compras, periodo]);

  return (
    <View style={{ flex: 1 }}>
      <Cabecalho subtitulo={MARCA} titulo="Compras" direita={<BotaoRedondo icone="add" onPress={() => setNova(true)} />} />

      <Tela carregando={carregando} onRefresh={carregar}>
        <Chips opcoes={PERIODOS} valor={periodo} onChange={setPeriodo} />

        <Card titulo="Total gasto" direita={<Text style={s.total}>{brl(total)}</Text>}>
          {porCategoria.map(([cat, valor]) => (
            <View key={cat} style={{ paddingVertical: 6 }}>
              <View style={s.catTopo}>
                <Text style={s.catNome}>{cat}</Text>
                <Text style={s.catValor}>{brl(valor)}</Text>
              </View>
              <Barra fracao={valor / (total || 1)} />
            </View>
          ))}
        </Card>

        <Card titulo="Compras">
          {lista.length ? lista.map(c => (
            <Linha
              key={c.id}
              icone={ICONE_CATEGORIA[c.categoria] ?? 'pricetag-outline'}
              titulo={c.item}
              sub={[c.quantidade != null ? `${String(c.quantidade).replace('.', ',')} ${c.unidade ?? ''}`.trim() : null, dataBR(c.data)].filter(Boolean).join(' · ')}
              valor={brl(c.valor)}
              acoes={[{ icone: 'trash-outline', cor: C.bad, onPress: () => confirmar(`Excluir a compra "${c.item}"?`, 'Excluir', () => excluir('compras', c.id)) }]}
            />
          )) : <Vazio icone="basket-outline" texto={'Nenhuma compra nesse período.\nToque no + para registrar.'} />}
        </Card>
      </Tela>

      <NovaCompra visivel={nova} onFechar={() => setNova(false)} />
    </View>
  );
}

function NovaCompra({ visivel, onFechar }: { visivel: boolean; onFechar: () => void }) {
  const { compras, inserir } = useDados();
  const [item, setItem] = useState('');
  const [qtd, setQtd] = useState('');
  const [unidade, setUnidade] = useState<Unidade>('kg');
  const [valor, setValor] = useState('');
  const [categoria, setCategoria] = useState<Categoria>('Ingredientes');
  const [data, setData] = useState(hojeBR());
  const [salvando, setSalvando] = useState(false);

  // Sugestões com os itens que já foram comprados antes
  const sugestoes = useMemo(() => {
    const t = item.trim().toLowerCase();
    const nomes = [...new Set(compras.map(c => c.item))];
    return t ? nomes.filter(n => n.toLowerCase().includes(t) && n.toLowerCase() !== t).slice(0, 4) : [];
  }, [compras, item]);

  const usarSugestao = (nome: string) => {
    setItem(nome);
    const ultima = compras.find(c => c.item === nome);
    if (ultima) {
      setCategoria(ultima.categoria as Categoria);
      if (ultima.unidade) setUnidade(ultima.unidade as Unidade);
    }
  };

  const salvar = async () => {
    const v = num(valor);
    const q = qtd.trim() ? num(qtd) : null;
    const iso = isoDeBR(data);
    if (!item.trim()) return aviso('Informe o item comprado.');
    if (isNaN(v) || v < 0) return aviso('Informe o valor pago.');
    if (q !== null && isNaN(q)) return aviso('Quantidade inválida.');
    if (!iso) return aviso('Data inválida. Use dd/mm/aaaa.');

    setSalvando(true);
    const ok = await inserir('compras', { item: item.trim(), quantidade: q, unidade: q !== null ? unidade : null, valor: v, categoria, data: iso });
    setSalvando(false);
    if (ok) {
      setItem(''); setQtd(''); setValor('');
      onFechar();
    }
  };

  return (
    <Folha visivel={visivel} titulo="Nova compra" onFechar={onFechar}>
      <Campo label="Item" value={item} onChangeText={setItem} placeholder="Ex: Chocolate meio amargo" />
      {sugestoes.length > 0 && (
        <Chips opcoes={sugestoes.map(n => ({ valor: n, label: n }))} valor="" onChange={usarSugestao} />
      )}
      <Linha2>
        <Campo label="Quantidade" value={qtd} onChangeText={setQtd} keyboardType="decimal-pad" placeholder="Ex: 2" />
        <CampoValor label="Valor pago" valor={valor} onChange={setValor} />
      </Linha2>
      <Chips label="Unidade" opcoes={UNIDADES} valor={unidade} onChange={setUnidade} />
      <Chips label="Categoria" opcoes={CATEGORIAS} valor={categoria} onChange={setCategoria} />
      <CampoData valor={data} onChange={setData} />
      <Botao texto="Salvar compra" icone="checkmark" onPress={salvar} carregando={salvando} />
    </Folha>
  );
}

const s = StyleSheet.create({
  total: { color: C.pri, fontSize: 20, fontWeight: '800' },
  catTopo: { flexDirection: 'row', justifyContent: 'space-between' },
  catNome: { color: C.txt, fontSize: 14 },
  catValor: { color: C.mut, fontSize: 14 },
});
