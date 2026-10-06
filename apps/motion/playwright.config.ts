import { defineConfig } from '@playwright/test'

const port = process.env.LUMEN_MOTION_PORT ?? '4341'
const baseURL = `http://127.0.0.1:${port}`

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  workers: 1,
  use: { baseURL, browserName: 'chromium' },
  webServer: {
    command: `pnpm exec astro preview --ignore-lock --host 127.0.0.1 --port ${port}`,
    url: baseURL,
    reuseExistingServer: false
  }
})
