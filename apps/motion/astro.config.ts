import { fileURLToPath } from 'node:url'

import { defineConfig } from 'astro/config'

export default defineConfig({
  devToolbar: { enabled: false },
  trailingSlash: 'always',
  vite: {
    resolve: {
      alias: [{
        find: /^@santi020k\/lumen-core$/,
        replacement: fileURLToPath(new URL('../../packages/core/src/index.ts', import.meta.url))
      }]
    }
  }
})
