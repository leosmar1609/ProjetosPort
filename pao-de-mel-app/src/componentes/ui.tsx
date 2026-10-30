import { Children, useEffect, useRef, useState, type ComponentRef, type ReactNode, type RefObject } from 'react';
import {
  ActivityIndicator, Keyboard, Modal, Platform, Pressable, RefreshControl, ScrollView,
  StyleSheet, Text, TextInput, View, type StyleProp, type TextInputProps, type ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C } from '../tema';
import { brl, dataBR, diasAtrasISO, hojeBR } from '../lib/formato';

export type Icone = keyof typeof Ionicons.glyphMap;
export type Elemento = ComponentRef<typeof View>;

export function Cabecalho({ titulo, subtitulo, direita, children }: {
  titulo: string; subtitulo?: string; direita?: ReactNode; children?: ReactNode;
}) {
  const ins = useSafeAreaInsets();
  return (
    <LinearGradient colors={[C.pri, C.priEsc]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[s.cab, { paddingTop: ins.top + 14 }]}>
      <View style={s.cabLinha}>
        <View style={{ flex: 1 }}>
          {!!subtitulo && <Text style={s.cabSub}>{subtitulo}</Text>}
          <Text style={s.cabTitulo}>{titulo}</Text>
        </View>
        {direita}
      </View>
      {children}
    </LinearGradient>
  );
}

export function BotaoRedondo({ icone, onPress }: { icone: Icone; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [s.redondo, pressed && { opacity: 0.6 }]} hitSlop={6}>
      <Ionicons name={icone} size={22} color="#fff" />
    </Pressable>
  );
}

export function Tela({ children, carregando, onRefresh }: { children: ReactNode; carregando?: boolean; onRefresh?: () => void }) {
  return (
    <ScrollView
      contentContainerStyle={s.tela}
      keyboardShouldPersistTaps="handled"
      refreshControl={onRefresh ? <RefreshControl refreshing={!!carregando} onRefresh={onRefresh} tintColor={C.pri} colors={[C.pri]} /> : undefined}
    >
      {children}
    </ScrollView>
  );
}

export function Card({ titulo, direita, children, style }: { titulo?: string; direita?: ReactNode; children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[s.card, style]}>
      {(!!titulo || direita) && (
        <View style={s.cardTopo}>
          <Text style={s.cardTitulo}>{titulo}</Text>
          {direita}
        </View>
      )}
      {children}
    </View>
  );
}

export function Botao({ texto, icone, onPress, variante = 'pri', carregando }: {
  texto: string; icone?: Icone; onPress: () => void; variante?: 'pri' | 'sec'; carregando?: boolean;
}) {
  const cor = variante === 'pri' ? '#fff' : C.pri;
  return (
    <Pressable
      onPress={onPress}
      disabled={carregando}
      style={({ pressed }) => [s.botao, variante === 'sec' && s.botaoSec, (pressed || carregando) && { opacity: 0.7 }]}
    >
      {carregando ? <ActivityIndicator color={cor} /> : (
        <>
          {icone && <Ionicons name={icone} size={20} color={cor} />}
          <Text style={[s.botaoTxt, { color: cor }]}>{texto}</Text>
        </>
      )}
    </Pressable>
  );
}

export function Campo({ label, ...props }: { label: string } & TextInputProps) {
  return (
    <View>
      <Text style={s.label}>{label}</Text>
      <TextInput style={s.input} placeholderTextColor="#B9A797" {...props} />
    </View>
  );
}

// Valor em reais no formato "1.234,50" (sem o "R$ ")
export const formatarValor = (n: number) => brl(n).replace('R$ ', '');

// Transforma o que foi digitado em valor com vírgula: "125" -> "1,25"
export function mascaraValor(t: string) {
  const digitos = t.replace(/\D/g, '').replace(/^0+/, '').slice(0, 9);
  return digitos ? formatarValor(parseInt(digitos, 10) / 100) : '';
}

