// Configuração da imobiliária. É o único arquivo que precisa mudar para colocar o site no ar para um cliente real.
var CONFIG = {
  nome: 'Quadra Imóveis',
  creci: '00.000-J',

  // Contato
  whatsapp: '5511999990000',            // DDI + DDD + número, só dígitos (usado em wa.me)
  telefone: '+551134567800',
  telefoneTexto: '(11) 3456-7800',
  email: 'contato@quadraimoveis.com.br',
  endereco: 'Rua Groenlândia, 1200 — Jardim Europa, São Paulo',

  // Horário em que a equipe responde na hora (0 = domingo). Fora dele, o site avisa que o retorno é no próximo período.
  atendimento: { dias: [1, 2, 3, 4, 5, 6], abre: 8, fecha: 20 },

  sociais: {
    instagram: 'https://www.instagram.com/',
    linkedin: 'https://www.linkedin.com/',
    youtube: 'https://www.youtube.com/',
    facebook: 'https://www.facebook.com/',
  },

  // ── Pontos de integração ──────────────────────────────────────────────
  // Formulário de contato: POST JSON { interesse, nome, telefone, email, mensagem, retorno, imovel, origem }.
  // Pode ser um Worker/Function próprio, o webhook do CRM (RD Station, Pipedrive, HubSpot...) ou um serviço de formulários.
  // Deve responder 2xx em caso de sucesso. Enquanto estiver vazio, o envio é simulado no navegador.
  leadsEndpoint: '',

  // Imóveis: GET que devolve uma lista no mesmo formato de js/dados.js (IMOVEIS). Vazio = usa os dados locais.
  imoveisEndpoint: '',
};

// Métricas: liga os eventos do site ao Google Tag Manager / GA4 se existir um dataLayer na página.
function rastrear(evento, dados) {
  if (window.dataLayer) window.dataLayer.push(Object.assign({ event: evento }, dados || {}));
}
