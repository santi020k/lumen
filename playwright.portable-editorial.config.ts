import { defineConfig, devices } from '@playwright/test'

const port = process.env.LUMEN_PORTABLE_EDITORIAL_PORT ?? '4386'

export default defineConfig({
  forbidOnly: Boolean(process.env.CI),
  fullyParallel: true,
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } }
  ],
  reporter: 'list',
  testDir: './tests/editorial',
  testMatch: 'portable.spec.ts',
  workers: 2,
  use: { reducedMotion: 'reduce', baseURL: `http://127.0.0.1:${port}` },
  webServer: {
    command: `node node_modules/vite/bin/vite.js preview .cache/portable-editorial-consumer --host 127.0.0.1 --port ${port}`,
    reuseExistingServer: !process.env.CI,
    url: `http://127.0.0.1:${port}/react.html`
  }
})
