import assert from 'node:assert/strict'
import { mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import test from 'node:test'

import { validateLumen4Contract, validateLumen4ContractReferences } from './check-lumen-4-contract.mjs'

const contract = JSON.parse(await readFile(resolve(import.meta.dirname, '../registry/lumen-4-contract.json'), 'utf8'))
const reviewedRevision = 'a'.repeat(40)

const createDraft = () => {
  const draft = structuredClone(contract)

  draft.status = 'draft'

  delete draft.approval

  return draft
}

const createApproved = () => ({
  ...createDraft(),
  status: 'approved',
  approval: {
    approver: 'Santiago Molina (release owner)',
    date: '2026-10-03',
    decision: 'Publish the reviewed Lumen 4 component and native contracts.',
    reviewedRevision,
    evidence: [
      `https://github.com/santi020k/lumen/commit/${reviewedRevision}`,
      'https://github.com/santi020k/lumen/pull/200'
    ]
  }
})

test('validates the current draft and its repository evidence without inventing approval', async () => {
  assert.deepEqual(validateLumen4Contract(createDraft()), [])

  assert.deepEqual(await validateLumen4ContractReferences(createDraft()), [])

  assert.deepEqual(validateLumen4Contract(createDraft(), { requireApproved: true }), [
    'The Lumen 4 release requires an approved contract.'
  ])
})

test('accepts named human approval bound to the exact reviewed revision and decision record', () => {
  assert.deepEqual(validateLumen4Contract(createApproved(), { requireApproved: true }), [])
})

test('rejects malformed JSON shapes without throwing', () => {
  for (const invalid of [null, [], true, 'contract', {}, { changes: [null, 1, []] }]) {
    assert.ok(validateLumen4Contract(invalid).length > 0)
  }

  const invalid = createDraft()

  invalid.changes[0].tests = 12

  invalid.policy = null

  assert.ok(validateLumen4Contract(invalid).length > 0)
})

test('enforces metadata, the reviewed baseline, and required unique changes', () => {
  const invalid = createDraft()

  invalid.schemaVersion = 2

  invalid.targetVersion = '3.0.0'

  invalid.swiftApiBaseline = 'main'

  invalid.status = 'ready'

  invalid.changes = [invalid.changes[0], invalid.changes[0]]

  const failures = validateLumen4Contract(invalid)

  for (const expected of [
    'schemaVersion must be 1.',
    'targetVersion must be 4.0.0.',
    'swiftApiBaseline must be the reviewed v3.0.1 release tag.',
    'status must be draft or approved.',
    'changes must include swift-native-control-polish.',
    'changes must not contain duplicate ids.'
  ]) assert.ok(failures.includes(expected), expected)
})

test('requires documented migrations, affected packages, evidence, and behavioral checks', () => {
  const invalid = createDraft()
  const change = invalid.changes[0]

  change.kind = 'compatible'

  change.currentContract = ''

  change.replacement = ''

  change.migration = ''

  change.packages = []

  change.evidence = []

  change.docs = []

  change.tests = []

  const failures = validateLumen4Contract(invalid)

  for (const field of ['currentContract', 'replacement', 'migration', 'packages', 'evidence', 'docs', 'tests']) {
    assert.ok(failures.some(failure => failure.startsWith(`${change.id}.${field} must`)), field)
  }

  assert.ok(failures.includes(`${change.id}.kind must be breaking.`))

  assert.ok(failures.includes(`${change.id}.tests must include pnpm run validate.`))

  assert.ok(failures.includes(`${change.id}.tests must include pnpm run test:a11y.`))
})

test('rejects missing, duplicate, unsorted, or vague Swift breakage evidence', () => {
  for (const diagnostics of [[], ['unspecified'], ['z', 'a'], ['duplicate', 'duplicate']]) {
    const invalid = createDraft()

    invalid.changes[1].swiftApiBreakages = diagnostics

    invalid.changes[1].packages = ['unrelated']

    invalid.changes[1].tests = []

    const failures = validateLumen4Contract(invalid)

    assert.ok(failures.some(failure => failure.startsWith('swift-native-control-polish.swiftApiBreakages')))

    assert.ok(failures.includes('swift-native-control-polish.packages must include LumenUI.'))

    assert.ok(failures.includes('swift-native-control-polish.tests must include pnpm run check:swift-source-compatibility.'))
  }
})

test('rejects unreviewed enum additions and other API changes disguised as reviewed diagnostics', () => {
  for (const diagnostic of [
    'enumelement LumenIconName.unreviewed has been added as a new enum case',
    'enumelement LumenSurfaceRadius.printer3d has been added as a new enum case',
    'enumelement LumenIconName.printer3d has been removed',
    'property LumenSlider.value has been removed'
  ]) {
    const invalid = createDraft()

    invalid.changes[1].swiftApiBreakages = [diagnostic]

    assert.ok(validateLumen4Contract(invalid).some(failure => failure.includes(
      'must identify exact removed Lumen initializer or reviewed icon-case addition diagnostics'
    )))
  }
})

test('rejects approval consisting only of status and reviewedRevision', () => {
  const invalid = createApproved()

  invalid.approval = { reviewedRevision }

  const failures = validateLumen4Contract(invalid, { requireApproved: true })

  for (const field of ['approver', 'date', 'decision', 'evidence']) {
    assert.ok(failures.some(failure => failure.startsWith(`approval.${field} must`)), field)
  }
})

test('rejects missing approver attribution and release decisions', () => {
  const invalid = createApproved()

  invalid.approval.approver = ''

  invalid.approval.decision = ''

  const failures = validateLumen4Contract(invalid)

  assert.ok(failures.some(failure => failure.startsWith('approval.approver must')))

  assert.ok(failures.includes('approval.decision must be a non-empty string.'))
})

test('rejects impossible dates, future approval, and abbreviated revisions', () => {
  for (const date of ['2026-02-30', '2999-01-01', 'not-a-date']) {
    const invalid = createApproved()

    invalid.approval.date = date

    invalid.approval.reviewedRevision = 'abc123'

    const failures = validateLumen4Contract(invalid)

    assert.ok(failures.some(failure => failure.startsWith('approval.date must')))

    assert.ok(failures.includes('approval.reviewedRevision must be a full lowercase Git revision.'))
  }
})

test('requires both immutable revision evidence and a permanent Lumen decision URL', () => {
  for (const evidence of [
    [],
    [`https://github.com/santi020k/lumen/commit/${reviewedRevision}`],
    ['https://github.com/santi020k/lumen/pull/200'],
    [`https://github.com/santi020k/lumen/commit/${'b'.repeat(40)}`, 'https://github.com/santi020k/lumen/pull/200'],
    ['https://github.com/santi020k/lumen/blob/main/README.md', 'https://github.com/santi020k/lumen/pull/200'],
    [`https://github.com/santi020k/other/commit/${reviewedRevision}`, 'https://example.com/approval'],
    [`http://github.com/santi020k/lumen/commit/${reviewedRevision}`, 'https://github.com/santi020k/lumen/pull/200'],
    [`https://user:secret@github.com/santi020k/lumen/commit/${reviewedRevision}`, 'https://github.com/santi020k/lumen/pull/200'],
    [`https://github.com/santi020k/lumen/commit/${reviewedRevision}?query=value`, 'https://github.com/santi020k/lumen/pull/200'],
    [`https://github.com/santi020k/lumen/commit/${reviewedRevision}#fragment`, 'https://github.com/santi020k/lumen/pull/200']
  ]) {
    const invalid = createApproved()

    invalid.approval.evidence = evidence

    assert.ok(validateLumen4Contract(invalid).some(failure => failure.startsWith('approval.evidence')))
  }
})

test('rejects an approval record while the contract is draft', () => {
  const invalid = createDraft()

  invalid.approval = createApproved().approval

  assert.ok(validateLumen4Contract(invalid).includes('Draft contract must not contain an approval record.'))
})

test('rejects absolute and escaping documentation or evidence paths', () => {
  for (const path of ['/tmp/evidence.md', '../evidence.md', 'docs/../../evidence.md', 'https://example.com/evidence', 'docs\\evidence.md']) {
    const invalid = createDraft()

    invalid.changes[0].evidence = [path]

    assert.ok(validateLumen4Contract(invalid).some(failure => failure.includes('must reference files inside the repository')))
  }
})

test('checks referenced files against the supplied repository and rejects missing or escaping evidence', async () => {
  const directory = await mkdtemp(resolve(tmpdir(), 'lumen-four-contract-'))
  const repository = resolve(directory, 'repository')
  const fixture = { changes: [{ docs: ['docs/evidence.md'], evidence: ['docs/missing.md'] }] }

  try {
    await mkdir(resolve(repository, 'docs'), { recursive: true })

    await writeFile(resolve(directory, 'outside.md'), 'external evidence\n')

    await writeFile(resolve(repository, 'docs/evidence.md'), 'local evidence\n')

    assert.deepEqual(await validateLumen4ContractReferences(fixture, repository), [
      'Referenced file does not exist: docs/missing.md.'
    ])

    fixture.changes[0].evidence = ['docs']

    assert.deepEqual(await validateLumen4ContractReferences(fixture, repository), [
      'Referenced path must be a file: docs.'
    ])

    await symlink(resolve(directory, 'outside.md'), resolve(repository, 'docs/outside.md'))

    fixture.changes[0].evidence = ['docs/outside.md']

    assert.deepEqual(await validateLumen4ContractReferences(fixture, repository), [
      'Referenced file must stay inside the repository: docs/outside.md.'
    ])
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})

test('keeps the complete web breaking inventory available to migration tools', () => {
  for (const id of ['web-content-flow', 'web-control-visual-size', 'web-form-value-ownership',
    'web-combobox-focus', 'web-phone-input-identity', 'web-virtual-list-ranges',
    'web-rich-text-command-ownership']) {
    const draft = createDraft()

    draft.changes = draft.changes.filter(change => change.id !== id)

    assert.ok(validateLumen4Contract(draft).includes(`changes must include ${id}.`))
  }
})
