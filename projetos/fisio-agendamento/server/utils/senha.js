import bcrypt from 'bcryptjs';

export function gerarHash(senha) {
  return bcrypt.hashSync(senha, 10);
}

export function conferir(senha, hash) {
  return bcrypt.compareSync(senha, hash);
}
