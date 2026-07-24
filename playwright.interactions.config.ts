import { defineConfig, devices } from '@playwright/test'

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
  grep: /\b(?:Calendar navigates|Combobox filters|DataTable sorts|Dialog opens|Resizable changes|Select commits|Tabs switches|Tooltip opens)/,
  reporter: process.env.CI ? 'github' : 'list',
  retries: process.env.CI ? 2 : 0,
  testDir: './tests/a11y',
  testMatch: 'component-interactions.spec.ts',
  workers: 2,
  use: {
    baseURL: 'http://127.0.0.1:4324'
  },
  webServer: {
    command: 'pnpm --filter @santi020k/lumen-docs exec astro build && pnpm --filter @santi020k/lumen-docs exec astro preview --host 127.0.0.1 --port 4324',
    reuseExistingServer: false,
    url: 'http://127.0.0.1:4324'
  }
})
