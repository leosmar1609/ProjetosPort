import express from 'express';
import { parametros } from '../http/validacao.js';
import { ErroApi } from '../http/erros.js';
import { comCache } from '../http/cache.js';
import { limitar } from '../middleware/limite.js';
import { paraIso, paraBr, nomeDiaSemana, somarDias, diferencaEmDias, hoje, anoDe } from '../dominio/datas.js';
import { UFS, feriadosDoAno, emUf, ANO_MINIMO, ANO_MAXIMO } from '../dominio/feriados.js';
import { avaliarDia, proximoDiaUtil, somarDiasUteis, contarDiasUteis, feriadosNoPeriodo } from '../dominio/calendario.js';

// rotas de calendário: prazo, dias úteis, dia útil, feriados e UFs
const rotas = express.Router();

// valores aceitos em pontos_facultativos e o período máximo do /dias-uteis (2 anos)
const PONTOS_FACULTATIVOS = ['folga', 'util'];
const INTERVALO_MAXIMO_DIAS = 731;

// responde usando o cache e avisa no header se veio pronto (HIT) ou foi calculado agora (MISS)
function responder(res, partesDaChave, calcular) {
  const { valor, acerto } = comCache(JSON.stringify(partesDaChave), calcular);
  res.set('X-Cache', acerto ? 'HIT' : 'MISS');
  res.json(valor);
}

// ajudantes pra montar as frases da explicação
const plural = (n, um, varios) => `${n} ${n === 1 ? um : varios}`;
const local = (uf) => (uf ? emUf(uf) : 'no Brasil (só feriados nacionais)');
const dataPorExtenso = (t) => `${paraBr(t)} (${nomeDiaSemana(t)})`;
const avisoSemUf = (uf) => (uf ? '' : ' Envie "uf" para incluir os feriados estaduais.');

// GET /v1/prazo?inicio=2026-09-24&dias=15&uf=SP -> data final depois de somar os dias úteis
rotas.get('/prazo', limitar, (req, res) => {
  const p = parametros(req.query, ['inicio', 'dias', 'uf', 'pontos_facultativos']);
  const inicio = p.data('inicio', { obrigatorio: true });
  const dias = p.inteiro('dias', { obrigatorio: true, min: -365, max: 365, diferenteDeZero: true, exemplo: '15' });
  const uf = p.uf();
  const pontosFacultativos = p.opcao('pontos_facultativos', PONTOS_FACULTATIVOS, 'folga');

  responder(res, ['prazo', inicio, dias, uf, pontosFacultativos], () => {
    const opcoes = { pontosFacultativos };
    const final = somarDiasUteis(inicio, dias, uf, opcoes);
    const feriados = feriadosNoPeriodo(somarDias(inicio, Math.sign(dias)), final, uf, opcoes);
    const pulados = feriados.filter((f) => f.afetou_contagem);

    const quantidade = plural(Math.abs(dias), 'dia útil', 'dias úteis');
    const sentido = dias > 0 ? 'depois de' : 'antes de';
    const verbo = Math.abs(dias) === 1 ? 'cai' : 'caem';
    let explicacao = `${quantidade} ${sentido} ${dataPorExtenso(inicio)}, ${local(uf)}, ${verbo} em ${dataPorExtenso(final)}. O dia inicial não entra na contagem.`;
    if (pulados.length) {
      const nomes = pulados.map((f) => `${paraBr(Date.parse(f.data))} ${f.nome}`).join('; ');
      explicacao += ` ${pulados.length === 1 ? 'Um feriado foi pulado' : `${pulados.length} feriados foram pulados`}: ${nomes}.`;
    }
    explicacao += avisoSemUf(uf);

    return {
      explicacao,
      inicio: paraIso(inicio),
      dias_uteis: dias,
      uf,
      pontos_facultativos: pontosFacultativos,
      data_final: paraIso(final),
      dia_semana_final: nomeDiaSemana(final),
      dias_corridos: Math.abs(diferencaEmDias(inicio, final)),
      feriados_no_periodo: feriados,
    };
  });
});

