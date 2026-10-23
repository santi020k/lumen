import { cp, readFile, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { getRouteManifestImage } from '@santi020k/og'

import { versionSocialImageUrls } from './social-image-urls.mjs'

const root = fileURLToPath(new URL('../', import.meta.url))
const destination = path.resolve(root, process.env.LUMEN_DOCS_OUT_DIR ?? 'dist', 'og')
const source = path.join(root, 'public/og')

if (destination === source) throw new Error('The docs output directory must differ from public assets.')

// Astro has already copied public assets. Replace that copy with the freshly generated cards.
await rm(destination, { force: true, recursive: true })

await cp(source, destination, { recursive: true })

// Image generation discovers final HTML routes. Apply each generated content-versioned URL
// after generation so a changed title, asset or renderer invalidates social-client caches.
const manifest = JSON.parse(await readFile(path.join(source, 'manifest.json'), 'utf8'))

for (const route of Object.values(manifest.routes)) {
  const image = getRouteManifestImage(manifest, route.pathname, { format: 'webp' })

  if (!image?.url) throw new Error(`Missing generated social image for ${route.pathname}`)

  const pathname = route.pathname.replace(/^\/+|\/+$/gu, '')
  const htmlPath = path.resolve(root, process.env.LUMEN_DOCS_OUT_DIR ?? 'dist', pathname, 'index.html')
  const html = await readFile(htmlPath, 'utf8')
  const imageUrl = new URL(image.url, process.env.PUBLIC_SITE_URL ?? 'https://lumen.santi020k.com').href

  await writeFile(htmlPath, versionSocialImageUrls(html, imageUrl))
}
