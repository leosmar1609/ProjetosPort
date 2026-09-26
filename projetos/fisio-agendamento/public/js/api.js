const CHAVE_TOKEN = 'fisio_token';
const CHAVE_USUARIO = 'fisio_usuario';

function salvarSessao(token, usuario) {
  localStorage.setItem(CHAVE_TOKEN, token);
  localStorage.setItem(CHAVE_USUARIO, JSON.stringify(usuario));
}

function sessaoAtual() {
  const token = localStorage.getItem(CHAVE_TOKEN);
  const usuarioBruto = localStorage.getItem(CHAVE_USUARIO);
  if (!token || !usuarioBruto) return null;
  return { token, usuario: JSON.parse(usuarioBruto) };
}

function sair() {
  localStorage.removeItem(CHAVE_TOKEN);
  localStorage.removeItem(CHAVE_USUARIO);
  window.location.href = '/login.html';
}

// Redireciona pra fora de páginas protegidas se não estiver logado (ou tipo errado).
function exigirSessao(tipoEsperado) {
  const sessao = sessaoAtual();
  if (!sessao || (tipoEsperado && sessao.usuario.tipo !== tipoEsperado)) {
    window.location.href = '/login.html';
    return null;
  }
  return sessao;
}

// Usado em páginas como login/cadastro: se a pessoa já estiver logada, manda direto pro painel dela
// em vez de mostrar o formulário de novo.
function redirecionarSeLogado() {
  const sessao = sessaoAtual();
  if (sessao) {
    window.location.href = sessao.usuario.tipo === 'fisio' ? '/fisio/painel.html' : '/paciente/painel.html';
  }
  return sessao;
}

async function api(caminho, { method = 'GET', body, autenticado = true } = {}) {
  const sessao = sessaoAtual();
  const cabecalhos = { 'Content-Type': 'application/json' };
  if (autenticado && sessao) {
    cabecalhos.Authorization = `Bearer ${sessao.token}`;
  }

  const resposta = await fetch(`/api${caminho}`, {
    method,
    headers: cabecalhos,
    body: body ? JSON.stringify(body) : undefined,
  });

  const dados = await resposta.json().catch(() => ({}));

  if (!resposta.ok) {
    throw new Error(dados.erro || 'Algo deu errado. Tente de novo.');
  }
  return dados;
}

async function apiUpload(caminho, formData) {
  const sessao = sessaoAtual();
  const cabecalhos = {};
  if (sessao) cabecalhos.Authorization = `Bearer ${sessao.token}`;

  const resposta = await fetch(`/api${caminho}`, { method: 'POST', headers: cabecalhos, body: formData });
  const dados = await resposta.json().catch(() => ({}));

  if (!resposta.ok) {
    throw new Error(dados.erro || 'Algo deu errado. Tente de novo.');
  }
  return dados;
}

// Escapa texto vindo de usuários (nome, telefone, observação...) antes de inserir via innerHTML.
function escapeHtml(texto) {
  const div = document.createElement('div');
  div.textContent = texto ?? '';
  return div.innerHTML;
}

// HTML pronto (já escapado) de um avatar pequeno pra usar dentro de innerHTML/template strings.
function avatarHtml(nome, fotoUrl, classeExtra = '') {
  if (fotoUrl) {
    return `<div class="avatar ${classeExtra}"><img src="${escapeHtml(fotoUrl)}" alt="" style="width:100%;height:100%;object-fit:cover;"></div>`;
  }
  return `<div class="avatar ${classeExtra}">${escapeHtml(iniciais(nome))}</div>`;
}

function iniciais(nome) {
  return (nome || '')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase() || '')
    .join('');
}

// Preenche um elemento .avatar com a foto do usuário, ou com as iniciais do nome se não tiver foto.
function preencherAvatar(elemento, usuario) {
  elemento.textContent = '';
  elemento.style.backgroundImage = '';
  if (usuario.foto_url) {
    const img = document.createElement('img');
    img.src = usuario.foto_url;
    img.alt = '';
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.objectFit = 'cover';
    elemento.appendChild(img);
  } else {
    elemento.textContent = iniciais(usuario.nome);
  }
}

function formatarData(data) {
  const [ano, mes, dia] = data.split('-');
  return `${dia}/${mes}/${ano}`;
}

function mostrarAviso(elemento, mensagem, tipo = 'erro') {
  elemento.textContent = mensagem;
  elemento.className = `aviso aviso-${tipo}`;
  elemento.hidden = false;
}
