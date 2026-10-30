// Estende o app.json. Só muda algo no build da demonstração do portfólio,
// que precisa saber que vai morar numa subpasta do site (ex.: /demos/delicias-da-neide).
module.exports = ({ config }) => ({
  ...config,
  experiments: {
    ...config.experiments,
    ...(process.env.EXPO_BASE_URL ? { baseUrl: process.env.EXPO_BASE_URL } : {}),
  },
});
