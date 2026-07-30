import { fileURLToPath } from 'node:url'

import { defineConfig } from '@santi020k/eslint-config-basic'

export default defineConfig({
  tailwind: {
    detectComponentClasses: true,
    entryPoint: fileURLToPath(
      new URL('./apps/docs/src/styles/global.css', import.meta.url)
    ),
    noUnknownClasses: false
  }
})
