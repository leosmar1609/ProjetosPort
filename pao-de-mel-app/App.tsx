import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Icone } from './src/componentes/ui';
import { DadosProvider } from './src/dados';
import { API_URL, carregarToken, MODO_DEMO, quandoExpirar, sair } from './src/lib/api';
import { C } from './src/tema';
import Analises from './src/telas/Analises';
import Compras from './src/telas/Compras';
import Inicio from './src/telas/Inicio';
import Login from './src/telas/Login';
import Produtos from './src/telas/Produtos';
import Vendas from './src/telas/Vendas';

type Fase = 'carregando' | 'login' | 'app';
type Aba = 'inicio' | 'vendas' | 'compras' | 'produtos' | 'analises';

const ABAS: { id: Aba; label: string; icone: Icone; iconeOn: Icone }[] = [
  { id: 'inicio', label: 'Início', icone: 'home-outline', iconeOn: 'home' },
  { id: 'vendas', label: 'Vendas', icone: 'cart-outline', iconeOn: 'cart' },
  { id: 'compras', label: 'Compras', icone: 'basket-outline', iconeOn: 'basket' },
  { id: 'produtos', label: 'Produtos', icone: 'cube-outline', iconeOn: 'cube' },
  { id: 'analises', label: 'Análises', icone: 'analytics-outline', iconeOn: 'analytics' },
];

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <Raiz />
    </SafeAreaProvider>
  );
}

function Raiz() {
  const [fase, setFase] = useState<Fase>('carregando');

  useEffect(() => {
    quandoExpirar(() => setFase('login'));
    carregarToken().then(t => setFase(t ? 'app' : 'login'));
  }, []);

  if (!API_URL && !MODO_DEMO) {
    return (
      <View style={s.centro}>
        <Ionicons name="settings-outline" size={40} color={C.pri} />
        <Text style={s.configTxt}>Configure o EXPO_PUBLIC_API_URL no arquivo .env e reinicie o app.</Text>
      </View>
    );
  }
  if (fase === 'carregando') return <View style={s.centro}><ActivityIndicator size="large" color={C.pri} /></View>;
  if (fase === 'login') return <Login onEntrar={() => setFase('app')} />;

  return (
    <DadosProvider onSair={() => sair().then(() => setFase('login'))}>
      <Principal />
    </DadosProvider>
  );
}

// Na web, dá para abrir direto numa aba pelo endereço (ex.: ...#analises ou ...#vendas-nova)
function abaInicial(): Aba {
  const hash = Platform.OS === 'web' ? window.location.hash.slice(1).split('-')[0] : '';
  return ABAS.some(a => a.id === hash) ? (hash as Aba) : 'inicio';
}

function Principal() {
  const [aba, setAba] = useState<Aba>(abaInicial);
  const ins = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <View style={{ flex: 1 }}>
        {aba === 'inicio' && <Inicio />}
        {aba === 'vendas' && <Vendas />}
        {aba === 'compras' && <Compras />}
        {aba === 'produtos' && <Produtos />}
        {aba === 'analises' && <Analises />}
      </View>

      <View style={[s.nav, { paddingBottom: ins.bottom + 6 }]}>
        {ABAS.map(a => {
          const on = aba === a.id;
          return (
            <Pressable key={a.id} style={s.navBtn} onPress={() => setAba(a.id)}>
              <View style={[s.navPilula, on && s.navPilulaOn]}>
                <Ionicons name={on ? a.iconeOn : a.icone} size={22} color={on ? C.pri : C.mut} />
              </View>
              <Text style={[s.navTxt, on && s.navTxtOn]}>{a.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.bg, padding: 32, gap: 12 },
  configTxt: { color: C.txt, fontSize: 16, textAlign: 'center' },
  nav: { flexDirection: 'row', backgroundColor: C.card, borderTopWidth: 1, borderTopColor: C.bd, paddingTop: 8 },
  navBtn: { flex: 1, alignItems: 'center', gap: 2 },
  navPilula: { paddingHorizontal: 14, paddingVertical: 4, borderRadius: 16 },
  navPilulaOn: { backgroundColor: C.melClaro },
  navTxt: { color: C.mut, fontSize: 11 },
  navTxtOn: { color: C.pri, fontWeight: '700' },
});
