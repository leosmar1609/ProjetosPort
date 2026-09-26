// console da Prazo API: monta a requisição, chama a API de verdade e desenha a resposta
(function () {
  // nomes das UFs pro select
  const UFS = {
    AC: 'Acre', AL: 'Alagoas', AP: 'Amapá', AM: 'Amazonas', BA: 'Bahia', CE: 'Ceará', DF: 'Distrito Federal',
    ES: 'Espírito Santo', GO: 'Goiás', MA: 'Maranhão', MT: 'Mato Grosso', MS: 'Mato Grosso do Sul', MG: 'Minas Gerais',
    PA: 'Pará', PB: 'Paraíba', PR: 'Paraná', PE: 'Pernambuco', PI: 'Piauí', RJ: 'Rio de Janeiro', RN: 'Rio Grande do Norte',
    RS: 'Rio Grande do Sul', RO: 'Rondônia', RR: 'Roraima', SC: 'Santa Catarina', SP: 'São Paulo', SE: 'Sergipe', TO: 'Tocantins',
  };
  // texto que aparece do lado do código HTTP
  const STATUS = {
    200: 'OK', 201: 'Created', 400: 'Bad Request', 401: 'Unauthorized', 404: 'Not Found', 405: 'Method Not Allowed',
    409: 'Conflict', 422: 'Unprocessable Entity', 429: 'Too Many Requests', 500: 'Internal Server Error',
  };
  const FACULTATIVOS = ['folga', 'util'];

  // rotas que viram abas. cada campo é [nome, tipo, valor inicial, rótulo]
  const ENDPOINTS = {
    prazo: {
      path: '/v1/prazo',
      desc: 'Soma dias úteis a uma data, como no vencimento de um boleto ou no prazo de um processo. O dia inicial não entra na conta. Dias negativos contam para trás.',
      fields: [['inicio', 'date', 'hoje', 'data inicial'], ['dias', 'number', '15', 'dias úteis'], ['uf', 'uf', 'SP', 'estado'], ['pontos_facultativos', 'facult', 'folga', 'Carnaval etc.']],
    },
    'dias-uteis': {
      path: '/v1/dias-uteis',
      desc: 'Conta quantos dias úteis existem entre duas datas, incluindo as duas pontas.',
      fields: [['inicio', 'date', '2026-11-01', 'de'], ['fim', 'date', '2026-12-31', 'até'], ['uf', 'uf', 'SP', 'estado'], ['pontos_facultativos', 'facult', 'folga', 'Carnaval etc.']],
    },
    'dia-util': {
      path: '/v1/dia-util',
      desc: 'Diz se uma data é dia útil e, se não for, o motivo e qual é o próximo.',
      fields: [['data', 'date', '2026-10-12', 'data'], ['uf', 'uf', 'SP', 'estado'], ['pontos_facultativos', 'facult', 'folga', 'Carnaval etc.']],
    },
    feriados: {
      path: '/v1/feriados',
      desc: 'Lista os feriados de um ano, com os móveis (Sexta-feira Santa, Carnaval, Corpus Christi) já calculados a partir da Páscoa.',
      fields: [['ano', 'number', '2026', 'ano'], ['uf', 'uf', 'RJ', 'estado']],
    },
    'feriados/proximos': {
      path: '/v1/feriados/proximos',
      desc: 'Os próximos feriados a partir de hoje, com quantos dias faltam para cada um.',
      fields: [['uf', 'uf', 'SP', 'estado'], ['quantidade', 'number', '6', 'quantos']],
    },
  };

  // ajudantes: pegar elemento, escapar HTML e formatar data
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const pad = (n) => String(n).padStart(2, '0');
  const DAY = 86400000;
  const parseIso = (s) => { const [y, m, d] = s.split('-').map(Number); return Date.UTC(y, m - 1, d); };
  const br = (t) => { const d = new Date(t); return `${pad(d.getUTCDate())}/${pad(d.getUTCMonth() + 1)}/${d.getUTCFullYear()}`; };

  // estado da tela: aba aberta e histórico de requisições
  let atual = 'prazo';
  const logs = [];

  // a chave fica salva no navegador. se o localStorage estiver bloqueado, vale só enquanto a aba estiver aberta
  let chave = null;
  const guardar = {
    ler() { try { return localStorage.getItem('prazo_chave'); } catch { return null; } },
    salvar(v) { try { v ? localStorage.setItem('prazo_chave', v) : localStorage.removeItem('prazo_chave'); } catch {} },
  };

  // manda a chave no header quando tiver uma
  function cabecalhos() {
    return chave ? { Authorization: `Bearer ${chave}` } : {};
  }

  // atualiza os chips do topo: chave em uso e quantas requisições restam
  function atualizarPlano(limite, restantes) {
    $('plano').innerHTML = chave ? `chave <b>${esc(chave.slice(0, 10))}…</b>` : 'sem chave';
    if (restantes !== undefined) $('quota').textContent = `${restantes}/${limite}`;
    $('sair-chave').hidden = !chave;
    $('abrir-chave').hidden = Boolean(chave);
  }

  // um botão pra cada rota
  function montarAbas() {
    $('tabs').innerHTML = '';
    for (const [k, e] of Object.entries(ENDPOINTS)) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'tab';
      b.setAttribute('role', 'tab');
      b.id = `tab-${k.replace('/', '-')}`;
      b.textContent = e.path;
      b.setAttribute('aria-selected', String(k === atual));
      b.onclick = () => { atual = k; montarAbas(); montarFormulario(); enviar(); };
      $('tabs').appendChild(b);
    }
  }

  // monta os campos da rota escolhida
  function montarFormulario() {
    const e = ENDPOINTS[atual];
    $('desc').textContent = e.desc;
    const f = $('form');
    f.innerHTML = '';
    for (const [nome, tipo, inicial, rotulo] of e.fields) {
      const id = `f-${atual.replace('/', '-')}-${nome}`;
      const w = document.createElement('div');
      w.className = 'field';
      let controle;
      if (tipo === 'uf') {
        controle = `<select id="${id}" name="${nome}"><option value="">nenhum (só nacionais)</option>${Object.entries(UFS)
          .map(([s, n]) => `<option value="${s}" ${s === inicial ? 'selected' : ''}>${s} · ${esc(n)}</option>`).join('')}</select>`;
      } else if (tipo === 'facult') {
        controle = `<select id="${id}" name="${nome}">${FACULTATIVOS.map((v) => `<option value="${v}" ${v === inicial ? 'selected' : ''}>${v === 'folga' ? 'folga (não úteis)' : 'contam como úteis'}</option>`).join('')}</select>`;
      } else {
        const extra = tipo === 'date' ? 'placeholder="AAAA-MM-DD, DD/MM/AAAA ou hoje"' : 'inputmode="numeric"';
        controle = `<input id="${id}" name="${nome}" type="text" value="${esc(inicial)}" ${extra}>`;
      }
      w.innerHTML = `<label for="${id}">${nome} · ${rotulo}</label>${controle}`;
      f.appendChild(w);
    }
    f.oninput = mostrarUrl;
    f.onchange = mostrarUrl;
    mostrarUrl();
  }

  // lê os campos preenchidos (vazio não vai pra URL)
  function consulta() {
    const q = [];
    for (const [nome] of ENDPOINTS[atual].fields) {
      const v = $(`f-${atual.replace('/', '-')}-${nome}`).value.trim();
      if (v !== '') q.push([nome, v]);
    }
    return q;
  }

  // monta o caminho com a query string
  const caminhoDoFormulario = () => {
    const q = consulta();
    return ENDPOINTS[atual].path + (q.length ? `?${q.map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&')}` : '');
  };

  // mostra a URL montada e o comando curl equivalente
  function mostrarCaminho(metodo, caminho) {
    $('method').textContent = metodo;
    $('method').className = `method${metodo === 'POST' ? ' post' : ''}`;
    const [base, qs] = caminho.split('?');
    const partes = qs ? qs.split('&').map((par) => {
      const [k, v = ''] = par.split('=');
      return `${esc(k)}=<span class="p">${esc(decodeURIComponent(v))}</span>`;
    }) : [];
    $('url').innerHTML = `${esc(location.origin + base)}${partes.length ? `?${partes.join('&')}` : ''}`;
    const auth = chave ? ` \\\n  -H "Authorization: Bearer ${chave.slice(0, 10)}…"` : '';
    $('curl').textContent = `curl "${location.origin}${caminho}"${auth}`;
  }

  const mostrarUrl = () => mostrarCaminho('GET', caminhoDoFormulario());

  // faz a requisição, mede o tempo e guarda no histórico junto com os headers de limite e cache. o outraChave serve pra testar uma chave antes de salvar
  async function chamar(metodo, caminho, corpo, outraChave) {
    const t0 = performance.now();
    let status = 0;
    let dados;
    let h = new Headers();
    try {
      const r = await fetch(caminho, {
        method: metodo,
        headers: { ...(outraChave ? { Authorization: `Bearer ${outraChave}` } : cabecalhos()), ...(corpo ? { 'Content-Type': 'application/json' } : {}) },
        body: corpo ? JSON.stringify(corpo) : undefined,
      });
      status = r.status;
      h = r.headers;
      dados = await r.json();
    } catch {
      dados = { erro: { codigo: 'sem_conexao', mensagem: 'Não consegui falar com o servidor. Confira se ele está rodando (npm run dev).' } };
    }
    const total = performance.now() - t0;
    const registro = {
      hora: new Date().toLocaleTimeString('pt-BR'), status, metodo, caminho, total,
      servidor: h.get('X-Response-Time'), cache: h.get('X-Cache'),
      limite: h.get('X-RateLimit-Limit'), restantes: h.get('X-RateLimit-Remaining'),
    };
    logs.unshift(registro);
    logs.length = Math.min(logs.length, 8);
    desenharLog();
    $('host').classList.toggle('off', status === 0);
    if (registro.restantes !== null) atualizarPlano(registro.limite, registro.restantes);
    return { status, dados, registro };
  }

  // botão enviar: chama a API e mostra a resposta e o calendário, ou o erro
  async function enviar(caminhoFixo) {
    const caminho = caminhoFixo || caminhoDoFormulario();
    mostrarCaminho('GET', caminho);
    $('send').disabled = true;
    const { status, dados, registro } = await chamar('GET', caminho);
    $('send').disabled = false;
    mostrarResposta(status, dados, registro);
    if (status >= 200 && status < 300) desenharCalendario(caminho.split('?')[0], dados);
    else desenharErro(dados);
  }

  // barra de status e JSON colorido
  function mostrarResposta(status, dados, r) {
    const ok = status >= 200 && status < 300;
    const rotulo = status ? `${status} ${STATUS[status] || ''}` : 'sem resposta';
    const itens = [`<span class="code ${ok ? 'ok' : 'err'}">${rotulo}</span>`];
    if (r.servidor) itens.push(`<span>servidor <b>${esc(r.servidor)}</b></span>`);
    itens.push(`<span>total <b>${r.total.toFixed(0)}ms</b></span>`);
    if (r.restantes !== null) itens.push(`<span>X-RateLimit-Remaining <b>${esc(r.restantes)}</b></span>`);
    if (r.cache) itens.push(`<span>X-Cache <b>${esc(r.cache)}</b></span>`);
    $('status').innerHTML = itens.join('');
    const j = $('json');
    j.innerHTML = realcar(dados);
    j.classList.remove('fresh');
    void j.offsetWidth;
    j.classList.add('fresh');
  }

  // pinta o JSON: chave, texto, número e true/false/null com cores diferentes
  function realcar(obj) {
    return esc(JSON.stringify(obj, null, 2)).replace(
      /(&quot;(?:\\.|(?!&quot;)[^\\])*&quot;)(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d+)?/g,
      (m, s, doisPontos, b) => {
        if (s) return doisPontos ? `<span class="k">${s}</span>${doisPontos}` : `<span class="s">${s}</span>`;
        if (b) return `<span class="b">${m}</span>`;
        return `<span class="n">${m}</span>`;
      },
    );
  }

  // tabela de últimas requisições
  function desenharLog() {
    $('log').innerHTML = logs.map((l) => `<tr>
      <td>${l.hora}</td>
      <td class="${l.status >= 200 && l.status < 300 ? 's2xx' : 's4xx'}">${l.status || '—'}</td>
      <td>${l.metodo}</td>
      <td class="path" title="${esc(l.caminho)}">${esc(l.caminho)}</td>
      <td>${esc(l.servidor || '—')}</td>
      <td>${l.total.toFixed(0)}ms</td>
      <td>${esc(l.cache || '—')}</td></tr>`).join('');
  }

  // quando dá erro, a frase de explicação vira a mensagem de erro da API
  function desenharErro(dados) {
    const e = dados.erro || {};
    const campo = e.campo ? ` Campo: <code>${esc(e.campo)}</code>.` : '';
    $('summary').innerHTML = `${esc(e.mensagem || 'Erro desconhecido.')}${campo}`;
    $('summary').classList.add('erro');
    $('months').innerHTML = '';
    $('hlist').innerHTML = '';
  }

  // desenha os meses da resposta pintando fim de semana, feriado, início e resultado
  function desenharCalendario(rota, b) {
    $('summary').textContent = b.explicacao || '';
    $('summary').classList.remove('erro');

    let de, ate, inicio = null, fim = null, feriados = b.feriados_no_periodo || [], esmaecer = true;
    if (rota === '/v1/prazo') {
      inicio = parseIso(b.inicio); fim = parseIso(b.data_final);
      [de, ate] = inicio <= fim ? [inicio, fim] : [fim, inicio];
    } else if (rota === '/v1/dias-uteis') {
      de = parseIso(b.inicio); ate = parseIso(b.fim);
    } else if (rota === '/v1/dia-util') {
      de = inicio = parseIso(b.data); ate = parseIso(b.proximo_dia_util);
      fim = b.dia_util ? null : ate;
    } else if (rota === '/v1/feriados') {
      de = Date.UTC(b.ano, 0, 1); ate = Date.UTC(b.ano, 11, 31); feriados = b.feriados; esmaecer = false;
    } else {
      $('months').innerHTML = '';
      desenharLista(b.feriados, true);
      return;
    }

    const porData = Object.fromEntries(feriados.map((f) => [f.data, f]));
    const d0 = new Date(de);
    const d1 = new Date(ate);
    let ano = d0.getUTCFullYear();
    let mes = d0.getUTCMonth();
    const ultimo = d1.getUTCFullYear() * 12 + d1.getUTCMonth();
    let html = '';
    for (let n = 0; ano * 12 + mes <= ultimo && n < 25; n++) {
      const primeiro = Date.UTC(ano, mes, 1);
      const dias = new Date(Date.UTC(ano, mes + 1, 0)).getUTCDate();
      const nome = new Date(primeiro).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' });
      let celulas = 'DSTQQSS'.split('').map((l) => `<div class="dow">${l}</div>`).join('');
      celulas += '<div class="d blank"></div>'.repeat(new Date(primeiro).getUTCDay());
      for (let i = 1; i <= dias; i++) {
        const t = Date.UTC(ano, mes, i);
        const iso = `${ano}-${pad(mes + 1)}-${pad(i)}`;
        const f = porData[iso];
        const semana = new Date(t).getUTCDay();
        let c = 'd';
        if (f) c += f.tipo === 'ponto_facultativo' ? ' fa' : ' fe';
        else if (semana === 0 || semana === 6) c += ' we';
        if (esmaecer && (t < de || t > ate)) c += ' out';
        if (t === inicio) c += ' start';
        if (t === fim) c += ' end';
        celulas += `<div class="${c}" title="${br(t)}${f ? ` · ${esc(f.nome)}` : ''}">${i}</div>`;
      }
      html += `<div class="month"><h3>${nome}</h3><div class="grid">${celulas}</div></div>`;
      mes++;
      if (mes > 11) { mes = 0; ano++; }
    }
    $('months').innerHTML = html;
    desenharLista(feriados, false);
  }

  // lista de feriados embaixo do calendário
  function desenharLista(feriados, comContagem) {
    $('hlist').innerHTML = feriados.map((f) => {
      const extra = comContagem ? `<span class="extra">em ${f.dias_ate} ${f.dias_ate === 1 ? 'dia' : 'dias'}</span>` : '';
      const tipo = f.tipo === 'ponto_facultativo' ? 'ponto facultativo' : f.tipo;
      return `<li><span class="dt">${br(parseIso(f.data))}</span><span>${esc(f.nome)} ${extra}</span><span class="tag ${f.tipo}">${tipo}</span></li>`;
    }).join('');
  }

  // abre e fecha o painel da chave (criar nova ou usar uma que já tenho)
  $('abrir-chave').onclick = () => {
    $('keypanel').hidden = !$('keypanel').hidden;
    if (!$('keypanel').hidden) $('email-chave').focus();
  };

  // cria a chave pelo POST /v1/chaves e o console já passa a usar
  $('form-chave').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const email = $('email-chave').value.trim();
    $('keyerror').hidden = true;
    mostrarCaminho('POST', '/v1/chaves');
    const { status, dados, registro } = await chamar('POST', '/v1/chaves', { email });
    mostrarResposta(status, dados, registro);
    if (status === 201) {
      chave = dados.chave;
      guardar.salvar(chave);
      $('chave-texto').textContent = chave;
      $('keyresult').hidden = false;
      $('keyopcoes').hidden = true;
      await carregarUso();
    } else {
      $('keyerror').textContent = dados.erro?.mensagem || 'Não foi possível criar a chave.';
      $('keyerror').hidden = false;
    }
  });

  // usa uma chave que eu já tenho: confiro no GET /v1/uso antes de salvar, assim chave errada ou apagada avisa na hora
  $('form-usar-chave').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const colada = $('chave-existente').value.trim().replace(/^Bearer\s+/i, '');
    $('keyerror').hidden = true;
    if (!/^pz_[0-9a-f]{40}$/i.test(colada)) {
      $('keyerror').textContent = 'Essa chave não está no formato certo. Ela começa com pz_ e tem mais 40 letras e números.';
      $('keyerror').hidden = false;
      return;
    }
    mostrarCaminho('GET', '/v1/uso');
    const { status, dados, registro } = await chamar('GET', '/v1/uso', null, colada);
    mostrarResposta(status, dados, registro);
    if (status === 200) {
      chave = colada;
      guardar.salvar(chave);
      $('keypanel').hidden = true;
      $('chave-existente').value = '';
      atualizarPlano(dados.limite_diario, dados.restantes);
      mostrarUrl();
    } else {
      $('keyerror').textContent = dados.erro?.mensagem || 'Não foi possível usar essa chave.';
      $('keyerror').hidden = false;
    }
  });

  // copia a chave
  $('copiar-chave').onclick = async () => {
    try {
      await navigator.clipboard.writeText(chave);
      $('copiar-chave').textContent = 'Copiada';
    } catch {
      $('copiar-chave').textContent = 'Selecione e copie';
    }
  };

  // volta a usar sem chave
  $('sair-chave').onclick = async () => {
    chave = null;
    guardar.salvar(null);
    $('keypanel').hidden = true;
    $('keyresult').hidden = true;
    $('keyopcoes').hidden = false;
    $('keyerror').hidden = true;
    $('chave-existente').value = '';
    await carregarUso();
    mostrarUrl();
  };

  // busca o uso de hoje. se a chave não existe mais (servidor em memória reiniciou), apago e sigo sem chave
  async function carregarUso() {
    try {
      const r = await fetch('/v1/uso', { headers: cabecalhos() });
      const d = await r.json();
      if (r.status === 401 && chave) {
        chave = null;
        guardar.salvar(null);
        return carregarUso();
      }
      atualizarPlano(d.limite_diario, d.restantes);
    } catch {
      $('host').classList.add('off');
    }
  }

  // liga os botões e o atalho Ctrl+Enter, e já faz a primeira requisição quando a página abre
  document.querySelectorAll('[data-teste]').forEach((b) => { b.onclick = () => enviar(b.dataset.teste); });
  $('send').onclick = () => enviar();
  $('form').addEventListener('submit', (ev) => { ev.preventDefault(); enviar(); });
  document.addEventListener('keydown', (ev) => {
    if (ev.key === 'Enter' && (ev.ctrlKey || ev.metaKey)) { ev.preventDefault(); enviar(); }
  });

  $('host').textContent = location.host;
  chave = guardar.ler();
  montarAbas();
  montarFormulario();
  carregarUso().then(() => enviar());
})();
