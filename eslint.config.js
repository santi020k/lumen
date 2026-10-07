import { defineConfig } from '@santi020k/eslint-config-basic'
import typescriptParser from '@typescript-eslint/parser'

// cspell:words swiftpm
export default defineConfig({
  ignores: ['**/.build/**', '**/.swiftpm/**'],
  projects: {
    'apps/motion': {
      frameworks: {
        astro: true
      },
      tailwind: {
        noUnknownClasses: false
      }
    },
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
}, {
  files: ['**/*.astro'],
  languageOptions: {
    parserOptions: {
      parser: typescriptParser
    }
  },
  name: 'lumen/astro-typescript-parser'
})
