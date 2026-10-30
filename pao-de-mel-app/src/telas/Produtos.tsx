import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  Botao, BotaoRedondo, Cabecalho, Campo, CampoData, CampoValor, Card, Chips, Contador, Folha, formatarValor, Linha, Selo, Tela, Vazio,
} from '../componentes/ui';
import { useDados, type Produto } from '../dados';
import { aviso, confirmar } from '../lib/alertas';
import { brl, dataBR, hojeBR, isoDeBR, num } from '../lib/formato';
import { C, MARCA } from '../tema';

export default function Produtos() {
  const { produtos, producoes, estoque, carregando, carregar, excluir } = useDados();
  const [editando, setEditando] = useState<Produto | 'novo' | null>(null);
  const [produzindo, setProduzindo] = useState<Produto | null>(null);

  const nomeDe = (id: string) => produtos.find(p => p.id === id)?.nome ?? 'Produto excluído';
  const ordenados = [...produtos].sort((a, b) => Number(b.ativo) - Number(a.ativo));

  return (
    <View style={{ flex: 1 }}>
      <Cabecalho subtitulo={MARCA} titulo="Produtos" direita={<BotaoRedondo icone="add" onPress={() => setEditando('novo')} />} />

      <Tela carregando={carregando} onRefresh={carregar}>
        {ordenados.length ? ordenados.map(p => {
          const qtd = estoque[p.id] ?? 0;
          const selo = qtd <= 0 ? { texto: 'Sem estoque', cor: C.bad, fundo: C.badClaro }
            : qtd <= 5 ? { texto: `${qtd} un · baixo`, cor: '#B7791F', fundo: '#FEF3C7' }
            : { texto: `${qtd} un`, cor: C.ok, fundo: C.okClaro };
          return (
            <Card key={p.id} style={!p.ativo && { opacity: 0.55 }}>
              <View style={s.prodTopo}>
                <View style={s.prodIcone}><Text style={{ fontSize: 26 }}>🍫</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={s.prodNome}>{p.nome}{!p.ativo && ' (inativo)'}</Text>
                  <Text style={s.prodPreco}>{brl(p.preco)}</Text>
                </View>
                <Selo {...selo} />
              </View>
              <View style={s.acoes}>
                <Acao icone="add-circle-outline" texto="Produzir" onPress={() => setProduzindo(p)} />
                <Acao icone="create-outline" texto="Editar" onPress={() => setEditando(p)} />
                <Acao icone="trash-outline" texto="Excluir" cor={C.bad}
                  onPress={() => confirmar(`Excluir "${p.nome}"? O histórico de produção dele também será apagado.`, 'Excluir', () => excluir('produtos', p.id))} />
              </View>
            </Card>
          );
        }) : (
          <Card><Vazio icone="cube-outline" texto={'Nenhum produto cadastrado.\nToque no + para adicionar seus sabores.'} /></Card>
        )}

        <Card titulo="Produção recente">
          {producoes.length ? producoes.slice(0, 15).map(pr => (
            <Linha key={pr.id} icone="flame-outline" titulo={`${pr.quantidade}x ${nomeDe(pr.produto_id)}`} sub={dataBR(pr.data)}
              acoes={[{ icone: 'trash-outline', cor: C.bad, onPress: () => confirmar('Excluir este registro de produção?', 'Excluir', () => excluir('producoes', pr.id)) }]} />
          )) : <Vazio icone="flame-outline" texto="Registre a produção para controlar o estoque." />}
        </Card>
      </Tela>

      <FormProduto produto={editando} onFechar={() => setEditando(null)} />
      <FormProducao produto={produzindo} onFechar={() => setProduzindo(null)} />
    </View>
  );
}

function Acao({ icone, texto, onPress, cor = C.pri }: { icone: 'add-circle-outline' | 'create-outline' | 'trash-outline'; texto: string; onPress: () => void; cor?: string }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [s.acao, pressed && { opacity: 0.5 }]}>
      <Ionicons name={icone} size={18} color={cor} />
      <Text style={[s.acaoTxt, { color: cor }]}>{texto}</Text>
    </Pressable>
  );
}