// GET /v1/dias-uteis?inicio=2026-11-01&fim=2026-12-31&uf=SP -> quantos dias úteis tem no período
rotas.get('/dias-uteis', limitar, (req, res) => {
  const p = parametros(req.query, ['inicio', 'fim', 'uf', 'pontos_facultativos']);
  const inicio = p.data('inicio', { obrigatorio: true });
  const fim = p.data('fim', { obrigatorio: true });
  const uf = p.uf();
  const pontosFacultativos = p.opcao('pontos_facultativos', PONTOS_FACULTATIVOS, 'folga');

  if (fim < inicio) {
    throw new ErroApi(422, 'periodo_invertido', `"fim" (${paraBr(fim)}) vem antes de "inicio" (${paraBr(inicio)}). Troque as datas de lugar.`, { campo: 'fim' });
  }
  if (diferencaEmDias(inicio, fim) > INTERVALO_MAXIMO_DIAS) {
    throw new ErroApi(422, 'periodo_muito_longo', 'O período máximo é de 2 anos. Divida a consulta em partes menores.', { campo: 'fim' });
  }

  responder(res, ['dias-uteis', inicio, fim, uf, pontosFacultativos], () => {
    const opcoes = { pontosFacultativos };
    const c = contarDiasUteis(inicio, fim, uf, opcoes);
    const outros = c.corridos - c.uteis;
    let explicacao = `De ${paraBr(inicio)} a ${paraBr(fim)}, ${local(uf)}, há ${plural(c.uteis, 'dia útil', 'dias úteis')} em ${plural(c.corridos, 'dia corrido', 'dias corridos')}, contando as duas pontas.`;
    if (outros) explicacao += ` Os outros ${outros} são ${c.finsDeSemana} de fim de semana e ${c.feriados} de feriado.`;
    explicacao += avisoSemUf(uf);

    return {
      explicacao,
      inicio: paraIso(inicio),
      fim: paraIso(fim),
      uf,
      pontos_facultativos: pontosFacultativos,
      dias_corridos: c.corridos,
      dias_uteis: c.uteis,
      dias_nao_uteis: { fim_de_semana: c.finsDeSemana, feriado: c.feriados },
      feriados_no_periodo: feriadosNoPeriodo(inicio, fim, uf, opcoes),
    };
  });
});

// GET /v1/dia-util?data=2026-10-12&uf=SP -> se é útil, o motivo e o próximo dia útil
rotas.get('/dia-util', limitar, (req, res) => {
  const p = parametros(req.query, ['data', 'uf', 'pontos_facultativos']);
  const data = p.data('data', { padrao: 'hoje' });
  const uf = p.uf();
  const pontosFacultativos = p.opcao('pontos_facultativos', PONTOS_FACULTATIVOS, 'folga');

  responder(res, ['dia-util', data, uf, pontosFacultativos], () => {
    const opcoes = { pontosFacultativos };
    const dia = avaliarDia(data, uf, opcoes);
    const proximo = proximoDiaUtil(data, uf, opcoes);

    let explicacao;
    if (dia.util) {
      explicacao = `${dataPorExtenso(data)} é dia útil ${local(uf)}.`;
      if (dia.feriado?.meio_periodo) explicacao += ` É ${dia.feriado.nome}, com expediente a partir das 14h.`;
      else if (dia.feriado) explicacao += ` É ${dia.feriado.nome}, ponto facultativo tratado como útil porque pontos_facultativos=util.`;
    } else {
      explicacao = `${dataPorExtenso(data)} não é dia útil ${local(uf)}: ${dia.motivo}. O próximo dia útil é ${dataPorExtenso(proximo)}.`;
    }
    explicacao += avisoSemUf(uf);

    return {
      explicacao,
      data: paraIso(data),
      dia_semana: nomeDiaSemana(data),
      uf,
      pontos_facultativos: pontosFacultativos,
      dia_util: dia.util,
      motivo: dia.motivo,
      proximo_dia_util: paraIso(proximo),
      feriados_no_periodo: feriadosNoPeriodo(data, proximo, uf, opcoes),
    };
  });
});

