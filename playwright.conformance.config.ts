import { defineConfig, devices } from '@playwright/test'

const port = process.env.LUMEN_FRAMEWORK_CONFORMANCE_PORT ?? '4331'
const baseURL = `http://127.0.0.1:${port}`

const requestedProjects = process.env.LUMEN_FRAMEWORK_CONFORMANCE_PROJECTS
  ?.split(',')
  .map(project => project.trim())
  .filter(Boolean)

const projectDevices = {
  chromium: devices['Desktop Chrome'],
  firefox: devices['Desktop Firefox'],
  webkit: devices['Desktop Safari'],
  'mobile-chromium': devices['Pixel 7'],
  'mobile-webkit': devices['iPhone 15']
} as const

const projectNames = requestedProjects ?? (
  process.platform === 'darwin' && !process.env.CI
    ? ['chromium', 'webkit', 'mobile-chromium', 'mobile-webkit']
    : Object.keys(projectDevices)
)

const projects = projectNames.map(name => {
  if (!(name in projectDevices)) {
    throw new Error(
      `Unsupported LUMEN_FRAMEWORK_CONFORMANCE_PROJECTS entry: ${name}`
    )
  }

  const projectName = name as keyof typeof projectDevices

  return {
    name: projectName,
    use: {
      ...projectDevices[projectName],
      launchOptions: { timeout: 15_000 }
    }
  }
})

export default defineConfig({
  forbidOnly: Boolean(process.env.CI),
  fullyParallel: true,
  projects,
  reporter: process.env.CI ? 'github' : 'list',
  retries: process.env.CI ? 2 : 0,
  testDir: './tests/frameworks',
  testMatch: 'framework-conformance.spec.ts',
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
