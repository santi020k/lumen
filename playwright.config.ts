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
  use: {
    baseURL: 'http://localhost:4321'
  },
  webServer: {
    command: 'pnpm run docs:dev',
    reuseExistingServer: !process.env.CI,
    url: 'http://localhost:4321'
  }
})
