import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'

import { findSwiftModuleSearchPath, readSwiftApiProducts } from './swift-api-products.mjs'

test('finds both SwiftPM module files and Xcode module directories', () => {
  const root = mkdtempSync(join(tmpdir(), 'lumen-api-products-'))

  try {
    const swiftModules = join(root, 'swift', 'Modules')
    const xcodeProducts = join(root, 'xcode', 'Debug-iphonesimulator')

    mkdirSync(swiftModules, { recursive: true })

    mkdirSync(join(xcodeProducts, 'LumenUI.swiftmodule'), { recursive: true })

    writeFileSync(join(swiftModules, 'LumenUI.swiftmodule'), 'compiled module')

    assert.equal(findSwiftModuleSearchPath(join(root, 'swift'), 'LumenUI'), swiftModules)

    assert.equal(findSwiftModuleSearchPath(join(root, 'xcode'), 'LumenUI'), xcodeProducts)

    assert.throws(() => findSwiftModuleSearchPath(root, 'LumenUI'), /Expected one/u)

    assert.throws(() => findSwiftModuleSearchPath(root, 'LumenWidgetUI'), /Expected one/u)

    assert.throws(() => findSwiftModuleSearchPath(join(root, 'missing'), 'LumenUI'), /ENOENT/u)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('requires a complete products map for each module and rejects incomplete coverage', () => {
  const platforms = ['macOS', 'iOS', 'tvOS', 'visionOS', 'watchOS']
  const widgetPlatforms = ['macOS', 'iOS', 'watchOS']
  const products = Object.fromEntries(platforms.map(platform => [platform, `/consumer/${platform}`]))
  const widgetProducts = Object.fromEntries(widgetPlatforms.map(platform => [platform, `/widget/${platform}`]))
  const manifest = { LumenUI: products, LumenWidgetUI: widgetProducts }

  assert.deepEqual(readSwiftApiProducts(manifest, 'LumenUI', platforms), products)

  assert.deepEqual(readSwiftApiProducts(manifest, 'LumenWidgetUI', widgetPlatforms), widgetProducts)

  for (const invalid of [null, {}, { LumenUI: widgetProducts }, { LumenUI: { ...products, iOS: '' } }, { LumenUI: { ...products, iOS: 123 } }]) {
    assert.throws(() => readSwiftApiProducts(invalid, 'LumenUI', platforms))
  }

  assert.throws(() => readSwiftApiProducts(manifest, 'LumenWidgetUI', platforms), /every supported platform/u)
})

test('the API command rejects incomplete products and cannot update baselines from supplied products', () => {
  const root = mkdtempSync(join(tmpdir(), 'lumen-api-manifest-'))
  const manifest = join(root, 'products.json')
  const command = new URL('./check-swift-api-baseline.mjs', import.meta.url).pathname

  try {
    writeFileSync(manifest, JSON.stringify({ LumenUI: { macOS: root } }))

    const incomplete = spawnSync(process.execPath, [command, '--products-manifest', manifest], { encoding: 'utf8' })
    const update = spawnSync(process.execPath, [command, '--products-manifest', manifest, '--update'], { encoding: 'utf8' })
    const missing = spawnSync(process.execPath, [command, '--products-manifest'], { encoding: 'utf8' })

    assert.equal(incomplete.status, 1)

    assert.match(incomplete.stderr, /products must cover every supported platform/u)

    assert.equal(update.status, 1)

    assert.match(update.stderr, /Baseline updates must build the repository sources/u)

    assert.equal(missing.status, 1)

    assert.match(missing.stderr, /requires a path/u)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})
