import { fileURLToPath } from 'node:url'

import { defineConfig } from 'astro/config'

export default defineConfig({
  devToolbar: { enabled: false },
  trailingSlash: 'always',
  vite: {
    resolve: {
      alias: {
        '@santi020k/lumen-core': fileURLToPath(new URL('../../packages/core/src/index.ts', import.meta.url))
      }
    }
  }
})
