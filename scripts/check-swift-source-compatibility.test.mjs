import assert from 'node:assert/strict'
import test from 'node:test'

import {
  assertSwiftApiBreakages,
  parseSwiftApiBreakages
} from './check-swift-source-compatibility.mjs'

test('extracts and sorts Swift API diagnostics', () => {
  const output = `
2 breaking changes detected in LumenUI:
  💔 API breakage: enumelement LumenSurfaceRadius.xl has been added as a new enum case
  💔 API breakage: enumelement LumenSurfacePadding.xl has been added as a new enum case
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
