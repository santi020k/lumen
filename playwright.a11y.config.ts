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
    timeout: 240_000,
    command: `LUMEN_DOCS_OUT_DIR=.astro/a11y-dist-${port} node apps/docs/node_modules/astro/bin/astro.mjs preview --root apps/docs --ignore-lock --host 127.0.0.1 --port ${port}`,
    gracefulShutdown: { signal: 'SIGTERM', timeout: 5_000 },
    reuseExistingServer: false,
    url: baseURL
  }
})
