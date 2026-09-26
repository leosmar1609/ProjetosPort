// erro que eu lanço de propósito. sempre sai no mesmo formato: { erro: { codigo, mensagem, campo... } }
export class ErroApi extends Error {
  constructor(status, codigo, mensagem, detalhes = {}) {
    super(mensagem);
    this.status = status;
    this.codigo = codigo;
    this.detalhes = detalhes;
  }

  paraJson() {
    return { erro: { codigo: this.codigo, mensagem: this.message, ...this.detalhes, documentacao: '/docs' } };
  }
}

// acha a opção mais parecida com o que a pessoa digitou, tipo "inico" -> "inicio"
export function sugerir(texto, opcoes) {
  let melhor = null;
  let menor = Infinity;
  for (const opcao of opcoes) {
    const d = distancia(texto.toLowerCase(), opcao.toLowerCase());
    if (d < menor) {
      menor = d;
      melhor = opcao;
    }
  }
  const tolerancia = Math.max(2, Math.floor(melhor?.length / 3));
  return menor <= tolerancia ? melhor : null;
}

// distância de Levenshtein: quantas letras precisa trocar, tirar ou colocar pra um texto virar o outro
function distancia(a, b) {
  const linha = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let anterior = linha[0];
    linha[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const guardado = linha[j];
      linha[j] = Math.min(linha[j] + 1, linha[j - 1] + 1, anterior + (a[i - 1] === b[j - 1] ? 0 : 1));
      anterior = guardado;
    }
  }
  return linha[b.length];
}
