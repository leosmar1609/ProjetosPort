import { ErroApi, sugerir } from './erros.js';
import { lerTextoData, anoDe } from '../dominio/datas.js';
import { UFS, ANO_MINIMO, ANO_MAXIMO } from '../dominio/feriados.js';

// leitor dos parâmetros da URL. cada rota diz quais aceita e depois usa p.data(), p.inteiro(), p.uf()...
export function parametros(query, permitidos) {
  // parâmetro que não existe vira erro com sugestão, senão "estado=SP" passaria batido e a conta sairia sem o estado
  for (const [nome, valor] of Object.entries(query)) {
    if (!permitidos.includes(nome)) {
      const parecido = sugerir(nome, permitidos);
      throw new ErroApi(422, 'parametro_desconhecido',
        parecido ? `O parâmetro "${nome}" não existe. Você quis dizer "${parecido}"?` : `O parâmetro "${nome}" não existe nesta rota.`,
        { campo: nome, aceitos: permitidos });
    }
    if (Array.isArray(valor) || typeof valor !== 'string') {
      throw new ErroApi(422, 'parametro_repetido', `Envie "${nome}" uma vez só.`, { campo: nome });
    }
  }

  // pega o valor sem espaços. vazio conta como não enviado
  const texto = (nome) => {
    const v = query[nome];
    return v === undefined || v.trim() === '' ? undefined : v.trim();
  };

  // erro padrão de parâmetro obrigatório
  const faltando = (nome, exemplo) =>
    new ErroApi(422, 'parametro_obrigatorio', `Informe o parâmetro "${nome}".`, { campo: nome, exemplo });

  return {
    // lê uma data e confere se está nos anos que a API cobre
    data(nome, { obrigatorio = false, padrao } = {}) {
      const v = texto(nome);
      if (v === undefined) {
        if (obrigatorio) throw faltando(nome, '2026-09-24');
        return padrao === undefined ? undefined : lerTextoData(padrao);
      }
      const t = lerTextoData(v);
      if (t === null) {
        throw new ErroApi(422, 'data_invalida',
          `"${v}" não é uma data válida. Use AAAA-MM-DD, DD/MM/AAAA ou a palavra "hoje".`,
          { campo: nome, recebido: v, exemplo: '2026-09-24' });
      }
      const ano = anoDe(t);
      if (ano < ANO_MINIMO || ano > ANO_MAXIMO) {
        throw new ErroApi(422, 'data_fora_do_intervalo',
          `A API cobre datas de ${ANO_MINIMO} a ${ANO_MAXIMO}. Recebi uma data em ${ano}.`,
          { campo: nome, recebido: v });
      }
      return t;
    },

    // lê um número inteiro e confere se está no intervalo
    inteiro(nome, { obrigatorio = false, padrao, min, max, diferenteDeZero = false, exemplo } = {}) {
      const v = texto(nome);
      if (v === undefined) {
        if (obrigatorio) throw faltando(nome, exemplo);
        return padrao;
      }
      if (!/^-?\d+$/.test(v)) {
        throw new ErroApi(422, 'numero_invalido', `"${nome}" precisa ser um número inteiro, sem vírgula nem ponto.`,
          { campo: nome, recebido: v, exemplo });
      }
      const n = Number(v);
      if (n < min || n > max || (diferenteDeZero && n === 0)) {
        const zero = diferenteDeZero ? ' (e diferente de zero)' : '';
        throw new ErroApi(422, 'numero_fora_do_intervalo', `"${nome}" precisa estar entre ${min} e ${max}${zero}.`,
          { campo: nome, recebido: v, minimo: min, maximo: max });
      }
      return n;
    },

    // lê a UF. se a pessoa escreveu o nome do estado, a mensagem já sugere a sigla certa
    uf(nome = 'uf') {
      const v = texto(nome);
      if (v === undefined) return null;
      const sigla = v.toUpperCase();
      if (UFS[sigla]) return sigla;
      const semAcento = (s) => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
      const porNome = Object.keys(UFS).find((s) => semAcento(UFS[s].nome) === semAcento(v));
      const parecido = porNome || sugerir(sigla, Object.keys(UFS));
      throw new ErroApi(422, 'uf_invalida',
        `"${v}" não é uma UF. Use a sigla de duas letras${parecido ? `, como "${parecido}"` : ''}. A lista completa está em /v1/ufs.`,
        { campo: nome, recebido: v });
    },

    // lê um valor que só pode ser um da lista, tipo "folga" ou "util"
    opcao(nome, valores, padrao) {
      const v = texto(nome);
      if (v === undefined) return padrao;
      const achado = valores.find((x) => x === v.toLowerCase());
      if (achado) return achado;
      throw new ErroApi(422, 'opcao_invalida', `"${nome}" aceita apenas: ${valores.join(', ')}.`,
        { campo: nome, recebido: v, aceitos: valores });
    },
  };
}
