import assert from 'node:assert/strict'
import test from 'node:test'

import { swiftCaseIdentifier } from './platform-identifiers.mjs'

test('converts catalog names to Swift case identifiers', () => {
  assert.equal(swiftCaseIdentifier('empty'), 'empty')

  assert.equal(swiftCaseIdentifier('empty-state'), 'emptyState')

  assert.equal(swiftCaseIdentifier('repeat'), '`repeat`')
})
