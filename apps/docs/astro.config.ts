import { fileURLToPath } from 'node:url'

import mdx from '@astrojs/mdx'
import sitemap from '@astrojs/sitemap'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, passthroughImageService } from 'astro/config'

export default defineConfig({
  image: {
    service: passthroughImageService()
  },
  integrations: [mdx(), sitemap()],
  ...(process.env.LUMEN_DOCS_OUT_DIR ?
    { outDir: process.env.LUMEN_DOCS_OUT_DIR } :
    {}),
  site: process.env.PUBLIC_SITE_URL ?? 'https://lumen.santi020k.com',
  trailingSlash: 'never',
  vite: {
    resolve: {
      alias: [
        {
          find: /^@santi020k\/lumen-core$/,
          replacement: fileURLToPath(new URL('../../packages/core/src/index.ts', import.meta.url))
        }
      ]
    },
    plugins: [tailwindcss()]
  }
})
