import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import test from 'node:test'

import {
  assertSwiftApiBreakages,
  parseSwiftApiBreakages,
  resolveSwiftCompatibilityExpectation
} from './check-swift-source-compatibility.mjs'

test('prints the current release baseline without running Swift diagnosis', () => {
  const manifest = JSON.parse(readFileSync(new URL('../packages/lumen/package.json', import.meta.url), 'utf8'))
  const major = Math.max(3, Number.parseInt(manifest.version, 10))
  const contract = JSON.parse(readFileSync(new URL(`../registry/lumen-${major}-contract.json`, import.meta.url), 'utf8'))

  const result = spawnSync(process.execPath, [
    new URL('./check-swift-source-compatibility.mjs', import.meta.url).pathname, '--print-baseline'
  ], { encoding: 'utf8' })

  assert.equal(result.status, 0, result.stderr)

  assert.equal(result.stdout.trim(), resolveSwiftCompatibilityExpectation(major, contract).baseline)
})

test('extracts and sorts Swift API diagnostics', () => {
  const output = `
3 breaking changes detected in LumenUI:
  💔 API breakage: enumelement LumenSurfaceRadius.xl has been added as a new enum case
  💔 API breakage: enumelement LumenSurfacePadding.xl has been added as a new enum case
  💔 API breakage: enumelement LumenSurfaceRadius.xl has been added as a new enum case [#api-digester-breaking-change]
`

  assert.deepEqual(parseSwiftApiBreakages(output), [
    'enumelement LumenSurfacePadding.xl has been added as a new enum case',
    'enumelement LumenSurfaceRadius.xl has been added as a new enum case'
  ])
})

test('rejects unreviewed or missing Swift API diagnostics', () => {
  assert.throws(
    () => assertSwiftApiBreakages(['unexpected'], ['reviewed']),
    /Swift source breakage changed/
  )

  assert.throws(
    () => assertSwiftApiBreakages([], ['reviewed']),
    /Swift source breakage changed/
  )
})

test('selects the reviewed baseline and exact diagnostics for each release major', () => {
  assert.deepEqual(resolveSwiftCompatibilityExpectation(3, {
    targetVersion: '3.0.0', changes: [{ swiftApiBreakages: ['icon addition'] }]
  }), { baseline: 'v2.1.0', breakages: ['icon addition'] })

  assert.deepEqual(resolveSwiftCompatibilityExpectation(4, {
    targetVersion: '4.0.0', swiftApiBaseline: 'v3.0.1', changes: [{ swiftApiBreakages: ['initializer replacement'] }, { id: 'web-change' }]
  }), { baseline: 'v3.0.1', breakages: ['initializer replacement'] })

  assert.throws(() => resolveSwiftCompatibilityExpectation(4, {
    targetVersion: '3.0.0', changes: []
  }), /match the release major/)

  assert.throws(() => resolveSwiftCompatibilityExpectation(4, {
    targetVersion: '4.0.0', swiftApiBaseline: 'main', changes: []
  }), /immutable release tag/)

  assert.throws(() => resolveSwiftCompatibilityExpectation(4, {
    targetVersion: '4.0.0', swiftApiBaseline: 'v3.0.1', changes: [{ swiftApiBreakages: ['repeated', 'repeated'] }]
  }), /unique/)
})
