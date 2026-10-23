import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { copyFile, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

import { versionSocialImageUrls } from './social-image-urls.mjs'

const baseUrl = 'https://lumen.santi020k.com/og/pages/docs.webp'
const imageUrl = `${baseUrl}?v=abcdef123456`

test('versions both metadata and schema images and preserves unrelated URLs', () => {
  const html = `<meta content="${baseUrl}"><script>{"image":"${baseUrl}"}</script><a href="${baseUrl}.other">Other</a>`
  const expected = `<meta content="${imageUrl}"><script>{"image":"${imageUrl}"}</script><a href="${baseUrl}.other">Other</a>`

  assert.equal(versionSocialImageUrls(html, imageUrl), expected)
})

test('replaces a stale version and stays idempotent on subsequent runs', () => {
  const html = `<meta content="${baseUrl}?v=123456789abc">`
  const expected = `<meta content="${imageUrl}">`

  assert.equal(versionSocialImageUrls(html, imageUrl), expected)

  assert.equal(versionSocialImageUrls(expected, imageUrl), expected)
})

test('preserves different hosts and paths that resemble the image URL', () => {
  const urls = [
    'https://lumenXsanti020k.com/og/pages/docs.webp',
    'https://lumen.santi020kXcom/og/pages/docs.webp',
    'https://lumen.santi020k.com/og/pages/docsXwebp'
  ]

  const html = urls.map(url => `<meta content="${url}">`).join('')

  assert.equal(versionSocialImageUrls(html, imageUrl), html)
})

for (const site of [undefined, 'https://preview.example:8443/docs/']) {
  test(`syncs generated social URLs for ${site ?? 'the default site'}`, async () => {
    const directory = await mkdtemp(path.join(tmpdir(), 'lumen-social-site-'))
    const publicPath = '/og/pages/docs.webp'
    const versionedPath = `${publicPath}?v=abcdef123456`
    const siteBase = site ?? 'https://lumen.santi020k.com'
    const unversioned = new URL(publicPath, siteBase).href
    const versioned = new URL(versionedPath, siteBase).href
    const htmlPath = path.join(directory, 'dist/docs/index.html')

    try {
      await mkdir(path.join(directory, 'scripts'), { recursive: true })

      await mkdir(path.join(directory, 'public/og'), { recursive: true })

      await mkdir(path.dirname(htmlPath), { recursive: true })

      await symlink(fileURLToPath(new URL('../node_modules', import.meta.url)), path.join(directory, 'node_modules'), 'dir')

      for (const name of ['sync-og-images.mjs', 'social-image-urls.mjs']) {
        await copyFile(new URL(name, import.meta.url), path.join(directory, 'scripts', name))
      }

      await writeFile(path.join(directory, 'public/og/manifest.json'), JSON.stringify({
        version: 1,
        routes: { '/docs': { pathname: '/docs', images: [{ format: 'webp', primary: true, url: versionedPath }] } }
      }))

      await writeFile(htmlPath, `<meta content="${unversioned}"><script>{"image":"${unversioned}"}</script>`)

      const environment = { ...process.env, LUMEN_DOCS_OUT_DIR: 'dist' }

      if (site) environment.PUBLIC_SITE_URL = site
      else delete environment.PUBLIC_SITE_URL

      const result = spawnSync(process.execPath, [path.join(directory, 'scripts/sync-og-images.mjs')], {
        cwd: directory, env: environment, encoding: 'utf8', timeout: 10_000
      })

      assert.equal(result.status, 0, result.stderr)

      assert.equal(await readFile(htmlPath, 'utf8'), `<meta content="${versioned}"><script>{"image":"${versioned}"}</script>`)
    } finally {
      await rm(directory, { recursive: true, force: true })
    }
  })
}
