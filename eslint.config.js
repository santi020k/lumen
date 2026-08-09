import { defineConfig } from '@santi020k/eslint-config-basic'

/** @type {Promise<import('@santi020k/eslint-config-basic').FlatConfigArray>} */
const config = defineConfig({
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

export default config
