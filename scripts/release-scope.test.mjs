import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'

import {
  classifyReleasePackages,
  mergeReleasePackageNames,
  selectPendingReleaseNames
} from './release-scope.mjs'

test('pending changesets resolve without mixing private and public release packages', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'lumen-changeset-regression-'))
  const output = join(directory, 'status.json')

  try {
    const result = spawnSync('pnpm', ['exec', 'changeset', 'status', '--output', output], {
      cwd: new URL('..', import.meta.url),
      encoding: 'utf8'
    })

    assert.equal(result.status, 0, result.error?.message ?? `${result.stdout}\n${result.stderr}`)

    const status = JSON.parse(await readFile(output, 'utf8'))

    assert.ok(Array.isArray(status.releases), 'Changesets must produce a valid release plan')
  } finally {
    await rm(directory, { force: true, recursive: true })
  }
})

test('release scope merges pending and unpublished packages deterministically', () => {
  assert.deepEqual(
    mergeReleasePackageNames({
      pending: ['@santi020k/lumen-react', '@santi020k/lumen-core'],
      unpublished: ['@santi020k/lumen-react', '@santi020k/lumen-elements']
    }),
    [
      '@santi020k/lumen-core',
      '@santi020k/lumen-elements',
      '@santi020k/lumen-react'
    ]
  )
})

test('release scope ignores private packages Changesets reports as unchanged', () => {
  assert.deepEqual(
    selectPendingReleaseNames([
      { name: '@santi020k/lumen-core', type: 'minor' },
      { name: '@santi020k/lumen-docs', type: 'none' }
    ]),
    ['@santi020k/lumen-core']
  )
})

test('an isolated React release selects web validation only', () => {
  assert.deepEqual(
    classifyReleasePackages(['@santi020k/lumen-react']),
    { mcp: true, mcpPackage: false, native: false, reactNative: false, web: true }
  )
})

test('a React Native release selects native validation without Swift or Compose publication', () => {
  assert.deepEqual(
    classifyReleasePackages(['@santi020k/lumen-react-native']),
    { mcp: false, mcpPackage: false, native: true, reactNative: true, web: false }
  )
})

test('shared tokens select every relevant release contract', () => {
  assert.deepEqual(
    classifyReleasePackages(['@santi020k/lumen-tokens']),
    { mcp: true, mcpPackage: false, native: true, reactNative: true, web: false }
  )
})

test('an MCP release selects its packed package smoke', () => {
  assert.deepEqual(
    classifyReleasePackages(['@santi020k/lumen-mcp']),
    { mcp: true, mcpPackage: true, native: false, reactNative: false, web: false }
  )
})
