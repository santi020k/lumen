import { defineConfig, devices } from '@playwright/test'

const port = process.env.LUMEN_A11Y_PORT ?? '4323'
const baseURL = `http://127.0.0.1:${port}`

export default defineConfig({
  forbidOnly: Boolean(process.env.CI),
  fullyParallel: true,
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    }
  ],
  reporter: process.env.CI ? 'github' : 'list',
  retries: process.env.CI ? 2 : 0,
  testDir: './tests/a11y',
  workers: 2,
  use: {
    baseURL
  },
  webServer: {
    command: `pnpm --filter @santi020k/lumen-icons-brand... run build && pnpm --filter @santi020k/lumen-react run build && pnpm --filter @santi020k/lumen-elements run build && LUMEN_DOCS_OUT_DIR=.astro/a11y-dist-${port} pnpm --filter @santi020k/lumen-docs exec astro build && LUMEN_DOCS_OUT_DIR=.astro/a11y-dist-${port} node apps/docs/node_modules/astro/bin/astro.mjs preview --root apps/docs --ignore-lock --host 127.0.0.1 --port ${port}`,
    gracefulShutdown: { signal: 'SIGTERM', timeout: 5_000 },
    reuseExistingServer: !process.env.CI,
    url: baseURL
  }
})
