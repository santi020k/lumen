import { defineConfig, devices } from '@playwright/test'

const port = process.env.LUMEN_WORKFLOWS_PORT ?? '4378'
const baseURL = 'http://127.0.0.1:' + port

export default defineConfig({
  forbidOnly: Boolean(process.env.CI),
  fullyParallel: true,
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } }
  ],
  reporter: 'list',
  testDir: './tests/product-workflows',
  use: { baseURL },
  workers: 2,
  webServer: {
    command: 'node apps/docs/node_modules/astro/bin/astro.mjs preview --root .cache/product-workflow-consumer --ignore-lock --host 127.0.0.1 --port ' + port,
    reuseExistingServer: !process.env.CI,
    url: baseURL
  }
})
