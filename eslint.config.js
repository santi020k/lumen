import { defineConfig } from '@santi020k/eslint-config-basic'

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
  // These copied recipe sources run in the consumer, not the CLI. The registry
  // declares their adapter dependency; test:portable-editorial installs it and
  // verifies the published-source imports. Keep other unpublished imports errors.
  files: [
    'packages/lumen/templates/elements/article-reading/src/lumen/article-reading.ts',
    'packages/lumen/templates/elements/image-viewer/src/lumen/image-viewer.ts',
    'packages/lumen/templates/elements/site-search-dialog/src/lumen/site-search-dialog.ts'
  ],
  rules: {
    'n/no-unpublished-import': ['error', { allowModules: ['@santi020k/lumen-elements'] }]
  }
}, {
  // Installed Astro recipes resolve the application's adapter, which is development-only
  // in the CLI package. The registry declares it; the production fixture verifies it.
  files: ['packages/lumen/templates/astro/editable-ticket/src/lumen/editable-ticket.astro'],
  rules: {
    'n/no-unpublished-import': ['error', { allowModules: ['@santi020k/lumen-astro'] }]
  }
})
