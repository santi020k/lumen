import assert from 'node:assert/strict'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { pathToFileURL } from 'node:url'
import { gzipSync } from 'node:zlib'

import { checkBundleSize } from './lib/bundle-size.mjs'

const withFixture = async callback => {
  const directory = await mkdtemp(join(tmpdir(), 'lumen-bundle-size-'))
  const output = []
  const options = { root: pathToFileURL(`${directory}/`), requestedPackagesSource: '', write: line => output.push(line) }

  try {
    await writeFile(join(directory, 'module.js'), 'export const value = 42;')

    await writeFile(join(directory, 'related.js'), 'export const related = true;')

    await callback({ directory, options, output })
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
}

const budget = { file: 'module.js', packageName: '@santi020k/lumen-react', raw: 100, gzip: 100 }

test('catalog growth is reported without a ceiling', () => withFixture(async ({ directory, options, output }) => {
  await writeFile(join(directory, 'catalog.js'), 'component '.repeat(100_000))

  await checkBundleSize([{ file: 'catalog.js', packageName: budget.packageName, kind: 'catalog' }, budget], options)

  assert.match(output[0], /976\.6 KiB raw.*catalog, informational/u)

  assert.match(output[1], /enforced/u)
}))

test('focused modules enforce raw and gzip limits independently', () => withFixture(async ({ options }) => {
  await assert.rejects(checkBundleSize([{ ...budget, raw: 1 }], options), /module\.js raw size/u)

  await assert.rejects(checkBundleSize([{ ...budget, gzip: 1 }], options), /module\.js gzip size/u)
}))

test('exact limits pass and extracted files remain counted', () => withFixture(async ({ options }) => {
  const source = Buffer.from('export const value = 42;')
  const exact = { ...budget, raw: source.length, gzip: gzipSync(source, { level: 9 }).length }

  await checkBundleSize([exact], options)

  await assert.rejects(checkBundleSize([{ ...exact, relatedFiles: ['related.js'] }], options), /module\.js \+ related\.js raw size/u)
}))

test('missing catalog artifacts still fail', () => withFixture(async ({ options }) => {
  await assert.rejects(checkBundleSize([{ file: 'missing.js', kind: 'catalog', packageName: budget.packageName }], options), { code: 'ENOENT' })
}))

test('release scope skips artifacts belonging to adapters outside the build scope', () => withFixture(async ({ options, output }) => {
  const entries = [budget, { file: 'missing.js', packageName: '@santi020k/lumen-elements', kind: 'catalog' }]

  await checkBundleSize(entries, { ...options, requestedPackagesSource: JSON.stringify([budget.packageName]) })

  assert.equal(output.length, 1)

  await assert.rejects(checkBundleSize(entries, { ...options, requestedPackagesSource: '["@santi020k/lumen-core"]' }), { code: 'ENOENT' })
}))

test('invalid release scopes fail rather than silently skipping checks', () => withFixture(async ({ options }) => {
  for (const requestedPackagesSource of ['null', 'false', '42', '{}', '"react"', '[42]']) {
    await assert.rejects(checkBundleSize([budget], { ...options, requestedPackagesSource }), /JSON array of package names/u)
  }

  await assert.rejects(checkBundleSize([budget], { ...options, requestedPackagesSource: '[' }), SyntaxError)
}))

test('consumer bundles are compiled and enforce their output limits', () => withFixture(async ({ options, output }) => {
  const consumer = { label: 'consumer', contents: 'export { value } from "./module.js"', resolveDirectory: '.', packageName: budget.packageName, raw: 100, gzip: 100 }

  await checkBundleSize([consumer], options)

  assert.match(output[0], /consumer:.*enforced/u)

  await assert.rejects(checkBundleSize([{ ...consumer, raw: 1 }], options), /consumer raw size/u)

  await assert.rejects(checkBundleSize([{ ...consumer, gzip: 1 }], options), /consumer gzip size/u)

  await assert.rejects(checkBundleSize([{ ...consumer, contents: 'import "./missing.js"' }], options), /Could not resolve/u)
}))
