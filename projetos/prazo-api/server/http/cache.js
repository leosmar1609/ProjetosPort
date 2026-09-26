// cache simples em memória: guarda as 1000 respostas mais recentes
const MAXIMO = 1000;
const itens = new Map();

// se já calculei essa pergunta devolvo pronta, se não calculo e guardo. o delete + set joga o item pro fim da fila (usado agora)
export function comCache(chave, calcular) {
  if (itens.has(chave)) {
    const valor = itens.get(chave);
    itens.delete(chave);
    itens.set(chave, valor);
    return { valor, acerto: true };
  }
  const valor = calcular();
  itens.set(chave, valor);
  if (itens.size > MAXIMO) itens.delete(itens.keys().next().value);
  return { valor, acerto: false };
}

// os testes usam pra começar do zero
export function limparCache() {
  itens.clear();
}
