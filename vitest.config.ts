import { fileURLToPath } from 'node:url'

import { defineConfig, defineProject } from 'vitest/config'

const root = fileURLToPath(new URL('.', import.meta.url))

const alias = {
  '@santi020k/lumen': fileURLToPath(new URL('./packages/lumen/src/index.ts', import.meta.url)),
  '@santi020k/lumen-core': fileURLToPath(new URL('./packages/core/src/index.ts', import.meta.url)),
  '@santi020k/lumen-elements': fileURLToPath(new URL('./packages/elements/src/index.ts', import.meta.url)),
  '@santi020k/lumen-react': fileURLToPath(new URL('./packages/react/src/index.ts', import.meta.url))
}

const coverageReporters = process.env.CI ? ['text', 'lcov'] : ['text', 'html']

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
      defineProject({
        test: {
          environment: 'node',
          include: ['src/**/*.test.ts'],
          name: 'core',
          root: `${root}/packages/core`
        }
      }),
      defineProject({
        resolve: {
          alias
        },
        test: {
          environment: 'node',
          include: ['src/**/*.test.ts'],
          name: 'lumen',
          root: `${root}/packages/lumen`
        }
      }),
      defineProject({
        resolve: {
          alias
        },
        test: {
          environment: 'node',
          include: ['src/**/*.test.ts'],
          name: 'react',
          root: `${root}/packages/react`
        }
      }),
      defineProject({
        resolve: {
          alias
        },
        test: {
          environment: 'jsdom',
          include: ['src/**/*.test.ts'],
          name: 'elements',
          root: `${root}/packages/elements`
        }
      }),
      defineProject({
        resolve: {
          alias
        },
        test: {
          environment: 'node',
          include: ['*.test.ts'],
          name: 'astro',
          root: `${root}/packages/astro`
        }
      }),
      defineProject({
        resolve: {
          alias
        },
        test: {
          environment: 'node',
          include: ['src/**/*.test.ts'],
          name: 'docs',
          passWithNoTests: true,
          root: `${root}/apps/docs`
        }
      })
    ],
    restoreMocks: true
  }
})
