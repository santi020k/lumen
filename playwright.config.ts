import { defineConfig, devices } from '@playwright/test'

/**
 * Visual regression suite for the docs component gallery.
 * First run: pnpm exec playwright install chromium && pnpm run test:visual:update
 */
export default defineConfig({
  expect: {
    toHaveScreenshot: {
      animations: 'disabled',
      maxDiffPixelRatio: 0.02
    }
  },
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
  testDir: './tests/visual',
  workers: 2,
  use: {
    baseURL: 'http://127.0.0.1:4322'
  },
  webServer: {
    command: 'pnpm --filter @santi020k/lumen-docs exec astro build && pnpm --filter @santi020k/lumen-docs exec astro preview --host 127.0.0.1 --port 4322',
    reuseExistingServer: false,
    url: 'http://127.0.0.1:4322'
  }
})
