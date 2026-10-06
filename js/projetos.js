// Projetos do portfólio. Cada item vira um card na seção #projetos e uma página de detalhes (#projeto/<slug>).
//
// Campos:
//   slug, nome, tag (texto do selo), tipo (filtro: site | sistema | desktop | analytics | api | jogo),
//   status, capa, resumo (card), problema, destaques[], stack[],
//   demo (opcional) — demonstração ao vivo dentro de uma moldura:
//     { telas: [{ rotulo, src, largura, altura, moldura: 'celular' | 'navegador' | 'totem', url }], dica }
//   galeria[] — { src, legenda }
var PROJETOS = [
  {
    slug: 'paala',
    nome: 'Paala',
    subtitulo: 'Jogo de palavras, no estilo Termo — sem a trava do desafio único do dia',
    tag: 'Jogo',
    tipo: 'jogo',
    status: 'Novo',
    capa: 'assets/projetos/paala/capa.png',
    resumo: 'Um joguinho de adivinhar palavras de 5 letras, com três modos — Solo, Dueto e Quarteto — e tentativas ilimitadas: joga quantas rodadas quiser, na hora que quiser.',
    problema: 'Nos jogos desse estilo, tem só uma palavra por dia — resolveu, acabou a graça até amanhã. Aqui não: cada rodada sorteia palavras novas, então dá pra jogar várias vezes seguidas, sozinho ou tentando 2 ou 4 palavras ao mesmo tempo.',
    destaques: [
      'Modo Solo (1 palavra, 6 tentativas), Dueto (2 palavras, 7 tentativas) e Quarteto (4 palavras, 9 tentativas)',
      'Sem desafio único do dia — cada partida sorteia palavras novas na hora',
      'Mais de 9 mil palavras válidas pra digitar e 2 mil selecionadas como resposta, cruzadas com frequência de uso real do português',
      'Digita sem se preocupar com acento (e com teclinha de Ç no teclado virtual)',
      'Teclado físico ou virtual, com cores reaproveitadas tecla a tecla',
    ],
    stack: ['React', 'TypeScript', 'Vite', 'Tailwind'],
    demo: {
      telas: [{ rotulo: 'Jogo', src: 'demos/paala/index.html', largura: 420, altura: 860, moldura: 'celular' }],
      dica: 'Escolha um modo (Solo, Dueto ou Quarteto) e jogue à vontade — sem desafio único do dia.',
    },
    galeria: [
      { src: 'assets/projetos/paala/capa.png', legenda: 'Tela inicial do modo Solo' },
      { src: 'assets/projetos/paala/01-palpite.png', legenda: 'Palpite avaliado, com o teclado reaproveitando as cores' },
      { src: 'assets/projetos/paala/02-dueto.png', legenda: 'Modo Dueto: 2 palavras ao mesmo tempo' },
      { src: 'assets/projetos/paala/03-quarteto.png', legenda: 'Modo Quarteto: 4 palavras ao mesmo tempo' },
      { src: 'assets/projetos/paala/04-vitoria.png', legenda: 'Tela de vitória, com a palavra revelada' },
    ],
  },
  {
    slug: 'lous-garden',
    nome: 'Lou’s Garden',
    subtitulo: 'Totem de autoatendimento + sistema de pedidos',
    tag: 'App desktop',
    tipo: 'desktop',
    status: 'Novo',
    capa: 'assets/projetos/lous-garden/capa.webp',
    resumo: 'Totem de autoatendimento para cafeteria-livraria e o sistema que recebe os pedidos: dois apps desktop que abrem juntos e conversam em tempo real.',
    problema: 'Fila no balcão e pedido anotado no papel. No totem o cliente monta o pedido sozinho, paga e recebe um pager; do outro lado, a equipe vê o pedido chegar na hora, com prazo de preparo e alerta de atraso.',
    destaques: [
      'Cardápio com fotos, sugestão de combo e carrinho',
      'Pagamento por PIX, cartão ou dinheiro, com senha e pager',
      'Fila de pedidos em tempo real, com prazo e alerta de atraso',
      'Pedidos do totem e do caixa no mesmo painel',
      'Resumo do dia: pedidos por canal e faturamento',
      'Um programa só: abre o totem e o sistema juntos, sem servidor à parte'
    ],
    stack: ['Electron', 'React', 'TypeScript', 'Fastify', 'MySQL', 'Tailwind'],
    demo: {
      telas: [{ rotulo: 'Totem', src: 'demos/lous-garden-totem/index.html', largura: 540, altura: 960, moldura: 'totem' }],
      dica: 'Faça um pedido de verdade: escolha os itens, pague (simulado) e finalize. O sistema da cafeteria aparece na galeria.'
    },
    galeria: [
      { src: 'assets/projetos/lous-garden/capa.webp', legenda: 'Totem e sistema da cafeteria rodando lado a lado' },
      { src: 'assets/projetos/lous-garden/01-totem.webp', legenda: 'Tela inicial, cardápio e sugestão de combo' },
      { src: 'assets/projetos/lous-garden/02-pagamento.webp', legenda: 'Carrinho, forma de pagamento e senha' },
      { src: 'assets/projetos/lous-garden/03-finalizacao.webp', legenda: 'Nome + pager e pedido enviado para a fila' },
      { src: 'assets/projetos/lous-garden/04-pedidos.webp', legenda: 'Fila de pedidos em tempo real, com prazo de preparo' },
      { src: 'assets/projetos/lous-garden/05-caixa.webp', legenda: 'Pedido lançado direto no caixa' },
      { src: 'assets/projetos/lous-garden/06-resumo.webp', legenda: 'Resumo do dia: quantidades e caixa' }
    ]
  },
  {
    slug: 'cristiano-barbearia',
    nome: 'Cristiano Barbearia',
    subtitulo: 'Agendamento online com agenda ao vivo',
    tag: 'Site + sistema',
    tipo: 'site',
    status: 'Novo',
    capa: 'assets/projetos/cristiano-barbearia/capa.webp',
    resumo: 'Site de agendamento feito para o celular: o cliente reserva sem cadastro e o barbeiro vê a agenda atualizar na hora.',
    problema: 'Agenda no WhatsApp e no caderno: horário duplicado e cliente que esquece e não aparece. Aqui o cliente escolhe dia e horário em segundos, e o barbeiro controla tudo por um painel.',
    destaques: [
      'Reserva em 3 toques, sem login, para várias pessoas de uma vez',
      'Agenda em tempo real: a reserva aparece no painel na mesma hora',
      'Tabela de serviços e preços editável pelo barbeiro',
      'Lembrete por WhatsApp com um toque',
      'Botões “veio” e “faltou” alimentando o histórico',
      'Limpeza automática de reservas antigas no banco'
    ],
    stack: ['React', 'TypeScript', 'Fastify', 'MySQL', 'Tempo real (SSE)', 'Tailwind'],
    demo: {
      telas: [
        { rotulo: 'Cliente', src: 'demos/cristiano-barbearia/index.html#/', largura: 390, altura: 844, moldura: 'celular' },
        { rotulo: 'Barbeiro', src: 'demos/cristiano-barbearia/index.html#/barbeiro?auto', largura: 1280, altura: 800, moldura: 'navegador', url: 'cristianobarbearia.com.br/barbeiro' }
      ],
      dica: 'Reserve um horário no celular e veja a reserva aparecer no painel do barbeiro, ao lado.'
    },
    galeria: [
      { src: 'assets/projetos/cristiano-barbearia/capa.webp', legenda: 'Cliente no celular, barbeiro no computador' },
      { src: 'assets/projetos/cristiano-barbearia/01-cliente.webp', legenda: 'Escolha de horários, serviço por pessoa e confirmação' },
      { src: 'assets/projetos/cristiano-barbearia/02-agenda.webp', legenda: 'Agenda do dia ao vivo, com WhatsApp e encaixes' },
      { src: 'assets/projetos/cristiano-barbearia/03-ajustes.webp', legenda: 'Serviços, preços e horários de funcionamento' }
    ]
  },
  {
    slug: 'cristiano-analytics',
    nome: 'Cristiano Analytics',
    subtitulo: 'Inteligência de agenda para barbearia',
    tag: 'Analytics',
    tipo: 'analytics',
    status: 'Novo',
    capa: 'assets/projetos/cristiano-analytics/capa.webp',
    resumo: 'Painel que transforma a agenda da barbearia em decisões: quando lota, quem está sumindo e quanto cada estratégia pode render.',
    problema: 'O dono sabe que “terça anda fraca”, mas não sabe quanto perde nem o que fazer. O painel cruza agenda, faltas e serviços e sugere ações com o impacto estimado em reais.',
    destaques: [
      'Indicadores com comparação ao período anterior',
      'Estratégias sugeridas com potencial em R$ por mês',
      'Mapa de calor por dia da semana e hora',
      'Faturamento e ticket médio por serviço',
      'Clientes sumindo, com botão para chamar no WhatsApp',
      'Filtros por período e origem da reserva'
    ],
    stack: ['React', 'TypeScript', 'Recharts', 'Fastify', 'MySQL'],
    demo: {
      telas: [{ rotulo: 'Painel', src: 'demos/cristiano-analytics/index.html', largura: 1440, altura: 900, moldura: 'navegador', url: 'analytics.cristianobarbearia.com.br' }],
      dica: 'Dados de demonstração. Troque o período, filtre a origem e role até as estratégias.'
    },
    galeria: [
      { src: 'assets/projetos/cristiano-analytics/capa.webp', legenda: 'Visão geral dos últimos 90 dias' },
      { src: 'assets/projetos/cristiano-analytics/01-estrategias.webp', legenda: 'Estratégias sugeridas com impacto estimado' },
      { src: 'assets/projetos/cristiano-analytics/02-mapa-de-calor.webp', legenda: 'Quando a barbearia enche (e quando fica vazia)' },
      { src: 'assets/projetos/cristiano-analytics/03-servicos.webp', legenda: 'Faturamento por serviço' },
      { src: 'assets/projetos/cristiano-analytics/04-clientes.webp', legenda: 'Retenção e clientes em risco' }
    ]
  },
  {
    slug: 'lojaodamari',
    nome: 'LojãoDaMari',
    subtitulo: 'PDV e retaguarda para supermercado',
    tag: 'Sistema para comércio',
    tipo: 'desktop',
    status: 'Em produção',
    capa: 'assets/projetos/lojaodamari.png',
    resumo: 'PDV completo para supermercado: caixa com leitor de código de barras e balança, estoque por validade, sugestão de compras e relatórios de vendas. Tudo num app só, com servidor embutido.',
    problema: 'Mercado de bairro com caixa lento, produto vencendo na prateleira e compra feita “no olho”. O sistema junta caixa, estoque e compras, e roda em computador simples, sem instalar Java nem banco.',
    destaques: [
      'Caixa com leitor, etiqueta de balança e hortifruti pesado na hora',
      'Pagamento dividido, troco, CPF na nota e cupom impresso',
      'Estoque por lote e validade: sai primeiro o que vence primeiro',
      'Sugestão de compra pelo giro de vendas e prazo do fornecedor',
      'Curva ABC, margem por seção e vendas por hora',
      'Vários caixas conectados no computador principal'
    ],
    stack: ['Java 25', 'JavaFX', 'Spring Boot', 'MySQL / H2', 'Flyway'],
    galeria: [
      { src: 'assets/projetos/lojaodamari/01-caixa.webp', legenda: 'Caixa (PDV) com cupom e hortifruti na balança' },
      { src: 'assets/projetos/lojaodamari/02-estoque.webp', legenda: 'Estoque por lote e validade' },
      { src: 'assets/projetos/lojaodamari/03-compras.webp', legenda: 'Sugestão de compras pelo giro' },
      { src: 'assets/projetos/lojaodamari/04-analise.webp', legenda: 'Análise de vendas' },
      { src: 'assets/projetos/lojaodamari/05-produtos.webp', legenda: 'Cadastro de produtos' },
      { src: 'assets/projetos/lojaodamari/06-login.webp', legenda: 'Acesso por operador' }
    ]
  },
  {
    slug: 'painel-financeiro',
    nome: 'Painel Financeiro',
    subtitulo: 'Dashboard de finanças pessoais',
    tag: 'Analytics / relatórios',
    tipo: 'analytics',
    status: 'Projeto de portfólio',
    capa: 'assets/projetos/financas-analytics.png',
    resumo: 'Dashboard de finanças pessoais com indicadores, gráficos interativos (saldo acumulado, receita x despesa, gastos por categoria) e exportação completa dos dados pra Excel.',
    problema: 'Planilha de gastos que ninguém entende depois de três meses. O painel mostra em uma tela para onde vai o dinheiro e como o saldo evolui.',
    destaques: [
      'Indicadores do mês: receita, despesa, saldo e taxa de poupança',
      'Saldo acumulado e receita x despesa ao longo do tempo',
      'Gastos por categoria',
      'Exportação completa para Excel'
    ],
    stack: ['Next.js', 'React', 'TypeScript', 'Recharts', 'Tailwind'],
    demo: {
      telas: [{ rotulo: 'Painel', src: 'demos/financas-analytics/index.html', largura: 1440, altura: 900, moldura: 'navegador', url: 'painel-financeiro' }],
      dica: 'Navegue pelos gráficos e pelas transações.'
    },
    galeria: [
      { src: 'assets/projetos/financas-analytics.png', legenda: 'Visão geral do painel' }
    ]
  },
  {
    slug: 'fisio-agendamento',
    nome: 'Agendamento para fisioterapeuta',
    subtitulo: 'Site com agenda e área do paciente',
    tag: 'Site institucional',
    tipo: 'site',
    status: 'Em produção',
    capa: 'assets/projetos/fisio-agendamento.png',
    resumo: 'Site com liberação de acesso por código após triagem, agenda automática por padrão semanal, remarcação pelo próprio paciente e lembrete de sessão por e-mail.',
    problema: 'A fisioterapeuta perdia tempo combinando e remarcando sessão por mensagem. Agora o paciente entra com um código, vê seus horários e remarca sozinho, e o lembrete chega por e-mail.',
    destaques: [
      'Acesso liberado por código depois da triagem',
      'Agenda gerada pelo padrão semanal de cada paciente',
      'Remarcação feita pelo próprio paciente',
      'Lembrete automático de sessão por e-mail'
    ],
    stack: ['Node.js', 'Express', 'MySQL', 'Netlify Functions'],
    galeria: [
      { src: 'assets/projetos/fisio-agendamento.png', legenda: 'Página principal do site' }
    ]
  },
  {
    slug: 'lumiere',
    nome: 'Lumière',
    subtitulo: 'E-commerce de moda feminina',
    tag: 'E-commerce',
    tipo: 'site',
    status: 'Em produção',
    site: 'https://sshswift.com.br',
    capa: 'assets/projetos/lumiere.png',
    resumo: 'E-commerce completo para uma loja lifestyle feminina, com carrinho, pagamento, login e cadastro, controle de pedidos e dashboard.',
    problema: 'Loja que vendia só pelo Instagram e por mensagem. Com a loja virtual, o cliente compra sozinho e a dona acompanha os pedidos e as vendas num painel.',
    destaques: [
      'Catálogo com carrinho e pagamento',
      'Login e cadastro de clientes',
      'Controle de pedidos',
      'Dashboard de vendas para a loja'
    ],
    stack: ['React', 'TypeScript', 'TanStack', 'Tailwind', 'MySQL'],
    galeria: [
      { src: 'assets/projetos/lumiere.png', legenda: 'Vitrine da loja' }
    ]
  },
  {
    slug: 'vendaclara',
    nome: 'VendaClara',
    subtitulo: 'Relatórios de vendas no desktop',
    tag: 'App desktop',
    tipo: 'desktop',
    status: 'Em produção',
    capa: 'assets/projetos/vendaclara.png',
    resumo: 'Aplicação desktop para gerar relatórios de vendas.',
    problema: 'Relatório de vendas montado à mão toda semana. O app lê os dados e entrega o relatório pronto em poucos cliques.',
    destaques: [
      'Relatórios de vendas gerados automaticamente',
      'Roda direto no computador, sem navegador'
    ],
    stack: [],
    galeria: [
      { src: 'assets/projetos/vendaclara.png', legenda: 'Tela principal' }
    ]
  },
  {
    slug: 'prazo-api',
    nome: 'Prazo API',
    subtitulo: 'Dias úteis, prazos e feriados do Brasil',
    tag: 'API',
    tipo: 'api',
    status: 'Em produção',
    capa: 'assets/projetos/prazo-api.png',
    resumo: 'API REST de dias úteis, prazos e feriados nacionais e estaduais do Brasil, com chave de acesso, documentação interativa e um console web pra testar ao vivo.',
    problema: 'Calcular prazo em dias úteis parece fácil até aparecer feriado estadual. A API resolve isso numa chamada, para qualquer sistema usar.',
    destaques: [
      'Feriados nacionais e estaduais',
      'Cálculo de prazos em dias úteis',
      'Acesso por chave de API',
      'Documentação interativa e console para testar'
    ],
    stack: ['Node.js', 'Express', 'MySQL', 'Netlify Functions'],
    galeria: [
      { src: 'assets/projetos/prazo-api.png', legenda: 'Documentação e console da API' }
    ]
  }
];
