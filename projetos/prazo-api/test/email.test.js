// testes da validação de e-mail
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { problemaNoEmail } from '../server/http/email.js';

test('aceita e-mails comuns', () => {
  for (const email of ['voce@exemplo.com', 'leo.souza@empresa.com.br', 'nome+tag@gmail.com', 'a_b-c@sub.dominio.io']) {
    assert.equal(problemaNoEmail(email), null, email);
  }
});

test('recusa e-mails quebrados com a mensagem certa', () => {
  assert.match(problemaNoEmail(''), /Informe/);
  assert.match(problemaNoEmail('voce exemplo@x.com'), /espaços/);
  assert.match(problemaNoEmail('voce.exemplo.com'), /um @/);
  assert.match(problemaNoEmail('voce@@exemplo.com'), /um @/);
  assert.match(problemaNoEmail('@exemplo.com'), /antes do @/);
  assert.match(problemaNoEmail('voce@exemplo'), /domínio/);
  assert.match(problemaNoEmail('.voce@exemplo.com'), /lugar errado/);
  assert.match(problemaNoEmail('voce.@exemplo.com'), /lugar errado/);
  assert.match(problemaNoEmail('vo..ce@exemplo.com'), /lugar errado/);
  assert.match(problemaNoEmail('voce@exemplo.c'), /lugar errado/);
  assert.match(problemaNoEmail('voce@-exemplo.com'), /lugar errado/);
});
