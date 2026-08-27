import { defineConfig, devices } from '@playwright/test'

const port = process.env.LUMEN_INTERACTIONS_PORT ?? '4324'
const baseURL = `http://127.0.0.1:${port}`

const requestedBrowsers = process.env.LUMEN_INTERACTION_BROWSERS
  ?.split(',')
  .map(browser => browser.trim())
  .filter(Boolean)

const browserNames = requestedBrowsers ?? (
  process.platform === 'darwin' && !process.env.CI
    ? ['chromium', 'webkit', 'mobile-chromium', 'mobile-webkit']
    : ['chromium', 'firefox', 'webkit', 'mobile-chromium', 'mobile-webkit']
)

const browserDevices = {
  chromium: devices['Desktop Chrome'],
  firefox: devices['Desktop Firefox'],
  webkit: devices['Desktop Safari'],
  'mobile-chromium': devices['Pixel 7'],
  'mobile-webkit': devices['iPhone 15']
} as const

const projects = browserNames.map(name => {
  if (!(name in browserDevices)) {
    throw new Error(`Unsupported LUMEN_INTERACTION_BROWSERS entry: ${name}`)
  }

  const browserName = name as keyof typeof browserDevices

  return {
    name: browserName,
    use: {
      ...browserDevices[browserName],
      launchOptions: { timeout: 15_000 }
    }
  }
})

export default defineConfig({
  forbidOnly: Boolean(process.env.CI),
  fullyParallel: true,
  projects,
  grep: /\b(?:Calendar navigates|CodeTabs switches|Combobox filters|DataTable sorts|Dialog opens|Mentions filters|Resizable changes|Select commits|Tabs switches|Tooltip opens)/,
  reporter: process.env.CI ? 'github' : 'list',
  retries: process.env.CI ? 2 : 0,
  testDir: './tests/a11y',
  testMatch: 'component-interactions.spec.ts',
  workers: 2,
  use: {
    baseURL
  },
  webServer: {
    command: `pnpm --filter @santi020k/lumen-icons-brand... run build && pnpm --filter @santi020k/lumen-react run build && pnpm --filter @santi020k/lumen-elements run build && LUMEN_DOCS_OUT_DIR=.astro/interactions-dist-${port} pnpm --filter @santi020k/lumen-docs exec astro build && ASTRO_PREVIEW_BACKGROUND=0 LUMEN_DOCS_OUT_DIR=.astro/interactions-dist-${port} pnpm --filter @santi020k/lumen-docs exec astro preview --host 127.0.0.1 --port ${port}`,
    reuseExistingServer: false,
    url: baseURL
  }
})
