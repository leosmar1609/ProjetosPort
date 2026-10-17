/* Contrato Digitalle — gerador do contrato de prestação de serviços.
   Abra contrato.html, preencha o formulário à esquerda e clique em "Imprimir / Salvar PDF".
   O que for digitado fica salvo só neste navegador. Campo vazio vira uma linha para preencher à mão. */

(function () {
  'use strict';

  var STORAGE_KEY = 'digitalle-contrato';

  var SERVICOS = [
    'Site institucional',
    'Loja virtual / e-commerce',
    'Sistema para comércio',
    'API / integração entre sistemas',
    'Vitrine / exposição digital',
    'Painel de analytics',
    'Aplicativo',
  ];

  // Seções e campos do formulário. Os valores padrão já trazem os dados da Digitalle.
  var SECOES = [
    { titulo: 'Contrato', aberta: true, campos: [
      { id: 'numero', label: 'Número do contrato', meio: true, padrao: 'DGT-' + new Date().getFullYear() + '-001' },
      { id: 'data', label: 'Data de assinatura', tipo: 'date', meio: true, padrao: hojeISO() },
      { id: 'cidade', label: 'Cidade da assinatura', meio: true, padrao: 'São Paulo/SP' },
      { id: 'foro', label: 'Foro (comarca)', meio: true, padrao: 'São Paulo/SP' },
    ]},
    { titulo: 'Contratada (você)', campos: [
      { id: 'cdNome', label: 'Nome / razão social', padrao: 'Leonardo de Souza Marcos' },
      { id: 'cdFantasia', label: 'Nome fantasia', meio: true, padrao: 'Digitalle' },
      { id: 'cdDoc', label: 'CPF ou CNPJ', meio: true },
      { id: 'cdEndereco', label: 'Endereço completo' },
      { id: 'cdEmail', label: 'E-mail', meio: true, padrao: 'equipe.digitalle@gmail.com' },
      { id: 'cdTel', label: 'Telefone', meio: true, padrao: '(11) 97993-4136' },
    ]},
    { titulo: 'Contratante (cliente)', aberta: true, cliente: true, campos: [
      { id: 'ctNome', label: 'Nome / razão social' },
      { id: 'ctDoc', label: 'CPF ou CNPJ', meio: true },
      { id: 'ctRep', label: 'Representante legal', meio: true, dica: 'se for empresa' },
      { id: 'ctEndereco', label: 'Endereço completo' },
      { id: 'ctEmail', label: 'E-mail', meio: true },
      { id: 'ctTel', label: 'Telefone', meio: true },
    ]},
    { titulo: 'Projeto', aberta: true, cliente: true, campos: [
      { id: 'servico', label: 'Tipo de serviço', tipo: 'select', opcoes: SERVICOS, padrao: SERVICOS[0] },
      { id: 'projeto', label: 'Nome do projeto', dica: 'ex.: Site da Padaria Central' },
      { id: 'escopo', label: 'Escopo — o que será entregue (um item por linha)', tipo: 'textarea',
        padrao: 'Layout exclusivo e responsivo (celular, tablet e computador)\nAté 5 páginas\nFormulário de contato e botão de WhatsApp\nOtimização básica para Google (SEO)\nPublicação do site no ar' },
      { id: 'prazo', label: 'Prazo (dias úteis)', tipo: 'number', meio: true, padrao: '30' },
      { id: 'revisoes', label: 'Rodadas de ajustes', tipo: 'number', meio: true, padrao: '2' },
    ]},
    { titulo: 'Valor e pagamento', aberta: true, cliente: true, campos: [
      { id: 'valor', label: 'Valor total (R$)', tipo: 'number', meio: true, passo: '0.01' },
      { id: 'entrada', label: 'Entrada (%)', tipo: 'number', meio: true, padrao: '50' },
      { id: 'parcelas', label: 'Parcelas do saldo', tipo: 'number', meio: true, padrao: '1', dica: '1 = saldo na entrega' },
      { id: 'metodo', label: 'Forma de pagamento', tipo: 'select', meio: true,
        opcoes: ['PIX', 'Transferência bancária', 'Boleto bancário', 'Cartão de crédito'], padrao: 'PIX' },
      { id: 'pix', label: 'Chave PIX / dados bancários', padrao: '' },
    ]},
    { titulo: 'Condições', campos: [
      { id: 'suporte', label: 'Garantia após entrega (dias)', tipo: 'number', meio: true, padrao: '30' },
      { id: 'multa', label: 'Multa por rescisão (%)', tipo: 'number', meio: true, padrao: '20' },
      { id: 'hospedagem', label: 'Hospedagem e domínio', tipo: 'select',
        opcoes: ['Por conta do CONTRATANTE', 'Inclusos no valor por 12 meses', 'Não se aplica a este projeto'],
        padrao: 'Por conta do CONTRATANTE' },
      { id: 'portfolio', label: 'Pode mostrar o projeto no portfólio', tipo: 'checkbox', padrao: true },
      { id: 'testemunhas', label: 'Incluir assinatura de 2 testemunhas', tipo: 'checkbox', padrao: true },
      { id: 'extras', label: 'Cláusulas adicionais (opcional, um parágrafo por linha)', tipo: 'textarea', padrao: '' },
    ]},
  ];

  var EXEMPLO = {
    ctNome: 'Padaria Central Ltda.', ctDoc: '12.345.678/0001-90', ctRep: 'Mariana Alves Costa',
    ctEndereco: 'Rua das Flores, 120 — Centro, São Paulo/SP, 01010-000',
    ctEmail: 'contato@padariacentral.com.br', ctTel: '(11) 3456-7890',
    servico: 'Site institucional', projeto: 'Site da Padaria Central', valor: '2400', entrada: '50', parcelas: '2',
  };

  var CAMPOS = [];
  SECOES.forEach(function (s) { s.campos.forEach(function (c) { c.cliente = !!s.cliente; CAMPOS.push(c); }); });

  var form = document.getElementById('form');
  var paper = document.getElementById('paper');
  var estado = carregar();

  montarFormulario();
  renderizar();

  form.addEventListener('input', function (e) {
    var el = e.target;
    if (!el.name) return;
    estado[el.name] = el.type === 'checkbox' ? el.checked : el.value;
    salvar();
    renderizar();
  });

  document.getElementById('btnImprimir').addEventListener('click', function () {
    var nomeAntigo = document.title;
    var cliente = (estado.ctNome || '').trim();
    document.title = 'Contrato ' + (estado.numero || '') + (cliente ? ' — ' + cliente : ''); // vira o nome do PDF
    window.print();
    document.title = nomeAntigo;
  });

  document.getElementById('btnLimpar').addEventListener('click', function () {
    if (!confirm('Apagar os dados do cliente, do projeto e do pagamento?')) return;
    CAMPOS.forEach(function (c) { if (c.cliente) estado[c.id] = padraoDe(c); });
    salvar(); montarFormulario(); renderizar();
  });

  document.getElementById('btnExemplo').addEventListener('click', function () {
    Object.keys(EXEMPLO).forEach(function (k) { estado[k] = EXEMPLO[k]; });
    salvar(); montarFormulario(); renderizar();
  });

  // ---------- formulário ----------

  function montarFormulario() {
    var html = '';
    SECOES.forEach(function (s, i) {
      html += '<details' + (s.aberta ? ' open' : '') + '><summary><span class="n">0' + (i + 1) + '</span>' + esc(s.titulo) + '</summary><div class="fields">';
      s.campos.forEach(function (c) {
        var v = estado[c.id];
        if (c.tipo === 'checkbox') {
          html += '<label class="check"><input type="checkbox" name="' + c.id + '"' + (v ? ' checked' : '') + '>' + esc(c.label) + '</label>';
          return;
        }
        html += '<label' + (c.meio ? ' class="half"' : '') + '>' + esc(c.label);
        if (c.tipo === 'select') {
          html += '<select name="' + c.id + '">' + c.opcoes.map(function (o) {
            return '<option' + (o === v ? ' selected' : '') + '>' + esc(o) + '</option>';
          }).join('') + '</select>';
        } else if (c.tipo === 'textarea') {
          html += '<textarea name="' + c.id + '" rows="5">' + esc(v) + '</textarea>';
        } else {
          html += '<input name="' + c.id + '" type="' + (c.tipo || 'text') + '" value="' + esc(v) + '"' +
            (c.tipo === 'number' ? ' min="0" step="' + (c.passo || '1') + '" inputmode="decimal"' : '') +
            (c.dica ? ' placeholder="' + esc(c.dica) + '"' : '') + '>';
        }
        html += '</label>';
      });
      html += '</div></details>';
    });
    html += '<p class="hint">Tudo fica salvo só neste navegador. Campo em branco sai no contrato como uma linha para preencher à mão.</p>';
    form.innerHTML = html;
  }

  // ---------- contrato ----------

  function renderizar() {
    var e = estado;
    var total = num(e.valor);
    var pctEntrada = Math.min(100, Math.max(0, num(e.entrada)));
    var nParcelas = Math.max(1, Math.round(num(e.parcelas)) || 1);
    var prazo = Math.round(num(e.prazo));
    var revisoes = Math.round(num(e.revisoes));
    var suporte = Math.round(num(e.suporte));
    var contratada = e.cdFantasia ? esc(e.cdNome || '') + (e.cdNome ? ' (' + esc(e.cdFantasia) + ')' : esc(e.cdFantasia)) : campo(e.cdNome);

    var clausulas = [];

    clausulas.push({ titulo: 'Do objeto', paras: [
      'O presente contrato tem por objeto a prestação, pela CONTRATADA, de serviços de desenvolvimento de <b>' +
        esc(e.servico || '').toLowerCase() + '</b>' + (e.projeto ? ', denominado “' + esc(e.projeto) + '”' : '') +
        ', conforme o escopo abaixo:' + listaEscopo(e.escopo),
      'Qualquer funcionalidade, página ou serviço não listado acima será considerado fora do escopo e, se solicitado, será orçado à parte, mediante aceite por escrito (inclusive por e-mail ou WhatsApp) das partes.',
    ]});

    clausulas.push({ titulo: 'Do prazo', paras: [
      'A CONTRATADA entregará o objeto deste contrato em até <b>' + (prazo ? prazo + ' (' + extenso(prazo) + ') dias úteis' : campo('', 'sm') + ' dias úteis') +
        '</b>, contados a partir da assinatura deste contrato' + (pctEntrada > 0 ? ' e da confirmação do pagamento da entrada' : '') + '.',
      'O prazo depende do envio, pelo CONTRATANTE, dos materiais necessários (textos, imagens, logotipo, acessos e informações). Atrasos no envio desses materiais ou na aprovação das etapas prorrogam o prazo de entrega pelo mesmo período.',
      'Considera-se entregue o serviço quando a CONTRATADA disponibilizar a versão final para aprovação. Não havendo manifestação do CONTRATANTE em até 7 (sete) dias corridos, o serviço será considerado aprovado.',
    ]});

    clausulas.push({ titulo: 'Do valor e da forma de pagamento', paras: [
      'Pelos serviços contratados, o CONTRATANTE pagará à CONTRATADA o valor total de:' +
        '<span class="money"><span class="v">' + (total ? brl(total) : 'R$ ' + campo('')) + '</span>' +
        (total ? '<span class="x">(' + esc(reaisPorExtenso(total)) + ')</span>' : '') + '</span>',
      'O pagamento será feito via <b>' + esc(e.metodo || '') + '</b>, conforme o cronograma abaixo:' + tabelaPagamento(total, pctEntrada, nParcelas),
    ].concat(e.pix ? ['Os pagamentos deverão ser feitos para: <b>' + esc(e.pix) + '</b>. O comprovante deve ser enviado à CONTRATADA.'] : [])
    });

    clausulas.push({ titulo: 'Do atraso no pagamento', paras: [
      'O atraso no pagamento de qualquer parcela sujeitará o CONTRATANTE a multa de 2% (dois por cento) sobre o valor devido, acrescida de juros de mora de 1% (um por cento) ao mês, calculados dia a dia.',
      'Atraso superior a 15 (quinze) dias autoriza a CONTRATADA a suspender os serviços — e, se já publicados, a hospedagem sob sua responsabilidade — até a regularização, sem que isso caracterize descumprimento deste contrato.',
    ]});

    clausulas.push({ titulo: 'Dos ajustes e alterações', paras: [
      'Estão incluídas ' + (revisoes ? '<b>' + revisoes + ' (' + extenso(revisoes, true) + ') ' + (revisoes === 1 ? 'rodada' : 'rodadas') + '</b>' : campo('', 'sm') + ' rodadas') +
        ' de ajustes sobre o que foi apresentado, desde que dentro do escopo da Cláusula Primeira.',
      'Ajustes além desse número, mudanças de escopo ou de layout já aprovado serão orçados à parte e podem alterar o prazo de entrega.',
    ]});

    clausulas.push({ titulo: 'Das obrigações da contratada', paras: [
      'Constituem obrigações da CONTRATADA:' + lista([
        'executar os serviços com qualidade técnica, dentro do prazo e do escopo combinados;',
        'manter o CONTRATANTE informado sobre o andamento do projeto;',
        'corrigir, sem custo, falhas de funcionamento decorrentes do seu trabalho, nos termos da cláusula de garantia;',
        'entregar ao CONTRATANTE os acessos e arquivos finais do projeto após a quitação integral.',
      ]),
    ]});

    clausulas.push({ titulo: 'Das obrigações do contratante', paras: [
      'Constituem obrigações do CONTRATANTE:' + lista([
        'efetuar os pagamentos nas datas e valores combinados;',
        'fornecer, em tempo hábil, os materiais e informações necessários à execução dos serviços;',
        'garantir que possui os direitos de uso de todo conteúdo enviado (textos, imagens, marcas), respondendo por ele perante terceiros;',
        'indicar um responsável para aprovações e responder às solicitações da CONTRATADA em até 3 (três) dias úteis.',
      ]),
    ]});

    clausulas.push({ titulo: 'Da hospedagem, do domínio e de serviços de terceiros', paras: [
      textoHospedagem(e.hospedagem),
      'Serviços de terceiros (como gateways de pagamento, envio de e-mails, mapas e plugins pagos) seguem as regras e preços dos respectivos fornecedores, e a CONTRATADA não responde por suas falhas, mudanças ou interrupções.',
    ]});

    clausulas.push({ titulo: 'Da garantia e do suporte', paras: [
      'A CONTRATADA garante, por <b>' + (suporte ? suporte + ' (' + extenso(suporte) + ') dias' : campo('', 'sm') + ' dias') +
        '</b> após a entrega, a correção gratuita de defeitos de funcionamento decorrentes do seu trabalho.',
      'A garantia não cobre novas funcionalidades, alterações de conteúdo, nem problemas causados por modificações feitas pelo CONTRATANTE ou por terceiros, por falhas da hospedagem ou por atualizações de serviços externos. Esses atendimentos, assim como a manutenção contínua, podem ser contratados à parte.',
    ]});

    clausulas.push({ titulo: 'Da propriedade intelectual', paras: [
      'Após a quitação integral deste contrato, ficam transferidos ao CONTRATANTE os direitos patrimoniais sobre o produto final desenvolvido especificamente para ele. Até a quitação, todos os direitos permanecem com a CONTRATADA.',
      'Bibliotecas, ferramentas de código aberto e componentes reutilizáveis já existentes da CONTRATADA continuam regidos por suas próprias licenças, sendo concedido ao CONTRATANTE o direito de uso por tempo indeterminado dentro do projeto.',
      e.portfolio
        ? 'O CONTRATANTE autoriza a CONTRATADA a divulgar o projeto em seu portfólio, site e redes sociais, sem expor dados confidenciais ou pessoais.'
        : 'A CONTRATADA não divulgará o projeto em seu portfólio ou redes sociais sem autorização prévia e por escrito do CONTRATANTE.',
    ]});

    clausulas.push({ titulo: 'Da confidencialidade e da proteção de dados', paras: [
      'As partes manterão em sigilo as informações confidenciais a que tiverem acesso em razão deste contrato, durante sua vigência e por 2 (dois) anos após o seu término.',
      'No tratamento de dados pessoais, as partes cumprirão a Lei Geral de Proteção de Dados (Lei nº 13.709/2018). A CONTRATADA acessará dados pessoais de clientes do CONTRATANTE somente quando necessário à execução dos serviços e não os utilizará para nenhuma outra finalidade.',
    ]});

    clausulas.push({ titulo: 'Da rescisão', paras: [
      'Este contrato pode ser rescindido por qualquer das partes mediante aviso por escrito com 15 (quinze) dias de antecedência.',
      'Em caso de rescisão pelo CONTRATANTE sem justa causa, os valores já pagos não serão devolvidos, sendo devidos ainda os serviços já executados até a data do aviso, e incidirá multa de <b>' +
        (num(e.multa) ? fmtNum(num(e.multa)) + '% (' + extenso(num(e.multa)) + ' por cento)' : campo('', 'sm') + '%') + '</b> sobre o saldo restante do contrato.',
      'Em caso de rescisão pela CONTRATADA sem justa causa, ela devolverá os valores recebidos por serviços ainda não executados.',
      'O descumprimento de qualquer cláusula permite à parte prejudicada rescindir o contrato de imediato, sem prejuízo de perdas e danos.',
    ]});

    var extras = linhas(e.extras);
    if (extras.length) clausulas.push({ titulo: 'Das disposições específicas', paras: extras.map(esc) });

    clausulas.push({ titulo: 'Das disposições gerais', paras: [
      'Este contrato não gera vínculo empregatício, societário ou de exclusividade entre as partes.',
      'Comunicações entre as partes por e-mail ou WhatsApp, nos contatos indicados neste contrato, são válidas para aprovações, pedidos e avisos.',
      'As partes reconhecem como válida a assinatura deste contrato por meio eletrônico, nos termos da Medida Provisória nº 2.200-2/2001 e da Lei nº 14.063/2020.',
    ]});

    clausulas.push({ titulo: 'Do foro', paras: [
      'Fica eleito o foro da comarca de <b>' + campo(e.foro) + '</b> para dirimir quaisquer dúvidas oriundas deste contrato, com renúncia a qualquer outro, por mais privilegiado que seja.',
    ]});

    var html = '';
    html += '<header class="doc-head">' +
      '<div class="doc-brand"><img src="assets/logo-digitalle-icone.png" alt=""><div><span class="word">DIGITALLE</span><span class="tag">Soluções digitais sob medida</span></div></div>' +
      '<div class="doc-meta">Contrato nº<br><b>' + campo(e.numero) + '</b><br>' + campo(dataLonga(e.data)) + '</div>' +
    '</header>';

    html += '<div class="doc-title"><div class="eyebrow">Instrumento particular</div>' +
      '<h1>Contrato de prestação de <em>serviços digitais</em></h1>' +
      '<p>' + esc(e.servico || '') + (e.projeto ? ' · ' + esc(e.projeto) : '') + '</p></div>';

    html += '<section class="parties">' +
      parte('Contratada', contratada, [['CPF/CNPJ', e.cdDoc], ['Endereço', e.cdEndereco], ['E-mail', e.cdEmail], ['Telefone', e.cdTel]]) +
      parte('Contratante', campo(e.ctNome), [['CPF/CNPJ', e.ctDoc]].concat(e.ctRep ? [['Representante', e.ctRep]] : []).concat([['Endereço', e.ctEndereco], ['E-mail', e.ctEmail], ['Telefone', e.ctTel]])) +
    '</section>';

    html += '<p class="preamble">As partes acima identificadas têm entre si justo e acertado o presente Contrato de Prestação de Serviços, que se regerá pelas cláusulas seguintes e pelas condições descritas no presente.</p>';

    clausulas.forEach(function (c, i) {
      html += '<section class="clause"><h2><span class="num">Cláusula ' + ordinal(i + 1) + '</span><span class="t">' + c.titulo + '</span></h2>';
      c.paras.forEach(function (p, j) {
        html += '<p><span class="sn">' + (i + 1) + '.' + (j + 1) + '</span>' + p + '</p>';
      });
      html += '</section>';
    });

    html += '<section class="closing">' +
      '<p>E, por estarem assim justas e contratadas, as partes assinam o presente instrumento em 2 (duas) vias de igual teor e forma' +
      (e.testemunhas ? ', na presença das testemunhas abaixo' : '') + '.</p>' +
      '<p class="place">' + campo(e.cidade) + ', ' + campo(dataLonga(e.data)) + '.</p>' +
      '<div class="signs">' +
        assinatura(e.cdNome || e.cdFantasia, 'CONTRATADA' + (e.cdDoc ? ' · ' + e.cdDoc : '')) +
        assinatura(e.ctRep ? e.ctRep + ' — ' + e.ctNome : e.ctNome, 'CONTRATANTE' + (e.ctDoc ? ' · ' + e.ctDoc : '')) +
        (e.testemunhas
          ? '<div class="witness-title">Testemunhas</div>' + assinatura('', 'Nome:<br>CPF:') + assinatura('', 'Nome:<br>CPF:')
          : '') +
      '</div></section>';

    html += '<footer class="doc-foot"><span>Digitalle · ' + esc(e.cdEmail || '') + (e.cdTel ? ' · ' + esc(e.cdTel) : '') + '</span><span>Contrato nº ' + esc(e.numero || '') + '</span></footer>';

    paper.innerHTML = html;
  }

  function parte(papel, nome, linhasDados) {
    return '<div class="party"><div class="role">' + papel + '</div><div class="name">' + nome + '</div><dl>' +
      linhasDados.map(function (l) { return '<dt>' + l[0] + '</dt><dd>' + campo(l[1]) + '</dd>'; }).join('') + '</dl></div>';
  }

  function assinatura(nome, detalhe) {
    return '<div class="sign"><b>' + (nome ? esc(nome) : '&nbsp;') + '</b><span>' + detalhe + '</span></div>';
  }

  function listaEscopo(texto) {
    var itens = linhas(texto);
    return itens.length ? lista(itens.map(esc)) : '<ul><li>' + campo('') + '</li></ul>';
  }

  function lista(itens) {
    return '<ul>' + itens.map(function (i) { return '<li>' + i + '</li>'; }).join('') + '</ul>';
  }

  function tabelaPagamento(total, pct, n) {
    var linhasTab = [];
    var entrada = arred(total * pct / 100);
    var saldo = arred(total - entrada);

    if (pct > 0) linhasTab.push([pct >= 100 ? 'Pagamento integral' : 'Entrada (' + fmtNum(pct) + '%)', 'Na assinatura do contrato', entrada]);
    if (pct < 100) {
      if (n === 1) {
        linhasTab.push([pct > 0 ? 'Saldo (' + fmtNum(100 - pct) + '%)' : 'Pagamento integral', 'Na entrega / aprovação final', saldo]);
      } else {
        var parcela = Math.floor(saldo / n * 100) / 100;
        for (var i = 1; i <= n; i++) {
          var v = i === n ? arred(saldo - parcela * (n - 1)) : parcela; // a última absorve os centavos
          var quando = (i * 30) + ' dias após a ' + (pct > 0 ? 'entrada' : 'assinatura');
          linhasTab.push(['Parcela ' + i + ' de ' + n, quando, v]);
        }
      }
    }

    return '<table class="plan"><thead><tr><th>Parcela</th><th>Vencimento</th><th>Valor</th></tr></thead><tbody>' +
      linhasTab.map(function (l) { return '<tr><td>' + l[0] + '</td><td>' + l[1] + '</td><td>' + (total ? brl(l[2]) : campo('', 'sm')) + '</td></tr>'; }).join('') +
      '<tr class="total"><td>Total</td><td></td><td>' + (total ? brl(total) : campo('', 'sm')) + '</td></tr></tbody></table>';
  }

  function textoHospedagem(opcao) {
    if (/Inclusos/.test(opcao)) {
      return 'A hospedagem e o registro de domínio estão incluídos no valor deste contrato pelo período de 12 (doze) meses a partir da publicação. Após esse período, a renovação será de responsabilidade do CONTRATANTE, que poderá mantê-la com a CONTRATADA mediante novo orçamento ou transferi-la para um fornecedor de sua escolha.';
    }
    if (/Não se aplica/.test(opcao)) {
      return 'Este projeto não envolve contratação de hospedagem ou domínio pela CONTRATADA. Caso venham a ser necessários, serão de responsabilidade do CONTRATANTE.';
    }
    return 'Os custos de hospedagem, registro de domínio e demais serviços necessários à publicação são de responsabilidade do CONTRATANTE, devendo ser registrados em seu nome. A CONTRATADA poderá orientar a contratação e fará a configuração necessária para a publicação.';
  }

  // ---------- utilidades ----------

  function campo(v, tam) { return v ? esc(v) : '<span class="blank' + (tam ? ' ' + tam : '') + '"></span>'; }

  function esc(v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function linhas(t) { return String(t || '').split(/\r?\n/).map(function (l) { return l.trim(); }).filter(Boolean); }
  function num(v) { var n = parseFloat(String(v || '').replace(',', '.')); return isFinite(n) && n > 0 ? n : 0; }
  function arred(n) { return Math.round(n * 100) / 100; }
  function fmtNum(n) { return n.toLocaleString('pt-BR', { maximumFractionDigits: 2 }); }
  function brl(n) { return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }

  function hojeISO() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  function dataLonga(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
    if (!m) return '';
    var meses = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
    return parseInt(m[3], 10) + ' de ' + meses[parseInt(m[2], 10) - 1] + ' de ' + m[1];
  }

  function ordinal(n) {
    var u = ['', 'Primeira', 'Segunda', 'Terceira', 'Quarta', 'Quinta', 'Sexta', 'Sétima', 'Oitava', 'Nona'];
    var d = ['', 'Décima', 'Vigésima', 'Trigésima'];
    return [d[Math.floor(n / 10)], u[n % 10]].filter(Boolean).join(' ');
  }

  // Número por extenso (inteiros). feminino=true → "uma", "duas" (ex.: "duas rodadas").
  function extenso(n, feminino) {
    n = Math.floor(n);
    if (n === 0) return 'zero';
    var grupos = [], resto = n;
    while (resto > 0) { grupos.push(resto % 1000); resto = Math.floor(resto / 1000); }
    var nomes = [['', ''], ['mil', 'mil'], ['milhão', 'milhões'], ['bilhão', 'bilhões']];
    var partes = [];
    for (var i = grupos.length - 1; i >= 0; i--) {
      var g = grupos[i];
      if (!g) continue;
      var txt = i === 1 && g === 1 ? 'mil' : ate999(g, feminino && i === 0) + (i ? ' ' + nomes[i][g === 1 ? 0 : 1] : '');
      partes.push({ txt: txt, valor: g });
    }
    // "e" antes do último grupo quando ele é < 100 ou centena redonda: "mil e quinhentos", "mil quinhentos e vinte"
    return partes.reduce(function (acc, p, idx) {
      if (!idx) return p.txt;
      var ultimo = idx === partes.length - 1;
      return acc + (ultimo && (p.valor < 100 || p.valor % 100 === 0) ? ' e ' : ' ') + p.txt;
    }, '');
  }

  function ate999(n, feminino) {
    var un = ['', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove', 'dez', 'onze', 'doze', 'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove'];
    var dez = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'];
    var cem = ['', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos'];
    if (feminino) { un = un.slice(); un[1] = 'uma'; un[2] = 'duas'; cem = cem.map(function (c) { return c.replace(/os$/, 'as'); }); }
    if (n === 100) return 'cem';
    var p = [], c = Math.floor(n / 100), r = n % 100;
    if (c) p.push(cem[c]);
    if (r) p.push(r < 20 ? un[r] : dez[Math.floor(r / 10)] + (r % 10 ? ' e ' + un[r % 10] : ''));
    return p.join(' e ');
  }

  function reaisPorExtenso(valor) {
    var centavosTotal = Math.round(valor * 100);
    var reais = Math.floor(centavosTotal / 100), cent = centavosTotal % 100;
    var partes = [];
    if (reais) {
      var r = extenso(reais);
      var redondoMilhao = reais >= 1000000 && reais % 1000000 === 0;
      partes.push(r + (redondoMilhao ? ' de reais' : reais === 1 ? ' real' : ' reais'));
    }
    if (cent) partes.push(extenso(cent) + (cent === 1 ? ' centavo' : ' centavos'));
    return partes.join(' e ');
  }

  function padraoDe(c) { return c.padrao === undefined ? (c.tipo === 'checkbox' ? false : '') : c.padrao; }

  function carregar() {
    var salvo = {};
    try { salvo = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') || {}; } catch (err) { salvo = {}; }
    var s = {};
    CAMPOS.forEach(function (c) { s[c.id] = c.id in salvo ? salvo[c.id] : padraoDe(c); });
    return s;
  }

  function salvar() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(estado)); } catch (err) { /* sem armazenamento: segue sem salvar */ }
  }
})();
