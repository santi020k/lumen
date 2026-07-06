import { fileURLToPath } from 'node:url'

import mdx from '@astrojs/mdx'
import sitemap from '@astrojs/sitemap'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'astro/config'

export default defineConfig({
  integrations: [mdx(), sitemap()],
  site: process.env.PUBLIC_SITE_URL ?? 'https://lumen.santi020k.com',
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
