import { Alert, Platform } from 'react-native';

export function aviso(msg: string) {
  if (Platform.OS === 'web') window.alert(msg);
  else Alert.alert('Atenção', msg);
}

export function confirmar(msg: string, botao: string, ok: () => void) {
  if (Platform.OS === 'web') {
    if (window.confirm(msg)) ok();
  } else {
    Alert.alert('Confirmar', msg, [
      { text: 'Cancelar', style: 'cancel' },
      { text: botao, style: botao === 'Excluir' ? 'destructive' : 'default', onPress: ok },
    ]);
  }
}
