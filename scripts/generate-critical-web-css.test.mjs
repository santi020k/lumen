import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

const outputs = [
  'packages/lumen/styles/critical.css',
  'packages/astro/styles/critical.css',
  'packages/react/styles/critical.css',
  'packages/elements/styles/critical.css'
]

test('critical CSS outputs stay identical, focused, and materially smaller', async () => {
  const [canonical, ...copies] = await Promise.all(outputs.map(output => readFile(path.join(root, output), 'utf8')))
  const full = await readFile(path.join(root, 'packages/lumen/styles.css'), 'utf8')

  assert.ok(copies.every(copy => copy === canonical))

  assert.match(canonical, /\.ui-button/u)

  assert.match(canonical, /\.ui-data-table/u)

  assert.doesNotMatch(canonical, /\.ui-animated-portrait/u)

  assert.ok(Buffer.byteLength(canonical) < Buffer.byteLength(full) * 0.7)
})
