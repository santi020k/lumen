import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import test from 'node:test'

import { validateLumen3Contract } from './check-lumen-3-contract.mjs'

const contract = JSON.parse(
  await readFile(resolve(import.meta.dirname, '..', 'registry', 'lumen-3-contract.json'), 'utf8')
)

test('accepts the reviewed draft contract before its approval-only commit', () => {
  assert.deepEqual(validateLumen3Contract(contract), [])
})

test('requires explicit approval at the publication boundary', () => {
  assert.deepEqual(validateLumen3Contract(contract, { requireApproved: true }), [
    'The Lumen 3 release requires an approved contract.'
  ])
})

test('rejects duplicate Swift compatibility diagnostics', () => {
  const duplicate = structuredClone(contract)
  const [firstBreakage] = duplicate.changes[0].swiftApiBreakages

  duplicate.changes[0].swiftApiBreakages.push(firstBreakage)

  assert.ok(
    validateLumen3Contract(duplicate).includes(
      'swift-icon-catalog-expansion.swiftApiBreakages must not contain duplicates.'
    )
  )
})
