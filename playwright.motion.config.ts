import { defineConfig, devices } from '@playwright/test'

const port = process.env.LUMEN_MOTION_PORT ?? '4349'
const baseURL = `http://127.0.0.1:${port}`

export default defineConfig({
  forbidOnly: Boolean(process.env.CI),
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'mobile-chromium', use: { ...devices['Pixel 7'] } }
  ],
  reporter: process.env.CI ? 'github' : 'list',
  testDir: './tests/motion',
  workers: 2,
  use: { baseURL },
  webServer: {
    command: `pnpm --filter @santi020k/lumen-icons-brand... run build && pnpm --filter @santi020k/lumen-react run build && pnpm --filter @santi020k/lumen-elements run build && pnpm --filter @santi020k/lumen-docs exec astro dev --host 127.0.0.1 --port ${port}`,
    gracefulShutdown: { signal: 'SIGTERM', timeout: 5_000 },
    reuseExistingServer: !process.env.CI,
    url: baseURL
  }
})
