// Data de hoje no fuso horário local do servidor, como 'YYYY-MM-DD'.
// Não usar new Date().toISOString() pra isso — toISOString() converte pra UTC, o que dá o dia
// errado perto da meia-noite em fusos negativos (ex: Brasil, UTC-3).
export function hojeLocal() {
  const agora = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${agora.getFullYear()}-${p(agora.getMonth() + 1)}-${p(agora.getDate())}`;
}