function FormProduto({ produto, onFechar }: { produto: Produto | 'novo' | null; onFechar: () => void }) {
  const { inserir, atualizar } = useDados();
  const [nome, setNome] = useState('');
  const [preco, setPreco] = useState('');
  const [ativo, setAtivo] = useState<'sim' | 'nao'>('sim');
  const [salvando, setSalvando] = useState(false);
  const existente = produto && produto !== 'novo' ? produto : null;

  useEffect(() => {
    setNome(existente?.nome ?? '');
    setPreco(existente ? formatarValor(existente.preco) : '');
    setAtivo(existente && !existente.ativo ? 'nao' : 'sim');
  }, [produto]);

  const salvar = async () => {
    const p = num(preco);
    if (!nome.trim()) return aviso('Informe o nome do sabor.');
    if (isNaN(p) || p < 0) return aviso('Informe o preço de venda.');
    setSalvando(true);
    const dados = { nome: nome.trim(), preco: p, ativo: ativo === 'sim' };
    const ok = existente ? await atualizar('produtos', existente.id, dados) : await inserir('produtos', dados);
    setSalvando(false);
    if (ok) onFechar();
  };

  return (
    <Folha visivel={!!produto} titulo={existente ? 'Editar produto' : 'Novo produto'} onFechar={onFechar}>
      <Campo label="Nome do sabor" value={nome} onChangeText={setNome} placeholder="Ex: Doce de leite" />
      <CampoValor label="Preço de venda" valor={preco} onChange={setPreco} />
      {existente && (
        <Chips label="Situação" opcoes={[{ valor: 'sim', label: 'Ativo' }, { valor: 'nao', label: 'Inativo' }]} valor={ativo} onChange={setAtivo} />
      )}
      <Botao texto="Salvar" icone="checkmark" onPress={salvar} carregando={salvando} />
    </Folha>
  );
}

function FormProducao({ produto, onFechar }: { produto: Produto | null; onFechar: () => void }) {
  const { inserir } = useDados();
  const [qtd, setQtd] = useState(10);
  const [data, setData] = useState(hojeBR());
  const [salvando, setSalvando] = useState(false);

  const salvar = async () => {
    const iso = isoDeBR(data);
    if (!produto) return;
    if (!iso) return aviso('Data inválida. Use dd/mm/aaaa.');
    setSalvando(true);
    const ok = await inserir('producoes', { produto_id: produto.id, quantidade: qtd, data: iso });
    setSalvando(false);
    if (ok) { setQtd(10); onFechar(); }
  };

  return (
    <Folha visivel={!!produto} titulo={`Produção · ${produto?.nome ?? ''}`} onFechar={onFechar}>
      <Text style={s.dica}>Quantos pães de mel desse sabor ficaram prontos? Isso entra no estoque.</Text>
      <Contador label="Quantidade produzida" valor={qtd} onChange={setQtd} passo={5} />
      <CampoData valor={data} onChange={setData} />
      <Botao texto="Adicionar ao estoque" icone="checkmark" onPress={salvar} carregando={salvando} />
    </Folha>
  );
}

const s = StyleSheet.create({
  prodTopo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  prodIcone: { width: 50, height: 50, borderRadius: 16, backgroundColor: C.melClaro, alignItems: 'center', justifyContent: 'center' },
  prodNome: { color: C.txt, fontSize: 17, fontWeight: '700' },
  prodPreco: { color: C.mut, fontSize: 14, marginTop: 2 },
  acoes: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#F6EEE3', marginTop: 14, paddingTop: 10 },
  acao: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 4 },
  acaoTxt: { fontSize: 14, fontWeight: '600' },
  dica: { color: C.mut, fontSize: 14, marginTop: 6 },
});
