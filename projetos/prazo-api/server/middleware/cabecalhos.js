// libera a API pra ser chamada de qualquer site e deixa o navegador ler os headers de limite e de cache
export function cors(req, res, next) {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Authorization, X-Api-Key, Content-Type');
  res.set('Access-Control-Expose-Headers', 'X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset, X-Cache, X-Response-Time, Retry-After');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
}

// mede quanto o servidor levou e manda no header X-Response-Time
export function tempoDeResposta(req, res, next) {
  const inicio = process.hrtime.bigint();
  const jsonOriginal = res.json.bind(res);
  res.json = (corpo) => {
    const ms = Number(process.hrtime.bigint() - inicio) / 1e6;
    res.set('X-Response-Time', `${ms.toFixed(2)}ms`);
    return jsonOriginal(corpo);
  };
  next();
}
