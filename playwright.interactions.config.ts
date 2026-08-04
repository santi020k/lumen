import { defineConfig, devices } from '@playwright/test'

const port = process.env.LUMEN_INTERACTIONS_PORT ?? '4324'
const baseURL = `http://127.0.0.1:${port}`

export default defineConfig({
  forbidOnly: Boolean(process.env.CI),
  fullyParallel: true,
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] }
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] }
    }
  ],
  grep: /\b(?:Calendar navigates|CodeTabs switches|Combobox filters|DataTable sorts|Dialog opens|Mentions filters|Resizable changes|Select commits|Tabs switches|Tooltip opens)/,
  reporter: process.env.CI ? 'github' : 'list',
  retries: process.env.CI ? 2 : 0,
  testDir: './tests/a11y',
  testMatch: 'component-interactions.spec.ts',
  workers: 2,
  use: {
    baseURL
  },
  webServer: {
    command: `pnpm --filter @santi020k/lumen-icons-brand... run build && LUMEN_DOCS_OUT_DIR=.astro/interactions-dist-${port} pnpm --filter @santi020k/lumen-docs exec astro build && LUMEN_DOCS_OUT_DIR=.astro/interactions-dist-${port} pnpm --filter @santi020k/lumen-docs exec astro preview --host 127.0.0.1 --port ${port}`,
    reuseExistingServer: false,
    url: baseURL
  }
})
