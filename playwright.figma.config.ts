import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/figma',
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  use: { baseURL: 'http://127.0.0.1:4761' },
  webServer: [
    {
      command: 'pnpm --filter @santi020k/lumen-figma-plugin exec vite --host 127.0.0.1 --port 4761 --strictPort',
      url: 'http://127.0.0.1:4761',
      reuseExistingServer: !process.env.CI
    },
    {
      command: 'pnpm --filter @santi020k/lumen-figma-plugin run verify:generated && pnpm --filter @santi020k/lumen-figma-plugin exec vite preview --outDir .verification/dist --host 127.0.0.1 --port 4762 --strictPort',
      url: 'http://127.0.0.1:4762',
      timeout: 120_000,
      reuseExistingServer: !process.env.CI
    }
  ]
})
