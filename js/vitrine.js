// Vitrine de projetos: cards (a partir de js/projetos.js), filtros e a página de cada projeto,
// com demonstração ao vivo em moldura de aparelho e galeria de telas. Endereço: #projeto/<slug>.
(function () {
  var grid = document.getElementById('projectGrid');
  var filtrosEl = document.getElementById('projectFilters');
  var dlg = document.getElementById('case');
  if (!grid || !dlg || typeof PROJETOS === 'undefined') return;

  var NOMES_TIPO = { site: 'Sites', desktop: 'Apps desktop', analytics: 'Analytics', sistema: 'Sistemas', api: 'APIs' };
  var reduzMovimento = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var filtro = 'todos';

  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function porSlug(slug) {
    for (var i = 0; i < PROJETOS.length; i++) if (PROJETOS[i].slug === slug) return PROJETOS[i];
    return null;
  }
  function visiveis() {
    return PROJETOS.filter(function (p) { return filtro === 'todos' || p.tipo === filtro; });
  }

  // ---------------------------------------------------------------- cards + filtros
  function renderCards() {
    grid.innerHTML = '';
    visiveis().forEach(function (p) {
      var a = el('a', 'project-card reveal');
      a.href = '#projeto/' + p.slug;
      a.setAttribute('data-slug', p.slug);
      a.innerHTML =
        '<div class="project-media">' +
          '<img src="' + esc(p.capa) + '" alt="' + esc(p.nome + ' — ' + p.subtitulo) + '" loading="lazy" decoding="async">' +
          (p.demo ? '<span class="project-live"><i></i>Teste ao vivo</span>' : '') +
        '</div>' +
        '<div class="project-body">' +
          '<div class="project-top"><span class="project-tag">' + esc(p.tag) + '</span>' +
          '<span class="project-status' + (p.status === 'Novo' ? ' is-new' : '') + '"><i></i>' + esc(p.status) + '</span></div>' +
          '<h3>' + esc(p.nome) + '</h3>' +
          '<p>' + esc(p.resumo) + '</p>' +
          '<span class="project-more">' + (p.demo ? 'Ver funcionando' : 'Ver projeto') + ' <span aria-hidden="true">→</span></span>' +
        '</div>';
      grid.appendChild(a);
    });
    // os cards entram já visíveis quando a seção está na tela (o efeito de entrada é do script.js)
    requestAnimationFrame(function () {
      grid.querySelectorAll('.reveal').forEach(function (c) {
        if (filtrosEl && filtrosEl.dataset.mexeu) c.classList.add('in-view');
      });
    });
  }

  function renderFiltros() {
    if (!filtrosEl) return;
    var tipos = ['todos'];
    PROJETOS.forEach(function (p) { if (tipos.indexOf(p.tipo) < 0) tipos.push(p.tipo); });
    filtrosEl.innerHTML = '';
    tipos.forEach(function (t) {
      var n = t === 'todos' ? PROJETOS.length : PROJETOS.filter(function (p) { return p.tipo === t; }).length;
      var b = el('button', 'chip', (t === 'todos' ? 'Todos' : NOMES_TIPO[t] || t) + ' <span>' + n + '</span>');
      b.type = 'button';
      b.setAttribute('aria-pressed', t === filtro ? 'true' : 'false');
      b.addEventListener('click', function () {
        filtro = t;
        filtrosEl.dataset.mexeu = '1';
        filtrosEl.querySelectorAll('.chip').forEach(function (c) { c.setAttribute('aria-pressed', c === b ? 'true' : 'false'); });
        renderCards();
      });
      filtrosEl.appendChild(b);
    });
  }

  // ---------------------------------------------------------------- página do projeto
  var $ = function (id) { return document.getElementById(id); };
  var atual = null;
  var abriuPorClique = false;
  var focoAnterior = null;
  var galeriaTimer = null;
  var compacto = null;

  function abrir(slug) {
    var p = porSlug(slug);
    if (!p) return;
    atual = p;
    $('caseTag').textContent = p.tag;
    $('caseTitle').textContent = p.nome;
    $('caseSub').textContent = p.subtitulo;
    if (p.site) {
      $('caseSite').href = p.site;
      $('caseSite').textContent = p.site.replace(/^https?:\/\//, '').replace(/\/$/, '') + ' ↗';
      $('caseSite').hidden = false;
    } else {
      $('caseSite').hidden = true;
    }
    $('caseResumo').textContent = p.resumo;
    $('caseProblema').textContent = p.problema;
    $('caseDestaques').innerHTML = p.destaques.map(function (d) { return '<li>' + esc(d) + '</li>'; }).join('');
    $('caseStackWrap').hidden = !p.stack.length;
    $('caseStack').innerHTML = p.stack.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('');
    var msg = 'Olá! Vi o projeto ' + p.nome + ' no site da Digitalle e quero algo parecido para o meu negócio.';
    $('caseWhats').href = 'https://wa.me/' + (window.WHATSAPP_NUMBER || '5511979934136') + '?text=' + encodeURIComponent(msg);

    var lista = visiveis();
    if (lista.indexOf(p) < 0) lista = PROJETOS;
    var i = lista.indexOf(p);
    var ant = lista[(i - 1 + lista.length) % lista.length];
    var prox = lista[(i + 1) % lista.length];
    $('casePrev').dataset.slug = ant.slug;
    $('casePrev').setAttribute('aria-label', 'Projeto anterior: ' + ant.nome);
    $('caseNext').dataset.slug = prox.slug;
    $('caseNext').setAttribute('aria-label', 'Próximo projeto: ' + prox.nome);
    $('caseNextName').textContent = prox.nome;

    $('caseTabs').hidden = !p.demo;
    $('caseHintWrap').hidden = !p.demo;
    montarGaleria(p);
    mostrarAba(p.demo ? 'live' : 'galeria');

    if (!dlg.open) {
      focoAnterior = document.activeElement;
      document.documentElement.classList.add('case-aberto');
      dlg.showModal();
    }
    dlg.querySelector('.case-scroll').scrollTop = 0;
    $('caseClose').focus();
  }

  function fecharDialogo() {
    pararGaleria();
    $('caseLive').innerHTML = '';
    atual = null;
    if (dlg.open) dlg.close();
    document.documentElement.classList.remove('case-aberto');
    if (focoAnterior && focoAnterior.focus) focoAnterior.focus({ preventScroll: true });
  }

  // Fechar pelo botão/Esc: volta o endereço; o "hashchange" fecha o diálogo.
  function pedirFechar() {
    if (abriuPorClique) { abriuPorClique = false; history.back(); }
    else { history.replaceState(null, '', location.pathname + location.search + '#projetos'); fecharDialogo(); }
  }

  function mostrarAba(aba) {
    var live = aba === 'live';
    $('tabLive').setAttribute('aria-selected', live ? 'true' : 'false');
    $('tabGaleria').setAttribute('aria-selected', live ? 'false' : 'true');
    $('tabLive').tabIndex = live ? 0 : -1;
    $('tabGaleria').tabIndex = live ? -1 : 0;
    $('caseLivePanel').hidden = !live;
    $('caseHintWrap').hidden = !live;
    $('caseGaleriaPanel').hidden = live;
    if (live) { pararGaleria(); montarDemo(atual); }
    else { $('caseLive').innerHTML = ''; compacto = null; iniciarGaleria(); }
  }

  // ---------------------------------------------------------------- demonstração ao vivo
  var CHROME = { celular: { w: 20, h: 20 }, totem: { w: 28, h: 40 }, navegador: { w: 2, h: 32 } };

  function eCompacto() { return $('caseLive').clientWidth < 700; }

  function montarDemo(p) {
    var palco = $('caseLive');
    palco.innerHTML = '';
    if (!p || !p.demo) return;
    compacto = eCompacto();
    $('caseHint').textContent = p.demo.dica || '';

    var telas = p.demo.telas.map(function (t) {
      // no celular, as telas de computador abrem na versão móvel do próprio sistema
      if (compacto && t.moldura === 'navegador') return Object.assign({}, t, { largura: 400, altura: 760, moldura: 'celular' });
      return t;
    });

    var troca = null;
    if (compacto && telas.length > 1) {
      troca = el('div', 'live-switch');
      troca.setAttribute('role', 'group');
      troca.setAttribute('aria-label', 'Trocar de tela');
      palco.appendChild(troca);
    }
    var linha = el('div', 'live-row');
    palco.appendChild(linha);

    telas.forEach(function (t, idx) {
      var dev = el('figure', 'device device-' + t.moldura);
      dev.dataset.w = t.largura;
      dev.dataset.h = t.altura;
      var tela = el('div', 'device-screen');
      var iframe = el('iframe');
      iframe.src = t.src;
      iframe.title = 'Demonstração ao vivo — ' + p.nome + ' (' + t.rotulo + ')';
      iframe.width = t.largura;
      iframe.height = t.altura;
      iframe.setAttribute('loading', 'eager');
      tela.appendChild(el('div', 'device-loading', '<span></span>Carregando demonstração…'));
      iframe.addEventListener('load', function () { tela.classList.add('is-ready'); });
      tela.appendChild(iframe);
      if (t.moldura === 'navegador') {
        dev.appendChild(el('div', 'device-bar', '<i></i><i></i><i></i><span>' + esc(t.url || '') + '</span>'));
      }
      dev.appendChild(tela);
      if (t.moldura === 'totem') dev.appendChild(el('div', 'device-foot'));
      var cap = el('figcaption', '', esc(t.rotulo) +
        ' <a href="' + esc(t.src) + '" target="_blank" rel="noopener">abrir em tela cheia <span aria-hidden="true">↗</span></a>');
      dev.appendChild(cap);
      linha.appendChild(dev);

      if (troca) {
        var b = el('button', 'chip', esc(t.rotulo));
        b.type = 'button';
        b.setAttribute('aria-pressed', idx === 0 ? 'true' : 'false');
        if (idx > 0) dev.hidden = true;
        b.addEventListener('click', function () {
          linha.querySelectorAll('.device').forEach(function (d, j) { d.hidden = j !== idx; });
          troca.querySelectorAll('.chip').forEach(function (c) { c.setAttribute('aria-pressed', c === b ? 'true' : 'false'); });
          escalar();
        });
        troca.appendChild(b);
      }
    });
    escalar();
  }

  // Encaixa as telas (com tamanho "real" de celular/computador) no espaço disponível.
  function escalar() {
    var palco = $('caseLive');
    var devs = [].slice.call(palco.querySelectorAll('.device')).filter(function (d) { return !d.hidden; });
    if (!devs.length) return;
    var W = palco.clientWidth;
    var H;
    if (compacto) H = Math.min(window.innerHeight * 0.72, 680);
    else {
      // cabe inteiro na janela, sem precisar rolar
      var sc = dlg.querySelector('.case-scroll');
      var topo = palco.getBoundingClientRect().top - sc.getBoundingClientRect().top + sc.scrollTop;
      H = Math.max(380, sc.clientHeight - topo - 34);
    }
    var gap = 28, somaW = 0, chromeW = 0, maxH = 0, chromeH = 0;
    devs.forEach(function (d) {
      var c = CHROME[d.className.match(/device-(\w+)/)[1]];
      somaW += +d.dataset.w; chromeW += c.w;
      maxH = Math.max(maxH, +d.dataset.h); chromeH = Math.max(chromeH, c.h);
    });
    var s = Math.min((W - gap * (devs.length - 1) - chromeW) / somaW, (H - chromeH - 40) / maxH, 1);
    devs.forEach(function (d) {
      var tela = d.querySelector('.device-screen');
      var f = d.querySelector('iframe');
      tela.style.width = Math.floor(d.dataset.w * s) + 'px';
      tela.style.height = Math.floor(d.dataset.h * s) + 'px';
      f.style.transform = 'scale(' + s + ')';
    });
  }

  if ('ResizeObserver' in window) {
    new ResizeObserver(function () {
      if (!atual || $('caseLivePanel').hidden || !$('caseLive').firstChild) return;
      if (compacto !== null && compacto !== eCompacto()) montarDemo(atual);
      else escalar();
    }).observe($('caseLive'));
  }

  // ---------------------------------------------------------------- galeria
  var trilho = $('caseTrack');

  function montarGaleria(p) {
    trilho.innerHTML = '';
    var pontos = $('caseDots');
    pontos.innerHTML = '';
    p.galeria.forEach(function (g, i) {
      var f = el('figure', 'slide');
      f.innerHTML = '<img src="' + esc(g.src) + '" alt="' + esc(g.legenda) + '"' + (i > 0 ? ' loading="lazy"' : '') + ' decoding="async">';
      trilho.appendChild(f);
      var d = el('button', 'dot');
      d.type = 'button';
      d.setAttribute('aria-label', 'Imagem ' + (i + 1) + ' de ' + p.galeria.length);
      d.addEventListener('click', function () { pararGaleria(); irPara(i); });
      pontos.appendChild(d);
    });
    var varias = p.galeria.length > 1;
    $('caseGPrev').hidden = !varias;
    $('caseGNext').hidden = !varias;
    pontos.hidden = !varias;
    trilho.scrollLeft = 0;
    marcar(0);
  }

  function indiceAtual() { return Math.round(trilho.scrollLeft / Math.max(1, trilho.clientWidth)); }
  function irPara(i) {
    var n = trilho.children.length;
    if (!n) return;
    i = (i + n) % n;
    trilho.scrollTo({ left: i * trilho.clientWidth, behavior: reduzMovimento ? 'auto' : 'smooth' });
    marcar(i);
  }
  function marcar(i) {
    if (!atual) return;
    var g = atual.galeria[i];
    $('caseCaption').textContent = g ? g.legenda : '';
    $('caseCount').textContent = (i + 1) + ' / ' + atual.galeria.length;
    [].forEach.call($('caseDots').children, function (d, j) { d.setAttribute('aria-current', j === i ? 'true' : 'false'); });
  }
  var rolagem;
  trilho.addEventListener('scroll', function () {
    clearTimeout(rolagem);
    rolagem = setTimeout(function () { marcar(indiceAtual()); }, 60);
  });
  ['pointerdown', 'wheel', 'touchstart'].forEach(function (ev) {
    trilho.addEventListener(ev, pararGaleria, { passive: true });
  });
  $('caseGPrev').addEventListener('click', function () { pararGaleria(); irPara(indiceAtual() - 1); });
  $('caseGNext').addEventListener('click', function () { pararGaleria(); irPara(indiceAtual() + 1); });

  function iniciarGaleria() {
    pararGaleria();
    if (reduzMovimento || !atual || atual.galeria.length < 2) return;
    galeriaTimer = setInterval(function () { irPara(indiceAtual() + 1); }, 5000);
  }
  function pararGaleria() { clearInterval(galeriaTimer); galeriaTimer = null; }

  // ---------------------------------------------------------------- eventos
  $('tabLive').addEventListener('click', function () { mostrarAba('live'); });
  $('tabGaleria').addEventListener('click', function () { mostrarAba('galeria'); });
  $('caseTabs').addEventListener('keydown', function (e) {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    var paraLive = $('tabLive').getAttribute('aria-selected') !== 'true';
    mostrarAba(paraLive ? 'live' : 'galeria');
    $(paraLive ? 'tabLive' : 'tabGaleria').focus();
  });
  $('caseClose').addEventListener('click', pedirFechar);
  dlg.addEventListener('cancel', function (e) { e.preventDefault(); pedirFechar(); });
  dlg.addEventListener('click', function (e) { if (e.target === dlg) pedirFechar(); });
  function trocarProjeto(e) {
    var slug = e.currentTarget.dataset.slug;
    history.replaceState(null, '', '#projeto/' + slug);
    abrir(slug);
  }
  $('casePrev').addEventListener('click', trocarProjeto);
  $('caseNext').addEventListener('click', trocarProjeto);
  $('caseNextBig').addEventListener('click', function () { $('caseNext').click(); });
  $('caseOrcamento').addEventListener('click', function () {
    abriuPorClique = false;
    fecharDialogo();
  });
  dlg.addEventListener('keydown', function (e) {
    if ($('caseGaleriaPanel').hidden || e.target.closest('input, textarea, [role="tablist"]')) return;
    if (e.key === 'ArrowLeft') { pararGaleria(); irPara(indiceAtual() - 1); }
    if (e.key === 'ArrowRight') { pararGaleria(); irPara(indiceAtual() + 1); }
  });

  grid.addEventListener('click', function (e) {
    var card = e.target.closest('a.project-card');
    if (card && !e.ctrlKey && !e.metaKey && !e.shiftKey) abriuPorClique = true;
  });

  function rota() {
    var m = location.hash.match(/^#projeto\/([\w-]+)/);
    if (m && porSlug(m[1])) abrir(m[1]);
    else if (dlg.open) { abriuPorClique = false; fecharDialogo(); }
  }
  window.addEventListener('hashchange', rota);

  renderFiltros();
  renderCards();
  rota();
})();
