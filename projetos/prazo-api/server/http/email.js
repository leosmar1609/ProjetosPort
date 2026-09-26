// regex do e-mail:
// antes do @ -> letras, números e alguns símbolos (máx 64), sem começar/terminar com ponto e sem ".." no meio
// depois do @ -> domínio com pelo menos um ponto, cada parte sem começar/terminar com hífen, final com 2+ letras
const EMAIL = /^(?!\.)(?!.*\.\.)[a-z0-9.!#$%&'*+/=?^_`{|}~-]{1,64}(?<!\.)@(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i;

// devolve o que está errado no e-mail, ou null se estiver ok. testo os erros mais comuns antes da regex pra mensagem dizer exatamente o problema
export function problemaNoEmail(email) {
  if (!email) return 'Informe o e-mail.';
  if (email.length > 254) return 'O e-mail passou de 254 caracteres, o máximo permitido.';
  if (/\s/.test(email)) return 'O e-mail não pode ter espaços.';
  const arrobas = email.split('@').length - 1;
  if (arrobas !== 1) return 'O e-mail precisa ter exatamente um @, ex: voce@exemplo.com.';
  const [usuario, dominio] = email.split('@');
  if (!usuario) return 'Falta o nome antes do @, ex: voce@exemplo.com.';
  if (!dominio.includes('.')) return 'Falta o domínio completo depois do @, ex: exemplo.com.';
  if (!EMAIL.test(email)) return 'O e-mail tem caracteres ou pontos em lugar errado. Confira, ex: voce@exemplo.com.';
  return null;
}
