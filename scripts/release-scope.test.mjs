import assert from 'node:assert/strict'
import test from 'node:test'

import {
  classifyReleasePackages,
  mergeReleasePackageNames
} from './release-scope.mjs'

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