// tipos que dá pra filtrar em /feriados
const TIPOS = ['nacional', 'estadual', 'ponto_facultativo'];

// GET /v1/feriados?ano=2026&uf=RJ -> feriados e pontos facultativos do ano
rotas.get('/feriados', limitar, (req, res) => {
  const p = parametros(req.query, ['ano', 'uf', 'tipo']);
  const ano = p.inteiro('ano', { padrao: anoDe(hoje()), min: ANO_MINIMO, max: ANO_MAXIMO, exemplo: '2026' });
  const uf = p.uf();
  const tipo = p.opcao('tipo', TIPOS, null);

  responder(res, ['feriados', ano, uf, tipo], () => {
    const todos = feriadosDoAno(ano, uf);
    const feriados = tipo ? todos.filter((f) => f.tipo === tipo) : todos;
    const conta = (t) => todos.filter((f) => f.tipo === t).length;

    const partes = [plural(conta('nacional'), 'feriado nacional', 'feriados nacionais')];
    if (uf) partes.push(plural(conta('estadual'), 'estadual', 'estaduais'));
    partes.push(plural(conta('ponto_facultativo'), 'ponto facultativo', 'pontos facultativos'));
    const lista = partes.length === 3 ? `${partes[0]}, ${partes[1]} e ${partes[2]}` : `${partes[0]} e ${partes[1]}`;
    let explicacao = `Em ${ano}, ${local(uf)}, são ${lista}.`;
    if (tipo) explicacao += ` Mostrando só "${tipo}": ${feriados.length}.`;
    explicacao += avisoSemUf(uf);

    return { explicacao, ano, uf, tipo, total: feriados.length, feriados };
  });
});

// GET /v1/feriados/proximos?uf=SP&quantidade=5 -> próximos feriados a partir de hoje
rotas.get('/feriados/proximos', limitar, (req, res) => {
  const p = parametros(req.query, ['uf', 'quantidade', 'a_partir_de']);
  const uf = p.uf();
  const quantidade = p.inteiro('quantidade', { padrao: 5, min: 1, max: 20, exemplo: '5' });
  const aPartirDe = p.data('a_partir_de', { padrao: 'hoje' });

  responder(res, ['proximos', uf, quantidade, aPartirDe], () => {
    const ano = anoDe(aPartirDe);
    const inicioIso = paraIso(aPartirDe);
    const feriados = [ano, ano + 1, ano + 2]
      .filter((a) => a <= ANO_MAXIMO)
      .flatMap((a) => feriadosDoAno(a, uf))
      .filter((f) => f.data >= inicioIso)
      .slice(0, quantidade)
      .map((f) => ({ ...f, dias_ate: diferencaEmDias(aPartirDe, Date.parse(f.data)) }));

    const primeiro = feriados[0];
    let explicacao = 'Nenhum feriado encontrado depois dessa data dentro do intervalo coberto pela API.';
    if (primeiro) {
      const quando = primeiro.dias_ate === 0 ? 'é hoje' : `daqui a ${plural(primeiro.dias_ate, 'dia', 'dias')}`;
      explicacao = `O próximo, ${local(uf)}, é ${primeiro.nome} em ${dataPorExtenso(Date.parse(primeiro.data))}, ${quando}.${avisoSemUf(uf)}`;
    }

    return { explicacao, a_partir_de: inicioIso, uf, quantidade: feriados.length, feriados };
  });
});

// GET /v1/ufs -> UFs aceitas e os feriados estaduais de cada uma
rotas.get('/ufs', (req, res) => {
  parametros(req.query, []);
  const ufs = Object.entries(UFS).map(([sigla, { nome, feriados }]) => ({
    sigla,
    nome,
    feriados_estaduais: feriados.map((f) => {
      const [mes, dia] = f.dia.split('-').map(Number);
      return { dia, mes, nome: f.nome, ...(f.ate ? { valido_ate: f.ate } : {}) };
    }),
  }));
  res.json({ explicacao: `${ufs.length} unidades da federação. Use a sigla no parâmetro "uf" das outras rotas.`, total: ufs.length, ufs });
});

export default rotas;
