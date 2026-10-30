import AsyncStorage from '@react-native-async-storage/async-storage';

import { demoReq } from './demo';

export const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? '').replace(/\/$/, '');

// Versão de demonstração do portfólio: usa dados de exemplo no navegador, sem servidor
export const MODO_DEMO = process.env.EXPO_PUBLIC_DEMO === '1';

const CHAVE_TOKEN = 'dn-token';
let token: string | null = null;
let aoExpirar: (() => void) | null = null;

export const quandoExpirar = (fn: () => void) => { aoExpirar = fn; };

export async function carregarToken() {
  token = MODO_DEMO ? 'demo' : await AsyncStorage.getItem(CHAVE_TOKEN);
  return token;
}

export async function entrar(usuario: string, senha: string) {
  const r = await req<{ token: string }>('POST', '/login', { usuario, senha });
  token = r.token;
  await AsyncStorage.setItem(CHAVE_TOKEN, r.token);
}

export async function sair() {
  token = null;
  await AsyncStorage.removeItem(CHAVE_TOKEN);
}

export async function req<T>(metodo: 'GET' | 'POST' | 'PATCH' | 'DELETE', caminho: string, corpo?: object): Promise<T> {
  if (MODO_DEMO) return demoReq(metodo, caminho, corpo) as Promise<T>;
  let r: Response;
  try {
    r = await fetch(API_URL + caminho, {
      method: metodo,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: corpo ? JSON.stringify(corpo) : undefined,
    });
  } catch {
    throw new Error('Não consegui falar com o servidor. Confira a internet e o EXPO_PUBLIC_API_URL.');
  }
  const json = await r.json().catch(() => ({}));
  if (r.status === 401 && caminho !== '/login') {
    await sair();
    aoExpirar?.();
  }
  if (!r.ok) throw new Error(json.erro || `Erro ${r.status}`);
  return json as T;
}
