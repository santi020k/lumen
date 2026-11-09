import { fileURLToPath } from 'node:url'

import { satteri } from '@astrojs/markdown-satteri'
import sitemap from '@astrojs/sitemap'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'astro/config'

import { cachedLumenThemes } from './src/lib/lumen-shiki-themes'
import { repositoryMarkdownLinks } from './src/lib/repository-markdown'

export default defineConfig({
  // CI measures application layout without the development toolbar's overlay.
  devToolbar: { enabled: !process.env.CI },
  markdown: {
    processor: satteri({ mdastPlugins: [repositoryMarkdownLinks] }),
    shikiConfig: { theme: cachedLumenThemes.dark }
  },
  integrations: [sitemap({
    filter: page => {
      const { pathname } = new URL(page)

      return !pathname.startsWith('/internal/')
    }
  })],
  ...(process.env.LUMEN_DOCS_OUT_DIR ?
    { outDir: process.env.LUMEN_DOCS_OUT_DIR } :
    {}),
  site: process.env.PUBLIC_SITE_URL ?? 'https://lumen.santi020k.com',
  trailingSlash: 'never',
  vite: {
    build: { assetsInlineLimit: 8192 },
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
