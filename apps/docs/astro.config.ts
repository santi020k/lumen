import { fileURLToPath } from 'node:url'

import { satteri } from '@astrojs/markdown-satteri'
import sitemap from '@astrojs/sitemap'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, passthroughImageService } from 'astro/config'

import { migrationMarkdownLinks } from './src/lib/migration-markdown'

export default defineConfig({
  markdown: { processor: satteri({ mdastPlugins: [migrationMarkdownLinks] }) },
  image: {
    service: passthroughImageService()
  },
  integrations: [sitemap({
    filter: page => {
      const { pathname } = new URL(page)

      return !pathname.startsWith('/internal/') && pathname !== '/device-frame-demo'
    }
  })],
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
