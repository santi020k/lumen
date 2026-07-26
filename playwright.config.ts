import { defineConfig, devices } from '@playwright/test'

const port = process.env.LUMEN_VISUAL_PORT ?? '4322'
const baseURL = `http://127.0.0.1:${port}`

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
    baseURL
  },
  webServer: {
    command: `pnpm --filter @santi020k/lumen-icons-brand run build && LUMEN_DOCS_OUT_DIR=.astro/visual-dist-${port} pnpm --filter @santi020k/lumen-docs exec astro build && LUMEN_DOCS_OUT_DIR=.astro/visual-dist-${port} pnpm --filter @santi020k/lumen-docs exec astro preview --host 127.0.0.1 --port ${port}`,
    reuseExistingServer: false,
    url: baseURL
  }
})
