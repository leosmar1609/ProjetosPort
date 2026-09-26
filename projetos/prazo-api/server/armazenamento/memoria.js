// guarda tudo na memória do processo. bom pra rodar local e nos testes, mas some quando o servidor reinicia
export function criarArmazenamentoMemoria() {
  const chaves = [];
  const uso = new Map();

  return {
    nome: 'memoria',

    async criarChave({ email, hash, prefixo, plano }) {
      const chave = { id: chaves.length + 1, email, hash, prefixo, plano, ativa: true, criada_em: new Date().toISOString() };
      chaves.push(chave);
      return chave;
    },

    async contarChavesDoEmail(email) {
      return chaves.filter((c) => c.email === email && c.ativa).length;
    },

    async buscarChavePorHash(hash) {
      return chaves.find((c) => c.hash === hash && c.ativa) || null;
    },

    // soma 1 no contador do dia e devolve o total
    async registrarUso(identificador, dia) {
      const chave = `${identificador}|${dia}`;
      const total = (uso.get(chave) || 0) + 1;
      uso.set(chave, total);
      return total;
    },

    async consultarUso(identificador, dia) {
      return uso.get(`${identificador}|${dia}`) || 0;
    },
  };
}