// Campo de dinheiro: digita só números e a vírgula aparece sozinha (125 -> 1,25)
export function CampoValor({ label, valor, onChange }: { label: string; valor: string; onChange: (v: string) => void }) {
  return (
    <View>
      <Text style={s.label}>{label}</Text>
      <View style={s.valorCaixa}>
        <Text style={s.valorPrefixo}>R$</Text>
        <TextInput
          style={s.valorInput}
          value={valor}
          keyboardType="number-pad"
          placeholder="0,00"
          placeholderTextColor="#B9A797"
          onChangeText={t => onChange(mascaraValor(t))}
        />
      </View>
    </View>
  );
}

// Gráfico de colunas simples; toque numa coluna para ver o valor
export function Colunas({ dados, formato }: { dados: { label: string; valor: number }[]; formato: (n: number) => string }) {
  const [sel, setSel] = useState<number | null>(null);
  const max = Math.max(0, ...dados.map(d => d.valor));
  const foco = sel ?? (max > 0 ? dados.findIndex(d => d.valor === max) : null);
  return (
    <View>
      <Text style={s.colInfo}>
        {foco != null ? `${dados[foco].label}: ${formato(dados[foco].valor)}${sel == null ? ' (maior)' : ''}` : 'Sem vendas no período'}
      </Text>
      <View style={s.colArea}>
        {dados.map((d, i) => (
          <Pressable key={i} style={s.colItem} onPress={() => setSel(i === sel ? null : i)} hitSlop={4}>
            <View style={s.colTrilho}>
              {d.valor > 0 && (
                <View style={[s.col, { height: `${Math.max(3, (d.valor / max) * 100)}%`, backgroundColor: i === foco ? C.pri : C.mel }]} />
              )}
            </View>
            <Text style={[s.colLabel, i === foco && { color: C.txt, fontWeight: '700' }]}>{d.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

// Coloca campos lado a lado, dividindo a largura igualmente
export function Linha2({ children }: { children: ReactNode }) {
  return <View style={s.linha2}>{Children.map(children, c => <View style={{ flex: 1 }}>{c}</View>)}</View>;
}

export function Chips<T extends string>({ opcoes, valor, onChange, label }: {
  opcoes: { valor: T; label: string }[]; valor: T; onChange: (v: T) => void; label?: string;
}) {
  return (
    <View>
      {!!label && <Text style={s.label}>{label}</Text>}
      <View style={s.chips}>
        {opcoes.map(o => {
          const on = o.valor === valor;
          return (
            <Pressable key={o.valor} onPress={() => onChange(o.valor)} style={[s.chip, on && s.chipOn]}>
              <Text style={[s.chipTxt, on && s.chipTxtOn]}>{o.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function Stat({ titulo, valor, icone, cor = C.pri, fundo = C.melClaro }: {
  titulo: string; valor: string; icone: Icone; cor?: string; fundo?: string;
}) {
  return (
    <View style={s.stat}>
      <View style={[s.statIcone, { backgroundColor: fundo }]}><Ionicons name={icone} size={18} color={cor} /></View>
      <Text style={s.statTitulo}>{titulo}</Text>
      <Text style={[s.statValor, { color: cor === C.pri ? C.txt : cor }]} numberOfLines={1} adjustsFontSizeToFit>{valor}</Text>
    </View>
  );
}

export function Grade({ children }: { children: ReactNode }) {
  return <View style={s.grade}>{children}</View>;
}

export function Selo({ texto, cor, fundo }: { texto: string; cor: string; fundo: string }) {
  return <View style={[s.selo, { backgroundColor: fundo }]}><Text style={[s.seloTxt, { color: cor }]}>{texto}</Text></View>;
}

type Acao = { icone: Icone; cor: string; onPress: () => void };

export function Linha({ icone, corIcone = C.pri, fundoIcone = C.melClaro, titulo, sub, valor, selo, acoes }: {
  icone?: Icone; corIcone?: string; fundoIcone?: string; titulo: string; sub?: string; valor?: string;
  selo?: { texto: string; cor: string; fundo: string }; acoes?: Acao[];
}) {
  return (
    <View style={s.linha}>
      {icone && <View style={[s.linhaIcone, { backgroundColor: fundoIcone }]}><Ionicons name={icone} size={18} color={corIcone} /></View>}
      <View style={{ flex: 1 }}>
        <Text style={s.linhaTitulo} numberOfLines={1}>{titulo}</Text>
        {!!sub && <Text style={s.linhaSub} numberOfLines={1}>{sub}</Text>}
      </View>
      <View style={{ alignItems: 'flex-end', gap: 4 }}>
        {!!valor && <Text style={s.linhaValor}>{valor}</Text>}
        {selo && <Selo {...selo} />}
      </View>
      {acoes?.map((a, i) => (
        <Pressable key={i} onPress={a.onPress} hitSlop={8} style={({ pressed }) => [s.acao, pressed && { opacity: 0.5 }]}>
          <Ionicons name={a.icone} size={21} color={a.cor} />
        </Pressable>
      ))}
    </View>
  );
}

export function Vazio({ icone, texto }: { icone: Icone; texto: string }) {
  return (
    <View style={s.vazio}>
      <Ionicons name={icone} size={34} color="#D8C6B3" />
      <Text style={s.vazioTxt}>{texto}</Text>
    </View>
  );
}

export function Barra({ fracao }: { fracao: number }) {
  return (
    <View style={s.barraFundo}>
      <View style={[s.barra, { width: `${Math.max(4, Math.min(100, fracao * 100))}%` }]} />
    </View>
  );
}

// Quando o teclado abre, devolve quanto da área (ref) ficou coberta por ele.
// Mede de verdade em vez de chutar, então funciona mesmo se o sistema já tiver redimensionado a tela.
export function useEspacoTeclado(ref: RefObject<Elemento | null>, aoAbrir?: () => void) {
  const [espaco, setEspaco] = useState(0);
  const aoAbrirRef = useRef(aoAbrir);
  aoAbrirRef.current = aoAbrir;

  useEffect(() => {
    const ios = Platform.OS === 'ios';
    const abrir = Keyboard.addListener(ios ? 'keyboardWillShow' : 'keyboardDidShow', e => {
      ref.current?.measureInWindow((_x, y, _l, altura) => {
        setEspaco(Math.max(0, y + altura - e.endCoordinates.screenY));
        setTimeout(() => aoAbrirRef.current?.(), 150);
      });
    });
    const fechar = Keyboard.addListener(ios ? 'keyboardWillHide' : 'keyboardDidHide', () => setEspaco(0));
    return () => { abrir.remove(); fechar.remove(); };
  }, [ref]);

  return espaco;
}

export function Folha({ visivel, titulo, onFechar, children }: { visivel: boolean; titulo: string; onFechar: () => void; children: ReactNode }) {
  const ins = useSafeAreaInsets();
  const folhaRef = useRef<Elemento>(null);
  const rolagemRef = useRef<ComponentRef<typeof ScrollView>>(null);
  const conteudoRef = useRef<Elemento>(null);

  // Rola até o campo que está sendo editado, para ele ficar acima do teclado
  const rolarAteCampo = () => {
    const campo = TextInput.State.currentlyFocusedInput();
    if (!campo || !conteudoRef.current) return;
    campo.measureLayout(conteudoRef.current, (_x, y) => rolagemRef.current?.scrollTo({ y: Math.max(0, y - 90), animated: true }), () => {});
  };
  const teclado = useEspacoTeclado(folhaRef, rolarAteCampo);

  return (
    <Modal visible={visivel} animationType="slide" transparent onRequestClose={onFechar}>
      <View style={s.folhaFundo}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onFechar} />
        <View ref={folhaRef} style={[s.folha, { paddingBottom: Math.max(ins.bottom, teclado) + 16 }]}>
          <View style={s.folhaPuxador} />
          <View style={s.folhaTopo}>
            <Text style={s.folhaTitulo}>{titulo}</Text>
            <Pressable onPress={onFechar} hitSlop={10}><Ionicons name="close" size={26} color={C.mut} /></Pressable>
          </View>
          <ScrollView ref={rolagemRef} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 8 }}>
            <View ref={conteudoRef}>{children}</View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

export function Contador({ label, valor, onChange, passo = 1 }: { label: string; valor: number; onChange: (n: number) => void; passo?: number }) {
  return (
    <View>
      <Text style={s.label}>{label}</Text>
      <View style={s.contador}>
        <Pressable style={s.contadorBtn} onPress={() => onChange(Math.max(1, valor - passo))}><Ionicons name="remove" size={22} color={C.pri} /></Pressable>
        <TextInput
          style={s.contadorTxt}
          value={String(valor)}
          keyboardType="number-pad"
          onChangeText={t => onChange(Math.max(1, parseInt(t.replace(/\D/g, '')) || 1))}
        />
        <Pressable style={s.contadorBtn} onPress={() => onChange(valor + passo)}><Ionicons name="add" size={22} color={C.pri} /></Pressable>
      </View>
    </View>
  );
}

export function CampoData({ valor, onChange }: { valor: string; onChange: (v: string) => void }) {
  const ontem = dataBR(diasAtrasISO(1));
  return (
    <View>
      <Campo label="Data" value={valor} onChangeText={onChange} placeholder="dd/mm/aaaa" keyboardType="numbers-and-punctuation" />
      <View style={[s.chips, { marginTop: 8 }]}>
        {[['Hoje', hojeBR()], ['Ontem', ontem]].map(([l, d]) => (
          <Pressable key={l} onPress={() => onChange(d)} style={[s.chip, s.chipPeq, valor === d && s.chipOn]}>
            <Text style={[s.chipTxt, valor === d && s.chipTxtOn]}>{l}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export function TotalDestaque({ label, valor }: { label: string; valor: string }) {
  return (
    <View style={s.total}>
      <Text style={s.totalLabel}>{label}</Text>
      <Text style={s.totalValor}>{valor}</Text>
    </View>
  );
}

const sombra = Platform.select<ViewStyle>({
  web: { boxShadow: '0 2px 10px rgba(80, 45, 20, 0.06)' } as ViewStyle,
  default: { shadowColor: '#5A2D14', shadowOpacity: 0.06, shadowRadius: 10, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
});

const s = StyleSheet.create({
  cab: { paddingHorizontal: 20, paddingBottom: 22, borderBottomLeftRadius: 26, borderBottomRightRadius: 26 },
  cabLinha: { flexDirection: 'row', alignItems: 'center', gap: 12, width: '100%', maxWidth: 720, alignSelf: 'center' },
  cabSub: { color: '#F3D9B5', fontSize: 14, marginBottom: 2 },
  cabTitulo: { color: '#fff', fontSize: 24, fontWeight: '800' },
  redondo: { width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center' },
  tela: { padding: 16, paddingBottom: 32, width: '100%', maxWidth: 720, alignSelf: 'center', gap: 14 },
  card: { backgroundColor: C.card, borderRadius: 18, padding: 16, ...sombra },
  cardTopo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  cardTitulo: { fontSize: 16, fontWeight: '700', color: C.txt },
  botao: { flexDirection: 'row', gap: 8, backgroundColor: C.pri, borderRadius: 14, paddingVertical: 15, marginTop: 18, alignItems: 'center', justifyContent: 'center' },
  botaoSec: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: C.pri },
  botaoTxt: { fontSize: 16, fontWeight: '700' },
  label: { color: C.mut, fontSize: 13, fontWeight: '600', marginTop: 14, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: C.bd, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, color: C.txt, backgroundColor: '#FFFCF8' },
  linha2: { flexDirection: 'row', gap: 12 },
  valorCaixa: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: C.bd, borderRadius: 12, backgroundColor: '#FFFCF8', paddingLeft: 14 },
  valorPrefixo: { color: C.mut, fontSize: 16, fontWeight: '600', marginRight: 6 },
  valorInput: { flex: 1, paddingVertical: 12, paddingRight: 14, fontSize: 16, color: C.txt, minWidth: 0 },
  colInfo: { color: C.mut, fontSize: 13, marginBottom: 10 },
  colArea: { flexDirection: 'row', gap: 4, borderBottomWidth: 1, borderBottomColor: C.bd },
  colItem: { flex: 1, alignItems: 'center' },
  colTrilho: { height: 120, width: '100%', justifyContent: 'flex-end', alignItems: 'center' },
  col: { width: '70%', maxWidth: 28, borderTopLeftRadius: 4, borderTopRightRadius: 4 },
  colLabel: { color: C.mut, fontSize: 10, marginTop: 4, marginBottom: 2 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1, borderColor: C.bd, backgroundColor: C.card, borderRadius: 20, paddingVertical: 8, paddingHorizontal: 14 },
  chipPeq: { paddingVertical: 5, paddingHorizontal: 12 },
  chipOn: { backgroundColor: C.pri, borderColor: C.pri },
  chipTxt: { color: C.txt, fontSize: 14 },
  chipTxtOn: { color: '#fff', fontWeight: '700' },
  grade: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  stat: { flexBasis: '45%', flexGrow: 1, backgroundColor: C.card, borderRadius: 18, padding: 14, ...sombra },
  statIcone: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  statTitulo: { color: C.mut, fontSize: 13 },
  statValor: { fontSize: 20, fontWeight: '800', marginTop: 2 },
  selo: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 },
  seloTxt: { fontSize: 11, fontWeight: '700' },
  linha: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: '#F6EEE3' },
  linhaIcone: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  linhaTitulo: { color: C.txt, fontSize: 15, fontWeight: '600' },
  linhaSub: { color: C.mut, fontSize: 13, marginTop: 2 },
  linhaValor: { color: C.txt, fontSize: 15, fontWeight: '700' },
  acao: { padding: 4 },
  vazio: { alignItems: 'center', paddingVertical: 24, gap: 8 },
  vazioTxt: { color: C.mut, fontSize: 14, textAlign: 'center' },
  barraFundo: { height: 8, backgroundColor: '#F6EEE3', borderRadius: 4, overflow: 'hidden', marginTop: 6 },
  barra: { height: 8, backgroundColor: C.mel, borderRadius: 4 },
  folhaFundo: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(30,15,5,0.45)' },
  folha: { backgroundColor: C.bg, borderTopLeftRadius: 26, borderTopRightRadius: 26, paddingHorizontal: 20, paddingTop: 10, maxHeight: '92%', width: '100%', maxWidth: 640, alignSelf: 'center' },
  folhaPuxador: { width: 40, height: 5, borderRadius: 3, backgroundColor: C.bd, alignSelf: 'center', marginBottom: 10 },
  folhaTopo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  folhaTitulo: { fontSize: 20, fontWeight: '800', color: C.txt },
  contador: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: C.bd, borderRadius: 12, backgroundColor: '#FFFCF8' },
  contadorBtn: { paddingHorizontal: 14, paddingVertical: 11 },
  contadorTxt: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '700', color: C.txt, paddingVertical: 8, minWidth: 30 },
  total: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: C.melClaro, borderRadius: 14, padding: 14, marginTop: 18 },
  totalLabel: { color: C.pri, fontSize: 15, fontWeight: '600' },
  totalValor: { color: C.pri, fontSize: 22, fontWeight: '800' },
});
