import baseConfig from './playwright.config'

export default {
  ...baseConfig,
  use: {
    ...baseConfig.use,
    baseURL: 'http://127.0.0.1:44324'
  },
  webServer: {
    ...baseConfig.webServer,
    url: 'http://127.0.0.1:44324',
    command: 'pnpm --filter @santi020k/lumen-docs exec astro build && pnpm --filter @santi020k/lumen-docs exec astro preview --host 127.0.0.1 --port 44324'
  }
}
