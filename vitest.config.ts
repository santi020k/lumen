import { fileURLToPath } from 'node:url'

import type { TestProjectConfiguration } from 'vitest/config'
import { defineConfig } from 'vitest/config'

const root = fileURLToPath(new URL('.', import.meta.url))

const alias = {
  '@santi020k/lumen': fileURLToPath(new URL('./packages/lumen/src/index.ts', import.meta.url)),
  '@santi020k/lumen-core': fileURLToPath(new URL('./packages/core/src/index.ts', import.meta.url)),
  '@santi020k/lumen-elements': fileURLToPath(new URL('./packages/elements/src/index.ts', import.meta.url)),
  '@santi020k/lumen-react': fileURLToPath(new URL('./packages/react/src/index.ts', import.meta.url))
}

const coverageReporters = process.env.CI ? ['text', 'lcov'] : ['text', 'html']

const project = (
  name: string,
  path: string,
  overrides: Record<string, unknown> = {}
): TestProjectConfiguration => ({
  extends: true,
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    name,
    root: `${root}/${path}`,
    ...overrides
  }
})

export default defineConfig({
  resolve: {
    alias
  },
  test: {
    coverage: {
      exclude: [
        '**/*.test.ts',
        '**/*.d.ts',
        '**/dist/**',
        '**/.astro/**',
        'apps/docs/**',
        'packages/astro/components/**'
      ],
      provider: 'v8',
      reporter: coverageReporters,
      reportsDirectory: 'coverage'
    },
    includeTaskLocation: true,
    projects: [
      project('core', 'packages/core'),
      project('lumen', 'packages/lumen'),
      project('react', 'packages/react'),
      project('elements', 'packages/elements', { environment: 'jsdom' }),
      project('astro', 'packages/astro', { include: ['*.test.ts'] }),
      project('docs', 'apps/docs', { passWithNoTests: true })
    ],
    restoreMocks: true
  }
})
