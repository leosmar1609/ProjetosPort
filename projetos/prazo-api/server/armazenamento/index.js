import { config } from '../config.js';
import { criarArmazenamentoMemoria } from './memoria.js';
import { criarArmazenamentoMysql } from './mysql.js';

// escolhe onde guardar chaves e uso (memória ou MySQL) conforme o .env. as rotas não sabem qual está sendo usado
let promessa = null;

export function armazenamento() {
  if (!promessa) {
    promessa = config.armazenamento === 'mysql'
      ? criarArmazenamentoMysql(config.db)
      : Promise.resolve(criarArmazenamentoMemoria());
  }
  return promessa;
}

// os testes usam pra trocar por um armazenamento novo e vazio
export function definirArmazenamento(novo) {
  promessa = Promise.resolve(novo);
}
