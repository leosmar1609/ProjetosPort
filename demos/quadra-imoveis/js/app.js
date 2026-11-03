// Quadra Imóveis — interações do site. Sem dependências; depende de config.js e dados.js.
(function () {
  'use strict';

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var guardar = {
    ler: function (k, padrao) { try { var v = localStorage.getItem('quadra:' + k); return v ? JSON.parse(v) : padrao; } catch (e) { return padrao; } },
    gravar: function (k, v) { try { localStorage.setItem('quadra:' + k, JSON.stringify(v)); } catch (e) { /* modo privado */ } },
  };
  var ehDesktop = window.matchMedia('(pointer: fine)').matches;

  // ---------- Formatação ----------
  var moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
  var numero = new Intl.NumberFormat('pt-BR');
  function precoHTML(im) {
    return moeda.format(im.preco) + (im.finalidade === 'aluguel' ? '<span>/mês</span>' : '');
  }
  function precoTexto(im) { return moeda.format(im.preco) + (im.finalidade === 'aluguel' ? '/mês' : ''); }
  function plural(n, um, varios) { return n + ' ' + (n === 1 ? um : varios); }
  function esc(t) { return String(t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  // ---------- Avisos rápidos ----------
  var avisoTimer;
  function aviso(msg) {
    var el = $('#aviso');
    el.textContent = msg;
    el.classList.add('visivel');
    clearTimeout(avisoTimer);
    avisoTimer = setTimeout(function () { el.classList.remove('visivel'); }, 2800);
  }

  // =====================================================================
  // Contatos e WhatsApp
  // =====================================================================
  var MSG_WHATS = {
    hero: 'Olá! Vim pelo site da Quadra e gostaria de falar com um consultor.',
    menu: 'Olá! Vim pelo site da Quadra e gostaria de falar com um consultor.',
    busca: 'Olá! Não encontrei no site o imóvel que procuro. Posso contar o que preciso?',
    contato: 'Olá! Gostaria de falar com um consultor da Quadra sobre um imóvel.',
    flutuante: 'Olá! Estou no site da Quadra e tenho uma dúvida.',
    barra: 'Olá! Estou no site da Quadra e gostaria de atendimento.',
    rodape: 'Olá! Vim pelo site da Quadra.',
  };
  function linkWhats(msg) { return 'https://wa.me/' + CONFIG.whatsapp + '?text=' + encodeURIComponent(msg); }

  function prepararContatos() {
    $$('[data-whats]').forEach(function (a) {
      var origem = a.getAttribute('data-whats');
      a.href = linkWhats(MSG_WHATS[origem] || MSG_WHATS.contato);
      a.addEventListener('click', function () { rastrear('whatsapp_clique', { origem: origem }); });
    });
    $$('[data-tel]').forEach(function (a) { a.href = 'tel:' + CONFIG.telefone; a.addEventListener('click', function () { rastrear('telefone_clique'); }); });
    $$('[data-tel-texto]').forEach(function (s) { s.textContent = CONFIG.telefoneTexto; });
    $$('[data-email]').forEach(function (a) { a.href = 'mailto:' + CONFIG.email; });
    $$('[data-email-texto]').forEach(function (s) { s.textContent = CONFIG.email; });
    $$('[data-mapa]').forEach(function (a) { a.href = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(CONFIG.endereco); });
    $$('[data-endereco-texto]').forEach(function (s) { s.textContent = CONFIG.endereco; });
    $$('[data-creci]').forEach(function (s) { s.textContent = CONFIG.creci; });
    $('#ano').textContent = new Date().getFullYear();

    var nomes = { instagram: 'Instagram', linkedin: 'LinkedIn', youtube: 'YouTube', facebook: 'Facebook' };
    $('#sociais').innerHTML = Object.keys(CONFIG.sociais).map(function (rede) {
      return '<li><a href="' + CONFIG.sociais[rede] + '" target="_blank" rel="noopener" aria-label="Quadra Imóveis no ' + nomes[rede] + '"><svg class="ic" aria-hidden="true"><use href="#i-' + rede + '"/></svg></a></li>';
    }).join('');
  }

  // Equipe online conforme o horário de São Paulo
  function statusAtendimento() {
    var partes = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Sao_Paulo', weekday: 'short', hour: 'numeric', hour12: false }).formatToParts(new Date());
    var dia = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(partes.find(function (p) { return p.type === 'weekday'; }).value);
    var hora = +partes.find(function (p) { return p.type === 'hour'; }).value % 24;
    var a = CONFIG.atendimento;
    var online = a.dias.indexOf(dia) >= 0 && hora >= a.abre && hora < a.fecha;
    $$('[data-online-status]').forEach(function (s) { s.classList.toggle('status--on', online); });
    $$('[data-online-texto]').forEach(function (s) { s.textContent = online ? 'Online agora · resposta em até 15 minutos' : 'Deixe sua mensagem · respondemos a partir das ' + a.abre + 'h'; });
    $$('[data-online-equipe]').forEach(function (s) { s.textContent = online ? 'Rafael, Beatriz e Marina estão atendendo agora' : 'Nossa equipe volta às ' + a.abre + 'h — sua mensagem fica na frente da fila'; });
  }

  // =====================================================================
  // Cabeçalho e menu
  // =====================================================================
  function prepararCabecalho() {
    var topo = $('#topo');
    var hero = $('#inicio');
    var flutuante = $('.whats-flutuante');
    var barra = $('#barra-acoes');
    var contatoVisivel = false;
    var passouHero = false;

    function atualizarFlutuantes() {
      flutuante.classList.toggle('visivel', passouHero && !contatoVisivel);
      barra.classList.toggle('visivel', passouHero && !contatoVisivel && !document.documentElement.classList.contains('menu-aberto'));
    }
    function aoRolar() {
      topo.classList.toggle('topo--solido', window.scrollY > 40);
      passouHero = hero.getBoundingClientRect().bottom < window.innerHeight * .35;
      atualizarFlutuantes();
    }
    window.addEventListener('scroll', aoRolar, { passive: true });
    aoRolar();

    new IntersectionObserver(function (ents) {
      contatoVisivel = ents[0].isIntersecting;
      atualizarFlutuantes();
    }, { threshold: .08 }).observe($('#contato'));

    // Balão do WhatsApp aparece uma vez no desktop
    setTimeout(function () {
      if (!passouHero || guardar.ler('balao', false)) return;
      flutuante.classList.add('balao');
      guardar.gravar('balao', true);
      setTimeout(function () { flutuante.classList.remove('balao'); }, 6000);
    }, 9000);

    // Menu do celular
    var html = document.documentElement;
    var botao = $('#hamburguer');
    function menu(abrir) {
      html.classList.toggle('menu-aberto', abrir);
      document.body.classList.toggle('travado', abrir);
      botao.setAttribute('aria-expanded', abrir);
      botao.setAttribute('aria-label', abrir ? 'Fechar menu' : 'Abrir menu');
      $$('main, footer').forEach(function (el) { el.inert = abrir; });
      if (abrir) setTimeout(function () { $('.menu__lista a').focus(); }, 300);
      atualizarFlutuantes();
    }
    botao.addEventListener('click', function () { menu(!html.classList.contains('menu-aberto')); });
    $$('#menu a').forEach(function (a) { a.addEventListener('click', function () { if (html.classList.contains('menu-aberto')) menu(false); }); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && html.classList.contains('menu-aberto')) { menu(false); botao.focus(); } });
    window.matchMedia('(min-width: 1024px)').addEventListener('change', function (m) { if (m.matches) menu(false); });

    // Link ativo conforme a seção que passou da linha de 40% da tela
    var links = $$('.menu__lista a');
    var secoes = ['inicio', 'imoveis', 'sobre', 'contato'].map(function (id) { return document.getElementById(id); });
    function marcarAtivo() {
      var atual = 'inicio';
      secoes.forEach(function (s) { if (s.getBoundingClientRect().top <= window.innerHeight * .4) atual = s.id; });
      links.forEach(function (a) {
        var alvo = a.getAttribute('href').slice(1);
        var fin = a.getAttribute('data-finalidade');
        var ativo = alvo === atual && (!fin || estado.finalidade === fin || (!estado.finalidade && fin === 'venda'));
        a.setAttribute('aria-current', ativo ? 'true' : 'false');
      });
    }
    window.addEventListener('scroll', marcarAtivo, { passive: true });
    marcarAtivo();
    prepararCabecalho.marcarAtivo = marcarAtivo;
  }

  // =====================================================================
  // Imóveis: busca, filtros e cards
  // =====================================================================
  var estado = { finalidade: '', local: '', tipo: '', quartos: 0, ordem: 'destaque', todos: false };
  // Quantos cards aparecem antes do “ver mais”: linhas completas em cada largura (3 colunas tem o card grande)
  function porPagina() { return innerWidth >= 1024 ? 8 : innerWidth >= 640 ? 6 : 4; }
  var favoritos = guardar.ler('favoritos', []);

  function filtrar() {
    var lista = IMOVEIS.filter(function (im) {
      return (!estado.finalidade || im.finalidade === estado.finalidade)
        && (!estado.local || im.bairro === estado.local)
        && (!estado.tipo || im.tipo === estado.tipo)
        && im.quartos >= estado.quartos;
    });
    var ordens = {
      destaque: function (a, b) { return a.destaque - b.destaque; },
      menor: function (a, b) { return a.preco - b.preco; },
      maior: function (a, b) { return b.preco - a.preco; },
      area: function (a, b) { return b.area - a.area; },
    };
    return lista.sort(ordens[estado.ordem]);
  }
  function semFiltros() { return !estado.finalidade && !estado.local && !estado.tipo && !estado.quartos; }

  function cardHTML(im, i, grande) {
    var fav = favoritos.indexOf(im.codigo) >= 0;
    var selos = '<span class="selo selo--escuro">' + (im.finalidade === 'venda' ? 'Venda' : 'Aluguel') + '</span>'
      + (im.selo ? '<span class="selo' + (im.selo === 'Lançamento' || im.selo === 'Off-market' ? ' selo--ouro' : '') + '">' + esc(im.selo) + '</span>' : '');
    var sizes = grande ? '(min-width: 1024px) 50vw, (min-width: 640px) 50vw, 100vw' : '(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw';
    return '<article class="card' + (grande ? ' card--grande' : '') + '" style="--i:' + i + '">'
      + '<div class="card__midia">'
      + '<img src="img/' + im.foto + '-720.webp" srcset="img/' + im.foto + '-720.webp 720w, img/' + im.foto + '-1280.webp 1280w" sizes="' + sizes + '" alt="' + esc(im.titulo + ' em ' + im.bairro) + '" width="720" height="540" loading="lazy" decoding="async">'
      + '<div class="card__selos">' + selos + '</div>'
      + '<span class="card__codigo">' + im.codigo + '</span>'
      + '</div>'
      + '<button class="card__fav" type="button" data-fav="' + im.codigo + '" aria-pressed="' + fav + '" aria-label="' + (fav ? 'Remover dos favoritos' : 'Salvar nos favoritos') + ': ' + esc(im.titulo) + '"><svg class="ic" aria-hidden="true"><use href="#i-coracao"/></svg></button>'
      + '<div class="card__corpo">'
      + '<p class="card__local"><svg class="ic" aria-hidden="true"><use href="#i-pin"/></svg>' + esc(im.bairro + ', ' + im.cidade) + '</p>'
      + '<h3 class="card__titulo"><button type="button" data-abrir="' + im.codigo + '">' + esc(im.titulo) + '</button></h3>'
      + '<p class="card__desc">' + esc(im.descricao) + '</p>'
      + atributosHTML(im)
      + '<div class="card__base"><p class="preco"><small>' + (im.finalidade === 'venda' ? 'Valor de venda' : 'Aluguel') + '</small>' + precoHTML(im) + '</p>'
      + '<span class="card__ver" aria-hidden="true">Ver detalhes <svg class="ic"><use href="#i-seta"/></svg></span></div>'
      + '</div></article>';
  }
  function atributosHTML(im) {
    return '<ul class="atributos" aria-label="Características">'
      + '<li><svg class="ic" aria-hidden="true"><use href="#i-cama"/></svg><span><strong>' + im.quartos + '</strong> ' + (im.quartos === 1 ? 'quarto' : 'quartos') + '</span></li>'
      + '<li><svg class="ic" aria-hidden="true"><use href="#i-banho"/></svg><span><strong>' + im.banheiros + '</strong> ' + (im.banheiros === 1 ? 'banheiro' : 'banheiros') + '</span></li>'
      + '<li><svg class="ic" aria-hidden="true"><use href="#i-carro"/></svg><span><strong>' + im.vagas + '</strong> ' + (im.vagas === 1 ? 'vaga' : 'vagas') + '</span></li>'
      + '<li><svg class="ic" aria-hidden="true"><use href="#i-area"/></svg><span><strong>' + numero.format(im.area) + '</strong> m²</span></li>'
      + '</ul>';
  }

  var NOMES_FIN = { venda: 'para comprar', aluguel: 'para alugar' };
  function renderizarImoveis() {
    var lista = filtrar();
    var grade = $('#grade-imoveis');
    var destaque = semFiltros() && estado.ordem === 'destaque';
    var visiveis = estado.todos ? lista : lista.slice(0, porPagina());

    if (!lista.length) {
      grade.innerHTML = '<div class="vazio"><svg class="ic" aria-hidden="true"><use href="#i-lupa-casa"/></svg>'
        + '<h3>Nenhum imóvel com esses filtros — por enquanto.</h3>'
        + '<p>Boa parte da nossa carteira é negociada com discrição e não aparece no site. Conte o que procura e um consultor apresenta opções exclusivas.</p>'
        + '<div><a class="btn btn--whats" href="' + linkWhats('Olá! Procuro um imóvel ' + descricaoBusca() + ' e não encontrei no site. Vocês têm opções?') + '" target="_blank" rel="noopener"><svg class="ic" aria-hidden="true"><use href="#i-whats"/></svg> Pedir opções no WhatsApp</a>'
        + '<button class="btn btn--contorno" type="button" data-limpar>Limpar filtros</button></div></div>';
    } else {
      grade.innerHTML = visiveis.map(function (im, i) { return cardHTML(im, i, destaque && i === 0); }).join('');
    }

    var resto = lista.length - visiveis.length;
    var mais = $('#ver-mais');
    mais.hidden = resto <= 0;
    mais.textContent = 'Ver mais ' + plural(resto, 'imóvel', 'imóveis');

    var resumo = $('#resumo');
    if (semFiltros()) {
      resumo.textContent = plural(lista.length, 'imóvel selecionado', 'imóveis selecionados') + ' pela nossa curadoria';
    } else {
      resumo.innerHTML = '<strong>' + plural(lista.length, 'imóvel', 'imóveis') + '</strong> ' + esc(descricaoBusca()) + ' <button type="button" data-limpar>Limpar filtros</button>';
    }

    $$('#filtro-finalidade .chip').forEach(function (c) { c.setAttribute('aria-pressed', c.getAttribute('data-valor') === estado.finalidade); });
    if (prepararCabecalho.marcarAtivo) prepararCabecalho.marcarAtivo();
  }
  function descricaoBusca() {
    var p = [];
    if (estado.finalidade) p.push(NOMES_FIN[estado.finalidade]);
    if (estado.tipo) p.push('do tipo ' + estado.tipo.toLowerCase());
    if (estado.local) p.push('em ' + estado.local);
    if (estado.quartos) p.push('com ' + estado.quartos + '+ dormitórios');
    return p.join(' ');
  }

  // Opções de localização e tipo, com contagem para a finalidade escolhida
  function preencherSelects() {
    var base = IMOVEIS.filter(function (im) { return !estado.finalidade || im.finalidade === estado.finalidade; });
    var porRegiao = {};
    base.forEach(function (im) {
      porRegiao[im.regiao] = porRegiao[im.regiao] || {};
      porRegiao[im.regiao][im.bairro] = (porRegiao[im.regiao][im.bairro] || 0) + 1;
    });
    var selLocal = $('#busca-local');
    selLocal.innerHTML = '<option value="">Todas as regiões</option>' + Object.keys(porRegiao).sort().map(function (r) {
      return '<optgroup label="' + esc(r) + '">' + Object.keys(porRegiao[r]).sort().map(function (b) {
        return '<option value="' + esc(b) + '">' + esc(b) + ' (' + porRegiao[r][b] + ')</option>';
      }).join('') + '</optgroup>';
    }).join('');
    if (estado.local && !base.some(function (im) { return im.bairro === estado.local; })) estado.local = '';
    selLocal.value = estado.local;

    var tipos = {};
    base.forEach(function (im) { tipos[im.tipo] = (tipos[im.tipo] || 0) + 1; });
    var selTipo = $('#busca-tipo');
    selTipo.innerHTML = '<option value="">Todos os tipos</option>' + Object.keys(tipos).sort().map(function (t) {
      return '<option value="' + esc(t) + '">' + esc(t) + ' (' + tipos[t] + ')</option>';
    }).join('');
    if (estado.tipo && !tipos[estado.tipo]) estado.tipo = '';
    selTipo.value = estado.tipo;

    $$('#busca input[name="finalidade"]').forEach(function (r) { r.checked = r.value === (estado.finalidade || 'venda'); });

    // Rodapé: regiões viram atalhos de busca
    var bairros = [];
    IMOVEIS.forEach(function (im) { if (bairros.indexOf(im.bairro) < 0) bairros.push(im.bairro); });
    $('#rodape-regioes').innerHTML = bairros.slice(0, 6).map(function (b) { return '<li><a href="#imoveis" data-bairro="' + esc(b) + '">' + esc(b) + '</a></li>'; }).join('');
  }

  function aplicarFiltros(novo, rolar) {
    Object.assign(estado, novo, { todos: false });
    preencherSelects();
    renderizarImoveis();
    if (rolar) $('#imoveis').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }

  function prepararImoveis() {
    preencherSelects();
    renderizarImoveis();

    var busca = $('#busca');
    busca.addEventListener('change', function (e) {
      if (e.target.name === 'finalidade') { estado.finalidade = e.target.value; preencherSelects(); }
    });
    busca.addEventListener('submit', function (e) {
      e.preventDefault();
      var d = new FormData(busca);
      aplicarFiltros({ finalidade: d.get('finalidade'), local: d.get('local'), tipo: d.get('tipo'), quartos: +d.get('quartos') }, true);
      rastrear('busca_imoveis', { finalidade: estado.finalidade, local: estado.local, tipo: estado.tipo });
    });

    $('#filtro-finalidade').addEventListener('click', function (e) {
      var chip = e.target.closest('.chip');
      if (chip) aplicarFiltros({ finalidade: chip.getAttribute('data-valor') });
    });
    $('#ordem').addEventListener('change', function (e) { estado.ordem = e.target.value; renderizarImoveis(); });
    $('#ver-mais').addEventListener('click', function () {
      estado.todos = true;
      renderizarImoveis();
      var cards = $$('#grade-imoveis .card');
      var prox = cards[porPagina()];
      if (prox) prox.querySelector('[data-abrir]').focus({ preventScroll: true });
    });

    // Links "Comprar" / "Alugar" e bairros do rodapé
    document.addEventListener('click', function (e) {
      var a = e.target.closest('a[data-finalidade], a[data-bairro]');
      if (a) {
        if (a.hasAttribute('data-bairro')) aplicarFiltros({ finalidade: '', tipo: '', quartos: 0, local: a.getAttribute('data-bairro') });
        else aplicarFiltros({ finalidade: a.getAttribute('data-finalidade'), local: '', tipo: '', quartos: 0 });
      }
      if (e.target.closest('[data-limpar]')) {
        aplicarFiltros({ finalidade: '', local: '', tipo: '', quartos: 0 });
        $('#busca').reset();
      }
    });

    // Cards: favoritar e abrir detalhes
    $('#grade-imoveis').addEventListener('click', function (e) {
      var fav = e.target.closest('[data-fav]');
      if (fav) { alternarFavorito(fav.getAttribute('data-fav')); return; }
      var card = e.target.closest('.card');
      if (card) abrirImovel(card.querySelector('[data-abrir]').getAttribute('data-abrir'));
    });
  }

  function alternarFavorito(codigo) {
    var i = favoritos.indexOf(codigo);
    if (i >= 0) favoritos.splice(i, 1); else favoritos.push(codigo);
    guardar.gravar('favoritos', favoritos);
    var ativo = i < 0;
    $$('[data-fav="' + codigo + '"]').forEach(function (b) {
      b.setAttribute('aria-pressed', ativo);
      b.setAttribute('aria-label', (ativo ? 'Remover dos favoritos' : 'Salvar nos favoritos') + ': ' + IMOVEIS.find(function (im) { return im.codigo === codigo; }).titulo);
      var txt = b.querySelector('span'); if (txt) txt.textContent = ativo ? 'Salvo nos favoritos' : 'Salvar';
    });
    aviso(ativo ? 'Imóvel salvo nos favoritos' : 'Removido dos favoritos');
    rastrear('favorito', { codigo: codigo, ativo: ativo });
  }

  // =====================================================================
  // Detalhes do imóvel (modal)
  // =====================================================================
  var modal, ultimoFoco;
  function abrirImovel(codigo) {
    var im = IMOVEIS.find(function (x) { return x.codigo === codigo; });
    if (!im) return;
    ultimoFoco = document.activeElement;
    var fotos = [im.foto].concat(im.galeria);
    var fav = favoritos.indexOf(im.codigo) >= 0;
    var taxas = [];
    if (im.condominio) taxas.push('Condomínio ' + moeda.format(im.condominio));
    if (im.iptu) taxas.push('IPTU ' + moeda.format(im.iptu) + (im.finalidade === 'aluguel' ? '/mês' : '/ano'));
    var msgWhats = 'Olá! Tenho interesse no imóvel ' + im.codigo + ' — ' + im.titulo + ' (' + im.bairro + ', ' + precoTexto(im) + '). Podemos conversar?';

    $('#modal-corpo').innerHTML =
      '<button class="modal__fechar" type="button" data-fechar aria-label="Fechar detalhes"><svg class="ic" aria-hidden="true"><use href="#i-x"/></svg></button>'
      + '<div class="det">'
      + '<div class="det__galeria">'
      + '<div class="det__fotos" id="det-fotos" tabindex="0" aria-label="Fotos do imóvel">'
      + fotos.map(function (f, i) {
        return '<img src="img/' + f + '-1280.webp" alt="' + (i === 0 ? esc(im.titulo) : 'Ambiente do imóvel ' + im.codigo + ', foto ' + (i + 1)) + '" width="1280" height="854"' + (i ? ' loading="lazy"' : '') + ' decoding="async">';
      }).join('')
      + '</div>'
      + '<button class="det__nav det__nav--ant" type="button" data-foto="-1" aria-label="Foto anterior"><svg class="ic" aria-hidden="true"><use href="#i-seta-esq"/></svg></button>'
      + '<button class="det__nav det__nav--prox" type="button" data-foto="1" aria-label="Próxima foto"><svg class="ic" aria-hidden="true"><use href="#i-seta-dir"/></svg></button>'
      + '<span class="det__contador" id="det-contador">1 / ' + fotos.length + '</span>'
      + '<div class="det__miniaturas">' + fotos.map(function (f, i) {
        return '<button type="button" data-ir="' + i + '" aria-label="Ver foto ' + (i + 1) + '"' + (i ? '' : ' aria-current="true"') + '><img src="img/' + (i ? f + '-1280' : f + '-720') + '.webp" alt="" loading="lazy"></button>';
      }).join('') + '</div>'
      + '</div>'
      + '<div class="det__info">'
      + '<div class="card__selos" style="position:static"><span class="selo selo--escuro">' + (im.finalidade === 'venda' ? 'Venda' : 'Aluguel') + '</span>' + (im.selo ? '<span class="selo selo--ouro">' + esc(im.selo) + '</span>' : '') + '<span class="selo" style="background:var(--areia)">' + im.codigo + '</span></div>'
      + '<p class="card__local"><svg class="ic" aria-hidden="true"><use href="#i-pin"/></svg>' + esc(im.bairro + ', ' + im.cidade + ' — SP') + '</p>'
      + '<h2 class="det__titulo" id="modal-titulo">' + esc(im.titulo) + '</h2>'
      + '<div class="det__preco"><p class="preco"><small>' + (im.finalidade === 'venda' ? 'Valor de venda' : 'Aluguel mensal') + '</small>' + precoHTML(im) + '</p>'
      + (taxas.length ? '<p class="det__taxas">' + taxas.join('<br>') + '</p>' : '') + '</div>'
      + '<ul class="det__attrs">'
      + '<li><svg class="ic" aria-hidden="true"><use href="#i-cama"/></svg><strong>' + im.quartos + '</strong>' + (im.suites === im.quartos ? 'suítes' : 'quartos (' + im.suites + ' suítes)') + '</li>'
      + '<li><svg class="ic" aria-hidden="true"><use href="#i-banho"/></svg><strong>' + im.banheiros + '</strong>banheiros</li>'
      + '<li><svg class="ic" aria-hidden="true"><use href="#i-carro"/></svg><strong>' + im.vagas + '</strong>vagas</li>'
      + '<li><svg class="ic" aria-hidden="true"><use href="#i-area"/></svg><strong>' + numero.format(im.area) + '</strong>m² úteis</li>'
      + '</ul>'
      + '<p class="det__desc">' + esc(im.descricao) + (im.terreno ? ' Terreno de ' + numero.format(im.terreno) + ' m².' : '') + '</p>'
      + '<ul class="det__itens">' + im.itens.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul>'
      + '<div class="det__acoes">'
      + '<a class="btn btn--whats" href="' + linkWhats(msgWhats) + '" target="_blank" rel="noopener" data-whats-imovel><svg class="ic" aria-hidden="true"><use href="#i-whats"/></svg> WhatsApp</a>'
      + '<button class="btn btn--escuro" type="button" data-visita><svg class="ic" aria-hidden="true"><use href="#i-calendario"/></svg> Agendar visita</button>'
      + '</div>'
      + '<div class="det__extra">'
      + '<button type="button" class="fav" data-fav="' + im.codigo + '" aria-pressed="' + fav + '" aria-label="' + (fav ? 'Remover dos favoritos' : 'Salvar nos favoritos') + ': ' + esc(im.titulo) + '"><svg class="ic" aria-hidden="true"><use href="#i-coracao"/></svg><span>' + (fav ? 'Salvo nos favoritos' : 'Salvar') + '</span></button>'
      + '<button type="button" data-compartilhar><svg class="ic" aria-hidden="true"><use href="#i-copiar"/></svg>Compartilhar</button>'
      + '</div>'
      + '</div></div>';

    var corpo = $('#modal-corpo');
    corpo.scrollTop = 0;
    var trilho = $('#det-fotos');
    var atual = 0;
    function irPara(i) {
      atual = (i + fotos.length) % fotos.length;
      trilho.scrollTo({ left: trilho.clientWidth * atual, behavior: 'smooth' });
    }
    trilho.addEventListener('scroll', function () {
      var i = Math.round(trilho.scrollLeft / trilho.clientWidth);
      if (i === atual && trilho.dataset.ok) return;
      trilho.dataset.ok = 1;
      atual = i;
      $('#det-contador').textContent = (i + 1) + ' / ' + fotos.length;
      $$('.det__miniaturas button', corpo).forEach(function (b, j) { b.setAttribute('aria-current', j === i); });
    }, { passive: true });
    trilho.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); irPara(atual + 1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); irPara(atual - 1); }
    });
    corpo.onclick = function (e) {
      var t = e.target;
      if (t.closest('[data-foto]')) irPara(atual + +t.closest('[data-foto]').getAttribute('data-foto'));
      else if (t.closest('[data-ir]')) irPara(+t.closest('[data-ir]').getAttribute('data-ir'));
      else if (t.closest('[data-fav]')) alternarFavorito(im.codigo);
      else if (t.closest('[data-whats-imovel]')) rastrear('whatsapp_clique', { origem: 'imovel', codigo: im.codigo });
      else if (t.closest('[data-compartilhar]')) compartilhar(im);
      else if (t.closest('[data-visita]')) {
        fecharModal();
        preencherContato({
          interesse: im.finalidade === 'venda' ? 'comprar' : 'alugar',
          mensagem: 'Gostaria de agendar uma visita ao imóvel ' + im.codigo + ' — ' + im.titulo + ' (' + im.bairro + '). Melhores dias e horários para mim: ',
          imovel: im.codigo,
        });
        $('#contato').scrollIntoView({ behavior: 'smooth' });
        setTimeout(function () { $('#f-nome').focus({ preventScroll: true }); }, 700);
      }
    };

    modal.showModal();
    document.body.classList.add('travado');
    history.replaceState(null, '', '#imovel/' + im.codigo);
    rastrear('imovel_visto', { codigo: im.codigo });
  }
  function fecharModal() { if (modal.open) modal.close(); }
  function compartilhar(im) {
    var url = location.href.split('#')[0] + '#imovel/' + im.codigo;
    if (navigator.share) { navigator.share({ title: im.titulo + ' — Quadra Imóveis', url: url }).catch(function () {}); return; }
    var ok = function () { aviso('Link do imóvel copiado'); };
    if (navigator.clipboard) navigator.clipboard.writeText(url).then(ok, function () { prompt('Copie o link do imóvel:', url); });
    else prompt('Copie o link do imóvel:', url);
  }

  function prepararModais() {
    modal = $('#modal-imovel');
    modal.addEventListener('close', function () {
      document.body.classList.remove('travado');
      if (location.hash.indexOf('#imovel/') === 0) history.replaceState(null, '', '#imoveis');
      if (ultimoFoco && document.contains(ultimoFoco) && !$('#contato').contains(document.activeElement)) ultimoFoco.focus({ preventScroll: true });
    });
    $$('.modal').forEach(function (m) {
      m.addEventListener('click', function (e) {
        if (e.target === m || e.target.closest('[data-fechar]')) m.close();
      });
    });
    var priv = $('#modal-privacidade');
    priv.addEventListener('close', function () { document.body.classList.remove('travado'); });
    document.addEventListener('click', function (e) {
      if (e.target.closest('[data-abrir-privacidade]')) { e.preventDefault(); priv.showModal(); document.body.classList.add('travado'); }
    });

    // Link direto: site.com/#imovel/QD-1042
    var m = location.hash.match(/^#imovel\/(.+)$/);
    if (m) abrirImovel(decodeURIComponent(m[1]));
  }

  // =====================================================================
  // Contato: preenchimento a partir de CTAs, máscara, validação e envio
  // =====================================================================
  var form, imovelInteresse = '';
  function preencherContato(o) {
    if (o.interesse) {
      var r = $('#form-contato input[name="interesse"][value="' + o.interesse + '"]');
      if (r) { r.checked = true; validar('interesse'); }
    }
    var msg = $('#f-mensagem');
    if (o.mensagem && (!msg.value.trim() || msg.dataset.auto === '1')) {
      msg.value = o.mensagem;
      msg.dataset.auto = '1';
      contar();
    }
    imovelInteresse = o.imovel || '';
    if ($('#form-sucesso').hidden === false) novaMensagem();
  }

  function prepararCTAs() {
    document.addEventListener('click', function (e) {
      var a = e.target.closest('a[data-interesse]');
      if (!a) return;
      preencherContato({ interesse: a.getAttribute('data-interesse'), mensagem: a.getAttribute('data-mensagem') || '' });
      if (ehDesktop && !$('#f-nome').value) setTimeout(function () { $('#f-nome').focus({ preventScroll: true }); }, 800);
    });
  }

  function mascaraTelefone(v) {
    var d = v.replace(/\D/g, '').replace(/^55(?=\d{10,11}$)/, '').slice(0, 11);
    if (d.length <= 2) return d.length ? '(' + d : '';
    if (d.length <= 6) return '(' + d.slice(0, 2) + ') ' + d.slice(2);
    if (d.length <= 10) return '(' + d.slice(0, 2) + ') ' + d.slice(2, 6) + '-' + d.slice(6);
    return '(' + d.slice(0, 2) + ') ' + d.slice(2, 7) + '-' + d.slice(7);
  }

  var DOMINIOS = { 'gmial.com': 'gmail.com', 'gmai.com': 'gmail.com', 'gmail.con': 'gmail.com', 'gmail.co': 'gmail.com', 'gamil.com': 'gmail.com', 'hotmal.com': 'hotmail.com', 'hotmail.con': 'hotmail.com', 'hotmial.com': 'hotmail.com', 'outlok.com': 'outlook.com', 'outlook.con': 'outlook.com', 'yahoo.con': 'yahoo.com', 'yaho.com': 'yahoo.com' };

  // Cada regra devolve '' quando o valor é válido ou a mensagem de erro
  var REGRAS = {
    interesse: function () { return form.interesse.value ? '' : 'Escolha uma das opções.'; },
    nome: function (v) {
      v = v.trim();
      if (!v) return 'Informe seu nome.';
      if (v.length < 3 || !/^[A-Za-zÀ-ÿ'´`^~ .-]+$/.test(v)) return 'Digite um nome válido, só com letras.';
      return '';
    },
    telefone: function (v) {
      var d = v.replace(/\D/g, '');
      if (!d) return 'Informe um telefone para contato.';
      if (d.length < 10) return 'Telefone incompleto. Inclua o DDD: (11) 98765-4321.';
      if (+d.slice(0, 2) < 11) return 'DDD inválido.';
      if (d.length === 11 && d[2] !== '9') return 'Celular deve começar com 9 depois do DDD.';
      return '';
    },
    email: function (v) {
      v = v.trim();
      if (!v) return 'Informe seu e-mail.';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) return 'E-mail inválido. Exemplo: nome@email.com';
      var dom = v.split('@')[1].toLowerCase();
      if (DOMINIOS[dom]) return 'Você quis dizer ' + v.split('@')[0] + '@' + DOMINIOS[dom] + '?';
      return '';
    },
    mensagem: function (v) {
      v = v.trim();
      if (!v) return 'Conte brevemente como podemos ajudar.';
      if (v.length < 10) return 'Escreva um pouco mais (mínimo de 10 caracteres).';
      return '';
    },
    aceite: function () { return form.aceite.checked ? '' : 'Precisamos da sua autorização para responder.'; },
  };

  function validar(nome) {
    var campo = form.elements[nome];
    var valor = campo && campo.value !== undefined ? campo.value : '';
    var erro = REGRAS[nome](valor);
    var saida = $('#erro-' + nome);
    saida.textContent = erro;
    if (nome === 'interesse') {
      $('.interesses').classList.toggle('interesses--erro', !!erro);
    } else if (nome === 'aceite') {
      $('.aceite').classList.toggle('aceite--erro', !!erro);
      form.aceite.setAttribute('aria-invalid', !!erro);
    } else {
      var caixa = campo.closest('.campo');
      caixa.classList.toggle('campo--erro', !!erro);
      caixa.classList.toggle('campo--ok', !erro);
      campo.setAttribute('aria-invalid', !!erro);
    }
    return !erro;
  }

  function contar() { $('#contador').textContent = $('#f-mensagem').value.length + '/800'; }

  function lerFormulario() {
    return {
      interesse: form.interesse.value,
      nome: form.nome.value.trim(),
      telefone: form.telefone.value.trim(),
      email: form.email.value.trim(),
      mensagem: form.mensagem.value.trim(),
      retorno: form.retorno.value,
      imovel: imovelInteresse,
      origem: location.href,
    };
  }

  // Envio: usa CONFIG.leadsEndpoint quando configurado; senão, simula para a demonstração
  function enviarLead(dados) {
    if (!navigator.onLine) return Promise.reject(new Error('offline'));
    if (!CONFIG.leadsEndpoint) return new Promise(function (ok) { setTimeout(ok, 1200); });
    var ctrl = new AbortController();
    var t = setTimeout(function () { ctrl.abort(); }, 12000);
    return fetch(CONFIG.leadsEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados),
      signal: ctrl.signal,
    }).then(function (r) {
      clearTimeout(t);
      if (!r.ok) throw new Error('http ' + r.status);
    });
  }

  var NOMES_INTERESSE = { comprar: 'comprar um imóvel', alugar: 'alugar um imóvel', vender: 'vender meu imóvel', anunciar: 'anunciar meu imóvel' };
  var NOMES_RETORNO = { whatsapp: 'pelo WhatsApp', ligacao: 'por telefone', email: 'por e-mail' };

  function msgWhatsDoForm(d, protocolo) {
    return 'Olá! Sou ' + d.nome + (protocolo ? ' e acabei de enviar uma mensagem pelo site (protocolo ' + protocolo + ')' : '') + '. Tenho interesse em ' + (NOMES_INTERESSE[d.interesse] || 'falar com um consultor') + '.' + (d.mensagem ? '\n\n' + d.mensagem : '');
  }

  function prepararFormulario() {
    form = $('#form-contato');
    var alerta = $('#form-alerta');
    var tocados = {};

    // Rascunho: o que a pessoa digitou não se perde se ela sair e voltar
    var rascunho = guardar.ler('rascunho', null);
    if (rascunho) {
      ['nome', 'telefone', 'email', 'mensagem'].forEach(function (k) { if (rascunho[k]) form.elements[k].value = rascunho[k]; });
      if (rascunho.interesse) preencherContato({ interesse: rascunho.interesse });
      contar();
    }
    function salvarRascunho() {
      var d = lerFormulario();
      guardar.gravar('rascunho', { nome: d.nome, telefone: d.telefone, email: d.email, mensagem: d.mensagem, interesse: d.interesse });
    }

    form.telefone.addEventListener('input', function () {
      var antes = this.value;
      this.value = mascaraTelefone(antes);
    });
    form.mensagem.addEventListener('input', function () { this.dataset.auto = '0'; contar(); });

    // O aviso de campos pendentes acompanha as correções e some quando tudo está certo
    function atualizarAlerta() {
      if (alerta.hidden || alerta.dataset.tipo !== 'validacao') return;
      var n = Object.keys(REGRAS).filter(function (k) { return $('#erro-' + k).textContent; }).length;
      if (!n) alerta.hidden = true;
      else alerta.querySelector('span').textContent = n === 1 ? 'Falta só um detalhe: revise o campo destacado.' : 'Revise os ' + n + ' campos destacados para continuar.';
    }
    form.addEventListener('input', function (e) {
      var n = e.target.name;
      if (REGRAS[n] && tocados[n]) validar(n);
      atualizarAlerta();
      salvarRascunho();
    });
    form.addEventListener('change', function (e) {
      var n = e.target.name;
      if (n === 'interesse' || n === 'aceite') validar(n);
      atualizarAlerta();
    });
    ['nome', 'telefone', 'email', 'mensagem'].forEach(function (n) {
      form.elements[n].addEventListener('blur', function () {
        if (this.value.trim()) { tocados[n] = true; validar(n); }
      });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      alerta.hidden = true;
      var invalidos = Object.keys(REGRAS).filter(function (n) { tocados[n] = true; return !validar(n); });
      if (invalidos.length) {
        alerta.innerHTML = '<svg class="ic" aria-hidden="true"><use href="#i-alerta"/></svg><span>' + (invalidos.length === 1 ? 'Falta só um detalhe: revise o campo destacado.' : 'Revise os ' + invalidos.length + ' campos destacados para continuar.') + '</span>';
        alerta.dataset.tipo = 'validacao';
        alerta.hidden = false;
        var primeiro = invalidos[0];
        var alvo = primeiro === 'interesse' ? form.querySelector('input[name="interesse"]') : form.elements[primeiro];
        alvo.focus({ preventScroll: true });
        (primeiro === 'interesse' ? $('.interesses') : alvo.closest('.campo, .aceite') || alvo).scrollIntoView({ behavior: 'smooth', block: 'center' });
        rastrear('lead_invalido', { campos: invalidos.join(',') });
        return;
      }

      var dados = lerFormulario();
      form.classList.add('form--enviando');
      $('.form__enviar-texto').textContent = 'Enviando…';
      form.querySelector('.form__enviar').setAttribute('aria-busy', 'true');

      enviarLead(dados).then(function () {
        var protocolo = 'QD' + Date.now().toString(36).toUpperCase().slice(-6);
        $('[data-sucesso-nome]').textContent = dados.nome.split(' ')[0];
        $('[data-sucesso-canal]').textContent = NOMES_RETORNO[dados.retorno];
        $('[data-sucesso-protocolo]').textContent = protocolo;
        $('[data-sucesso-whats]').href = linkWhats(msgWhatsDoForm(dados, protocolo));
        form.hidden = true;
        var ok = $('#form-sucesso');
        ok.hidden = false;
        ok.focus({ preventScroll: true });
        ok.closest('.cartao-form').scrollIntoView({ behavior: 'smooth', block: 'center' });
        guardar.gravar('rascunho', null);
        rastrear('lead_enviado', { interesse: dados.interesse, imovel: dados.imovel });
      }).catch(function (err) {
        var offline = err && err.message === 'offline';
        alerta.innerHTML = '<svg class="ic" aria-hidden="true"><use href="#i-alerta"/></svg><span>'
          + (offline ? 'Parece que você está sem internet.' : 'Não conseguimos enviar agora.')
          + ' Seus dados continuam aqui — tente de novo ou <a href="' + linkWhats(msgWhatsDoForm(dados)) + '" target="_blank" rel="noopener">envie direto pelo WhatsApp</a>.</span>';
        alerta.dataset.tipo = 'envio';
        alerta.hidden = false;
        alerta.scrollIntoView({ behavior: 'smooth', block: 'center' });
        rastrear('lead_erro', { motivo: String(err && err.message) });
      }).then(function () {
        form.classList.remove('form--enviando');
        $('.form__enviar-texto').textContent = 'Enviar mensagem';
        form.querySelector('.form__enviar').removeAttribute('aria-busy');
      });
    });

    $('#nova-mensagem').addEventListener('click', novaMensagem);
  }
  function novaMensagem() {
    form.reset();
    imovelInteresse = '';
    $$('.campo', form).forEach(function (c) { c.classList.remove('campo--erro', 'campo--ok'); });
    $$('.campo__erro', form).forEach(function (p) { p.textContent = ''; });
    contar();
    $('#form-sucesso').hidden = true;
    form.hidden = false;
  }

  // =====================================================================
  // Depoimentos (carrossel com rolagem nativa)
  // =====================================================================
  function prepararDepoimentos() {
    var trilho = $('#carrossel');
    var estrela = '<svg class="ic" aria-hidden="true"><use href="#i-estrela"/></svg>';
    trilho.innerHTML = DEPOIMENTOS.map(function (d) {
      return '<figure class="depo"><div class="depo__topo"><svg class="depo__aspas" aria-hidden="true"><use href="#i-aspas"/></svg>'
        + '<span class="depo__estrelas" role="img" aria-label="5 de 5 estrelas">' + estrela + estrela + estrela + estrela + estrela + '</span></div>'
        + '<blockquote>' + esc(d.texto) + '</blockquote>'
        + '<figcaption><img src="img/' + d.foto + '-200.webp" alt="' + esc(d.nome) + '" width="52" height="52" loading="lazy"><span><strong>' + esc(d.nome) + '</strong><span>' + esc(d.contexto) + '</span></span></figcaption>'
        + '</figure>';
    }).join('');
    var pontos = $('#carrossel-pontos');
    pontos.innerHTML = DEPOIMENTOS.map(function () { return '<span></span>'; }).join('');
    var cards = $$('.depo', trilho);
    var setas = $$('[data-carrossel]');

    function passo() { return cards[1].offsetLeft - cards[0].offsetLeft; }
    function atualizar() {
      var max = trilho.scrollWidth - trilho.clientWidth - 2;
      setas[0].disabled = trilho.scrollLeft <= 2;
      setas[1].disabled = trilho.scrollLeft >= max;
      var i = trilho.scrollLeft >= max ? cards.length - 1 : Math.round(trilho.scrollLeft / passo());
      $$('span', pontos).forEach(function (p, j) { p.classList.toggle('ativo', j === i); });
    }
    setas.forEach(function (b) {
      b.addEventListener('click', function () { trilho.scrollBy({ left: passo() * +b.getAttribute('data-carrossel'), behavior: 'smooth' }); });
    });
    trilho.addEventListener('scroll', atualizar, { passive: true });
    window.addEventListener('resize', atualizar);
    atualizar();
  }

  // =====================================================================
  // Animações de entrada e contadores
  // =====================================================================
  function prepararAnimacoes() {
    var reduzir = matchMedia('(prefers-reduced-motion: reduce)').matches;
    // Escalona elementos irmãos para entrarem em sequência
    $$('.dif-grade, .numeros, .hero__conteudo, .contato__apelo').forEach(function (g) {
      $$('.revelar', g).forEach(function (el, i) { el.style.setProperty('--atraso', (i * 0.08) + 's'); });
    });
    var obs = new IntersectionObserver(function (ents) {
      ents.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('visivel');
        obs.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: .12 });
    $$('.revelar, .cta-vender').forEach(function (el) { obs.observe(el); });

    var obsNum = new IntersectionObserver(function (ents) {
      ents.forEach(function (e) {
        if (!e.isIntersecting) return;
        obsNum.unobserve(e.target);
        var el = e.target;
        var fim = parseFloat(el.getAttribute('data-contar'));
        var casas = +(el.getAttribute('data-casas') || 0);
        var fmt = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas });
        if (reduzir) { el.textContent = fmt.format(fim); return; }
        var t0 = performance.now();
        (function quadro(t) {
          var p = Math.min(1, (t - t0) / 1800);
          el.textContent = fmt.format(fim * (1 - Math.pow(1 - p, 3)));
          if (p < 1) requestAnimationFrame(quadro);
        })(t0);
      });
    }, { threshold: .6 });
    $$('[data-contar]').forEach(function (el) { obsNum.observe(el); });
  }

  // =====================================================================
  // Início
  // =====================================================================
  function carregarImoveis() {
    if (!CONFIG.imoveisEndpoint) return Promise.resolve();
    return fetch(CONFIG.imoveisEndpoint)
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (lista) { if (Array.isArray(lista) && lista.length) IMOVEIS = lista; })
      .catch(function () { /* mantém os dados locais */ });
  }

  prepararContatos();
  statusAtendimento();
  setInterval(statusAtendimento, 60000);
  prepararAnimacoes();
  prepararDepoimentos();
  prepararFormulario();
  prepararCTAs();
  carregarImoveis().then(function () {
    prepararImoveis();
    prepararCabecalho();
    prepararModais();
  });
})();
