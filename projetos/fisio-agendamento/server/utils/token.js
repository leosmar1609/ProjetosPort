import jwt from 'jsonwebtoken';

const SEGREDO = process.env.JWT_SECRET || 'segredo-de-desenvolvimento-troque-em-producao';

export function gerarToken(usuario) {
  return jwt.sign({ tipo: usuario.tipo, nome: usuario.nome }, SEGREDO, {
    subject: String(usuario.id),
    expiresIn: '30d',
  });
}

export function verificarToken(token) {
  return jwt.verify(token, SEGREDO);
}
