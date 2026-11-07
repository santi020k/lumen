import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import path from 'node:path'

import sharp from 'sharp'

const root = path.resolve(import.meta.dirname, '../../..')
const directory = path.join(root, 'docs/assets/releases/v5.0.0')
const { assets } = JSON.parse(await readFile(path.join(directory, 'inventory.json'), 'utf8'))
const { captures } = JSON.parse(await readFile(path.join(directory, 'web-captures.json'), 'utf8'))
const { artwork } = JSON.parse(await readFile(path.join(directory, 'artwork.json'), 'utf8'))
const { captures: nativeCaptures } = JSON.parse(await readFile(path.join(directory, 'native-captures.json'), 'utf8'))

assert.equal(captures.length, 16, 'Expected eight web/Expo captures in each appearance')

assert.equal(artwork.length, 11, 'Expected nine carousel cards, a cover, and a feature graphic')

assert.equal(nativeCaptures.length, 24, 'Expected six captures each for large iPhone, medium iPhone, iPad, and Android')

assert.equal(new Set(assets.map(asset => asset.file)).size, assets.length, 'Duplicate asset paths')

for (const asset of assets) {
  const bytes = await readFile(path.join(root, asset.file))
  const metadata = await sharp(bytes).metadata()

  assert.equal(createHash('sha256').update(bytes).digest('hex'), asset.sha256, `Changed asset: ${asset.file}`)

  assert.equal(bytes.length, asset.bytes, asset.file)

  assert.equal(metadata.width, asset.width, asset.file)

  assert.equal(metadata.height, asset.height, asset.file)

  if (asset.file.includes('/Store/')) assert.equal(metadata.hasAlpha, false, `Store screenshot contains alpha: ${asset.file}`)
}

for (const asset of artwork) {
  assert.ok(asset.alt.length > 20, `Missing descriptive alt text: ${asset.file}`)

  const metadata = await sharp(path.join(root, asset.file)).metadata()

  assert.equal(metadata.width, asset.width, asset.file)

  assert.equal(metadata.height, asset.height, asset.file)
}

for (const capture of captures) {
  assert.match(capture.sourceRevision, /^[a-f0-9]{40}$/)

  assert.ok(capture.alt.length > 20)

  const metadata = await sharp(path.join(directory, capture.file)).metadata()

  assert.equal(metadata.width, capture.width, capture.file)

  assert.equal(metadata.height, capture.height, capture.file)
}

for (const capture of nativeCaptures) {
  const bytes = await readFile(path.join(root, capture.file))
  const metadata = await sharp(bytes).metadata()
  const statistics = await sharp(bytes).stats()

  assert.match(capture.sourceRevision, /^[a-f0-9]{40}$/)

  assert.equal(createHash('sha256').update(bytes).digest('hex'), capture.sha256, capture.file)

  assert.equal(metadata.width, capture.width, capture.file)

  assert.equal(metadata.height, capture.height, capture.file)

  assert.equal(metadata.hasAlpha, false, capture.file)

  assert.ok(statistics.entropy > 1, `Capture appears blank: ${capture.file}`)

  assert.ok(capture.alt.length > 20, capture.file)
}

console.log(`Verified ${assets.length} image checksums, capture dimensions, and ${artwork.length} artwork descriptions.`)
