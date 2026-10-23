import assert from 'node:assert/strict'
import test from 'node:test'

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
