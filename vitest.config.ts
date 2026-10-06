import { fileURLToPath } from 'node:url'

import type { TestProjectConfiguration } from 'vitest/config'
import { defineConfig } from 'vitest/config'

const root = fileURLToPath(new URL('.', import.meta.url))

const alias = {
  '@santi020k/lumen-core/image-comparison': fileURLToPath(new URL('./packages/core/src/image-comparison.ts', import.meta.url)),
  '@santi020k/lumen-core/tokens': fileURLToPath(new URL('./packages/core/src/tokens.ts', import.meta.url)),
  '@santi020k/lumen-core/virtual-list': fileURLToPath(new URL('./packages/core/src/virtual-list.ts', import.meta.url)),
  '@santi020k/lumen-core/virtual-window': fileURLToPath(new URL('./packages/core/src/virtual-window.ts', import.meta.url)),
  '@santi020k/lumen-core/icon-data': fileURLToPath(new URL('./packages/core/src/icon-data.generated.ts', import.meta.url)),
  '@santi020k/lumen-core/world-map-zoom': fileURLToPath(new URL('./packages/core/src/world-map-zoom.ts', import.meta.url)),
  '@santi020k/lumen-core/world-map-data': fileURLToPath(new URL('./packages/core/src/world-map-data.generated.ts', import.meta.url)),
  '@santi020k/lumen-core/world-map': fileURLToPath(new URL('./packages/core/src/world-map.ts', import.meta.url)),
  '@santi020k/lumen': fileURLToPath(new URL('./packages/lumen/src/index.ts', import.meta.url)),
  '@santi020k/lumen-core': fileURLToPath(new URL('./packages/core/src/index.ts', import.meta.url)),
  '@santi020k/lumen-elements': fileURLToPath(new URL('./packages/elements/src/index.ts', import.meta.url)),
  '@santi020k/lumen-icons-brand': fileURLToPath(new URL('./packages/icons-brand/src/index.ts', import.meta.url)),
  '@santi020k/lumen-react': fileURLToPath(new URL('./packages/react/src/index.ts', import.meta.url)),
  '@santi020k/lumen-react-native': fileURLToPath(new URL('./packages/react-native/src/index.ts', import.meta.url)),
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
      project('react', 'packages/react', { include: ['src/**/*.test.ts', 'src/**/*.test.tsx'] }),
      project('react-native', 'packages/react-native', {
        include: ['src/**/*.test.ts', 'src/**/*.test.tsx']
      }),
      project('react-hook-form', 'packages/react-hook-form', {
        include: ['src/**/*.test.ts', 'src/**/*.test.tsx']
      }),
      project('elements', 'packages/elements', { environment: 'jsdom' }),
      project('icons-brand', 'packages/icons-brand'),
      project('astro', 'packages/astro', { include: ['*.test.ts'] }),
      project('templates', 'packages/templates'),
      project('next-smoke', 'apps/next-smoke', { passWithNoTests: true }),
      project('template-showcase', 'apps/templates', { passWithNoTests: true }),
      project('docs', 'apps/docs', { passWithNoTests: true }),
      project('figma-plugin', 'apps/figma-plugin')
    ],
    restoreMocks: true
  }
})
