import { defineConfig, devices } from '@playwright/test'

const port = process.env.LUMEN_FRAMEWORK_VISUAL_PORT ?? '4330'
const baseURL = `http://127.0.0.1:${port}`

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
  retries: 0,
  testDir: './tests/frameworks',
  testMatch: 'framework-visual-hosts.spec.ts',
  workers: 2,
  use: {
    baseURL
  },
  webServer: {
    command: `pnpm --filter @santi020k/lumen-react run build && pnpm --filter @santi020k/lumen-elements run build && pnpm --filter @santi020k/lumen-next-smoke run build && pnpm --filter @santi020k/lumen-next-smoke exec next start --hostname 127.0.0.1 --port ${port}`,
    reuseExistingServer: false,
    url: baseURL
  }
})
