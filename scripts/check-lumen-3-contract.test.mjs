import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import test from 'node:test'

import { validateLumen3Contract } from './check-lumen-3-contract.mjs'

const contract = JSON.parse(
  await readFile(resolve(import.meta.dirname, '..', 'registry', 'lumen-3-contract.json'), 'utf8')
)

const reviewedRevision = 'a'.repeat(40)

const createDraftContract = () => {
  const draft = structuredClone(contract)

  draft.status = 'draft'

  delete draft.approval

  return draft
}

const createApprovedContract = () => ({
  ...createDraftContract(),
  approval: {
    approver: 'Santiago Molina (release owner)',
    date: '2026-09-25',
    decision: 'Publish the reviewed Swift enum expansion as Lumen 3.',
    evidence: [
      `https://github.com/santi020k/lumen/commit/${reviewedRevision}`,
      'https://github.com/santi020k/lumen/pull/80'
    ],
    reviewedRevision
  },
  status: 'approved'
})

test('accepts the reviewed draft contract before its approval-only commit', () => {
  assert.deepEqual(validateLumen3Contract(createDraftContract()), [])
})

test('requires explicit approval at the publication boundary', () => {
  assert.deepEqual(validateLumen3Contract(createDraftContract(), { requireApproved: true }), [
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

test('accepts attributable approval bound to an exact revision and decision record', () => {
  assert.deepEqual(validateLumen3Contract(createApprovedContract(), { requireApproved: true }), [])
})

test('rejects weakened breaking-change classification and missing release evidence', () => {
  const invalid = structuredClone(contract)

  invalid.changes[0].status = 'candidate'

  invalid.changes[0].kind = 'compatible'

  invalid.changes[0].packages = []

  invalid.changes[0].migration = ''

  invalid.changes[0].docs = []

  invalid.changes[0].tests = []

  const failures = validateLumen3Contract(invalid)

  for (const expected of [
    'swift-icon-catalog-expansion.status must be approved.',
    'swift-icon-catalog-expansion.kind must be breaking.',
    'swift-icon-catalog-expansion.packages must be a non-empty string array.',
    'swift-icon-catalog-expansion.packages must include LumenUI.',
    'swift-icon-catalog-expansion.migration must be a non-empty string.',
    'swift-icon-catalog-expansion.docs must be a non-empty string array.',
    'swift-icon-catalog-expansion.tests must be a non-empty string array.'
  ]) {
    assert.ok(failures.includes(expected), expected)
  }
})

test('rejects approval without an exact revision and permanent decision URL', () => {
  const invalid = createApprovedContract()

  invalid.approval.evidence = ['arbitrary evidence', 'https://example.com/decision']

  const failures = validateLumen3Contract(invalid, { requireApproved: true })

  assert.ok(failures.some(failure => failure.includes('must be a valid HTTPS URL')))

  assert.ok(failures.includes('approval.evidence must include the exact reviewed revision.'))

  assert.ok(failures.includes('approval.evidence must include a permanent decision record.'))
})

test('rejects incomplete or future-dated approval records', () => {
  const invalid = createApprovedContract()

  invalid.approval.approver = ''

  invalid.approval.date = '2999-01-01'

  invalid.approval.decision = ''

  const failures = validateLumen3Contract(invalid, { requireApproved: true })

  assert.ok(failures.includes('approval.approver must be a non-empty string.'))

  assert.ok(failures.includes('approval.date must not be in the future.'))

  assert.ok(failures.includes('approval.decision must be a non-empty string.'))
})

test('rejects an approval record while the contract remains draft', () => {
  const invalid = createDraftContract()

  invalid.approval = createApprovedContract().approval

  assert.ok(
    validateLumen3Contract(invalid).includes('Draft contract must not contain an approval record.')
  )
})
