import { defineConfig } from '@santi020k/eslint-config-basic'

export default defineConfig({
  projects: {
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
