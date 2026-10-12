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

  assert.match(canonical, /\.ui-table-wrap--records/u)

  assert.match(canonical, /\.ui-table__label/u)

  assert.doesNotMatch(canonical, /\.ui-animated-portrait/u)

  assert.ok(Buffer.byteLength(canonical) < Buffer.byteLength(full) * 0.7)
})

test('critical Select styles retain the inherited direction definitions they consume', async () => {
  for (const output of outputs) {
    const styles = await readFile(path.join(root, output), 'utf8')

    assert.match(styles, /background-position: var\(--_ui-select-chevron,/u)

    assert.match(styles, /\[dir="rtl"\]\s*\{\s*--_ui-select-chevron:/u)

    assert.match(styles, /\[dir="ltr"\]\s*\{\s*--_ui-select-chevron:/u)
  }
})


test('critical Skeleton styles retain the keyframes used by every animation variant', async () => {
  for (const output of outputs) {
    const styles = await readFile(path.join(root, output), 'utf8')

    assert.match(styles, /animation: ui-skeleton-pulse/u)

    assert.match(styles, /@keyframes ui-skeleton-pulse\s*\{/u)

    assert.match(styles, /@keyframes ui-shimmer\s*\{/u)
  }
})

test('critical Skeleton styles stop looping under reduced motion without the full sheet override', async () => {
  for (const output of outputs) {
    const styles = await readFile(path.join(root, output), 'utf8')

    assert.match(styles, /@media \(prefers-reduced-motion: reduce\) \{\s*\.ui-skeleton \{\s*animation: none;/u)
  }
})
