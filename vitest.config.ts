import { fileURLToPath } from 'node:url'

import type { TestProjectConfiguration } from 'vitest/config'
import { defineConfig } from 'vitest/config'

const root = fileURLToPath(new URL('.', import.meta.url))

const alias = {
  '@santi020k/lumen': fileURLToPath(new URL('./packages/lumen/src/index.ts', import.meta.url)),
  '@santi020k/lumen-core': fileURLToPath(new URL('./packages/core/src/index.ts', import.meta.url)),
  '@santi020k/lumen-elements': fileURLToPath(new URL('./packages/elements/src/index.ts', import.meta.url)),
  '@santi020k/lumen-icons-brand': fileURLToPath(new URL('./packages/icons-brand/src/index.ts', import.meta.url)),
  '@santi020k/lumen-react': fileURLToPath(new URL('./packages/react/src/index.ts', import.meta.url)),
  '@santi020k/lumen-react-hook-form': fileURLToPath(new URL('./packages/react-hook-form/src/index.ts', import.meta.url))
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
      reportsDirectory: 'coverage',
      thresholds: {
        branches: 55,
        functions: 63,
        lines: 61,
        statements: 58
      }
    },
    includeTaskLocation: true,
    projects: [
      project('core', 'packages/core'),
      project('lumen', 'packages/lumen'),
      project('mcp', 'packages/mcp'),
      project('react', 'packages/react'),
      project('react-hook-form', 'packages/react-hook-form'),
      project('elements', 'packages/elements', { environment: 'jsdom' }),
      project('icons-brand', 'packages/icons-brand'),
      project('astro', 'packages/astro', { include: ['*.test.ts'] }),
      project('templates', 'packages/templates'),
      project('next-smoke', 'apps/next-smoke', { passWithNoTests: true }),
      project('template-showcase', 'apps/templates', { passWithNoTests: true }),
      project('docs', 'apps/docs', { passWithNoTests: true })
    ],
    restoreMocks: true
  }
})
