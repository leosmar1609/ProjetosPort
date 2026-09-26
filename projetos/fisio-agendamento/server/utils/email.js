const PROVEDOR = process.env.EMAIL_PROVIDER || 'console';
const REMETENTE = process.env.EMAIL_REMETENTE || 'Anna Barbosa Fisioterapia <onboarding@resend.dev>';

// Ponto único de envio de e-mail. Troca de provedor é só mexer no EMAIL_PROVIDER do .env —
// nenhuma rota/serviço que chama enviarEmail() precisa mudar.
export async function enviarEmail({ para, assunto, texto, html }) {
  if (PROVEDOR === 'resend') {
    return enviarPeloResend({ para, assunto, texto, html });
  }

  // Modo de teste (padrão): não manda de verdade, só registra — pra dar pra testar toda a
  // lógica de lembrete sem precisar de conta em nenhum provedor.
  console.log('--- [e-mail em modo de teste, não enviado de verdade] ---');
  console.log('Para:', para);
  console.log('Assunto:', assunto);
  console.log(texto);
  console.log('-----------------------------------------------------------');
  return { ok: true, modo: 'console' };
}

async function enviarPeloResend({ para, assunto, texto, html }) {
  const chave = process.env.RESEND_API_KEY;
  if (!chave) {
    throw new Error('EMAIL_PROVIDER=resend mas RESEND_API_KEY não está definido no .env.');
  }

  const resposta = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${chave}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: REMETENTE,
      to: [para],
      subject: assunto,
      text: texto,
      html: html || undefined,
    }),
  });

  const dados = await resposta.json().catch(() => ({}));

  if (!resposta.ok) {
    throw new Error(dados.message || `Falha ao enviar e-mail pelo Resend (status ${resposta.status}).`);
  }

  return { ok: true, modo: 'resend', id: dados.id };
}
