import { defineConfig, devices } from '@playwright/test'

const port = process.env.LUMEN_EDITORIAL_PORT ?? '4356'
const baseURL = `http://127.0.0.1:${port}`

export default defineConfig({
  forbidOnly: Boolean(process.env.CI),
  fullyParallel: true,
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } }
  ],
  reporter: 'list',
  testDir: './tests/editorial',
  testMatch: ['editorial.spec.ts', 'reading-controls.spec.ts'],
  use: { baseURL },
  workers: 2,
  webServer: {
    command: `node apps/templates/node_modules/astro/bin/astro.mjs preview --root .cache/editorial-consumer --ignore-lock --host 127.0.0.1 --port ${port}`,
    reuseExistingServer: !process.env.CI,
    url: baseURL
  }
})
