import { defineConfig, devices } from '@playwright/test'

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
  use: {
    baseURL: 'http://localhost:4321'
  },
  webServer: {
    command: 'pnpm run docs:dev',
    reuseExistingServer: !process.env.CI,
    url: 'http://localhost:4321'
  }
})
