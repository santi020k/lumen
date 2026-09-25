import assert from 'node:assert/strict'
import { access, readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const repositoryRoot = resolve(import.meta.dirname, '..')
const expectedChangeId = 'swift-icon-catalog-expansion'
const isNonEmptyString = value => typeof value === 'string' && value.trim().length > 0

const validateMetadata = (contract, requireApproved) => {
  const failures = []

  if (contract.schemaVersion !== 1) failures.push('schemaVersion must be 1.')

  if (!['approved', 'draft'].includes(contract.status)) {
    failures.push('status must be draft or approved.')
  }

  if (requireApproved && contract.status !== 'approved') {
    failures.push('The Lumen 3 release requires an approved contract.')
  }

  if (contract.targetVersion !== '3.0.0') failures.push('targetVersion must be 3.0.0.')

  if (!isNonEmptyString(contract.policy?.compatibility)) {
    failures.push('policy.compatibility must be a non-empty string.')
  }

  if (!isNonEmptyString(contract.policy?.versioning)) {
    failures.push('policy.versioning must be a non-empty string.')
  }

  return failures
}

const validateSwiftBreakages = contract => {
  const failures = []
  const changes = Array.isArray(contract.changes) ? contract.changes : []
  const change = changes.find(item => item.id === expectedChangeId)

  if (!change) failures.push(`changes must include ${expectedChangeId}.`)

  const breakages = change?.swiftApiBreakages

  if (!Array.isArray(breakages) || breakages.length === 0) {
    failures.push(`${expectedChangeId}.swiftApiBreakages must be a non-empty array.`)
  } else {
    if (breakages.some(item => !isNonEmptyString(item))) {
      failures.push(`${expectedChangeId}.swiftApiBreakages must contain only non-empty strings.`)
    }

    if (new Set(breakages).size !== breakages.length) {
      failures.push(`${expectedChangeId}.swiftApiBreakages must not contain duplicates.`)
    }

    if ([...breakages].sort().some((item, index) => item !== breakages[index])) {
      failures.push(`${expectedChangeId}.swiftApiBreakages must be sorted.`)
    }
  }

  return failures
}

const validateApproval = contract => {
  if (contract.status !== 'approved') return []

  const failures = []

  if (!/^[\da-f]{40}$/iu.test(contract.approval?.reviewedRevision ?? '')) {
    failures.push('approval.reviewedRevision must be a full Git revision.')
  }

  if (!Array.isArray(contract.approval?.evidence) || contract.approval.evidence.length < 2) {
    failures.push('approval.evidence must include the reviewed revision and decision record.')
  }

  return failures
}

export const validateLumen3Contract = (contract, { requireApproved = false } = {}) => [
  ...validateMetadata(contract, requireApproved),
  ...validateSwiftBreakages(contract),
  ...validateApproval(contract)
]

const run = async () => {
  const contractPath = resolve(repositoryRoot, 'registry/lumen-3-contract.json')
  const contract = JSON.parse(await readFile(contractPath, 'utf8'))

  const failures = validateLumen3Contract(contract, {
    requireApproved: process.argv.includes('--require-approved')
  })

  for (const change of contract.changes ?? []) {
    for (const referencedPath of [...(change.evidence ?? []), ...(change.docs ?? [])]) {
      try {
        await access(resolve(repositoryRoot, referencedPath))
      } catch {
        failures.push(`Referenced file does not exist: ${referencedPath}.`)
      }
    }
  }

  assert.deepEqual(failures, [], `Lumen 3 contract validation failed:\n${failures.join('\n')}`)

  process.stdout.write(`Validated the ${contract.status} Lumen 3 contract.\n`)
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await run()
