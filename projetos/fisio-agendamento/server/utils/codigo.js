import crypto from 'node:crypto';

// Sem caracteres ambíguos (0/O, 1/I/L) pra facilitar digitar/ler em voz alta.
const ALFABETO = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

export function gerarCodigo(tamanho = 8) {
  let codigo = '';
  const bytes = crypto.randomBytes(tamanho);
  for (let i = 0; i < tamanho; i++) {
    codigo += ALFABETO[bytes[i] % ALFABETO.length];
  }
  return `FT-${codigo.slice(0, 4)}-${codigo.slice(4)}`;
}
