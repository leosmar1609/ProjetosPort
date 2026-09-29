document.documentElement.classList.add('js');

var yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

// Menu mobile
var navToggle = document.getElementById('navToggle');
var navRight = document.getElementById('navRight');
if (navToggle && navRight) {
  navToggle.addEventListener('click', function () {
    var isOpen = navRight.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  });
  navRight.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', function () {
      navRight.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
    });
  });
}

// Animação de entrada ao rolar a página
var io = ('IntersectionObserver' in window) ? new IntersectionObserver(function (entries) {
  entries.forEach(function (entry) {
    if (entry.isIntersecting) {
      entry.target.classList.add('in-view');
      io.unobserve(entry.target);
    }
  });
}, { threshold: 0.14, rootMargin: '0px 0px -60px 0px' }) : null;

document.querySelectorAll('.reveal').forEach(function (el) {
  if (io) { io.observe(el); } else { el.classList.add('in-view'); }
});

// Botão "Enviar pelo WhatsApp" do formulário de orçamento
var WHATSAPP_NUMBER = '5511979934136';
var form = document.getElementById('quote-form');
if (form) {
  form.addEventListener('submit', function (ev) {
    ev.preventDefault();
    var data = new FormData(form);
    var msg = 'Olá! Vim pelo site da Cadência e quero um orçamento.\n\n' +
      'Nome: ' + data.get('nome') + '\n' +
      'Contato: ' + data.get('contato') + '\n' +
      'Tipo de projeto: ' + data.get('tipo') + '\n' +
      'Prazo desejado: ' + data.get('prazo') + '\n' +
      'Sobre o projeto: ' + data.get('descricao');
    var url = 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(msg);
    window.open(url, '_blank', 'noopener');
  });
}
