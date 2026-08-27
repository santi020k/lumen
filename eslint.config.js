import { defineConfig } from '@santi020k/eslint-config-basic'

// cspell:words swiftpm
export default defineConfig({
  ignores: ['**/.build/**', '**/.swiftpm/**'],
  projects: {
    'apps/docs': {
      frameworks: {
        astro: true
      },
      tailwind: {
        noUnknownClasses: false
      }
    },
    'packages/lumen': {
      frameworks: {
        astro: true
      },
      tailwind: {
        noUnknownClasses: false
      }
    }
  },
  tailwind: {
    noUnknownClasses: false
  }
})
