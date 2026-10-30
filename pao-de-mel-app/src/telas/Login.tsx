import { useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Botao, Campo, useEspacoTeclado, type Elemento } from '../componentes/ui';
import { entrar } from '../lib/api';
import { C, MARCA } from '../tema';

export default function Login({ onEntrar }: { onEntrar: () => void }) {
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);
  const telaRef = useRef<Elemento>(null);
  const teclado = useEspacoTeclado(telaRef);

  const enviar = async () => {
    setErro('');
    setCarregando(true);
    try {
      await entrar(usuario.trim(), senha);
      onEntrar();
    } catch (e) {
      setErro((e as Error).message);
      setCarregando(false);
    }
  };

  return (
    <LinearGradient colors={[C.pri, C.priEsc]} style={{ flex: 1 }}>
      <View ref={telaRef} style={{ flex: 1, paddingBottom: teclado }}>
        <ScrollView contentContainerStyle={s.centro} keyboardShouldPersistTaps="handled">
          <View style={s.logo}><Text style={{ fontSize: 46 }}>🍯</Text></View>
          <Text style={s.marca}>{MARCA}</Text>
          <Text style={s.slogan}>Pão de mel feito com carinho</Text>

          <View style={s.card}>
            <Campo label="Usuário" value={usuario} onChangeText={setUsuario} autoCapitalize="none" autoCorrect={false} />
            <Campo label="Senha" value={senha} onChangeText={setSenha} secureTextEntry onSubmitEditing={enviar} />
            {!!erro && <Text style={s.erro}>{erro}</Text>}
            <Botao texto="Entrar" icone="log-in-outline" onPress={enviar} carregando={carregando} />
          </View>
        </ScrollView>
      </View>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  centro: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  logo: { width: 96, height: 96, borderRadius: 48, backgroundColor: C.melClaro, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  marca: { color: '#fff', fontSize: 30, fontWeight: '800' },
  slogan: { color: '#F3D9B5', fontSize: 15, marginTop: 4, marginBottom: 28 },
  card: { backgroundColor: C.bg, borderRadius: 24, padding: 20, paddingTop: 6, width: '100%', maxWidth: 400 },
  erro: { color: C.bad, marginTop: 12, textAlign: 'center' },
});
