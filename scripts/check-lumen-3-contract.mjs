import assert from 'node:assert/strict'
import { access, readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const repositoryRoot = resolve(import.meta.dirname, '..')
const expectedChangeId = 'swift-icon-catalog-expansion'
const currentDate = new Date().toISOString().slice(0, 10)
const isNonEmptyString = value => typeof value === 'string' && value.trim().length > 0

const validateStringArray = (value, label) => (
  Array.isArray(value) && value.length > 0 && value.every(isNonEmptyString)
    ? []
    : [`${label} must be a non-empty string array.`]
)

const isCalendarDate = value => {
  if (!/^\d{4}-\d{2}-\d{2}$/u.test(value ?? '')) return false

  const date = new Date(`${value}T00:00:00.000Z`)

  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value
}

const parseEvidenceUrl = (evidence, label, failures) => {
  let url

  try {
    url = new URL(evidence)
  } catch {
    failures.push(`${label} must be a valid HTTPS URL: ${evidence}`)

    return undefined
  }

  if (url.protocol !== 'https:') failures.push(`${label} must use HTTPS: ${evidence}`)

  if (url.username || url.password) failures.push(`${label} must not embed credentials: ${evidence}`)

  if (url.search) failures.push(`${label} must not use a query string: ${evidence}`)

  if (url.hash) failures.push(`${label} must not use a fragment: ${evidence}`)

  return url
}

const isLumenRepositoryUrl = url => (
  url.hostname.toLowerCase() === 'github.com'
  && url.pathname.toLowerCase().startsWith('/santi020k/lumen/')
)

const isExactRevisionUrl = (url, revision) => (
  isLumenRepositoryUrl(url)
  && /\/(?:blob|commit|commits)\/([\da-f]{40})(?:\/|$)/u.exec(url.pathname)?.[1] === revision
)

const isDecisionRecordUrl = url => (
  isLumenRepositoryUrl(url)
  && /\/(?:actions\/runs|discussions|issues|pull)\/[\w-]+(?:\/|$)/u.test(url.pathname)
)

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

  if (!isNonEmptyString(contract.policy?.compatibility)) failures.push('policy.compatibility must be a non-empty string.')

  if (!isNonEmptyString(contract.policy?.versioning)) failures.push('policy.versioning must be a non-empty string.')

  return failures
}

const validateChangeFields = change => {
  const failures = []

  if (change.status !== 'approved') failures.push(`${expectedChangeId}.status must be approved.`)

  if (change.kind !== 'breaking') failures.push(`${expectedChangeId}.kind must be breaking.`)

  for (const field of ['currentContract', 'replacement', 'migration']) {
    if (!isNonEmptyString(change[field])) failures.push(`${expectedChangeId}.${field} must be a non-empty string.`)
  }

  failures.push(...validateStringArray(change.packages, `${expectedChangeId}.packages`))

  failures.push(...validateStringArray(change.evidence, `${expectedChangeId}.evidence`))

  failures.push(...validateStringArray(change.docs, `${expectedChangeId}.docs`))

  failures.push(...validateStringArray(change.tests, `${expectedChangeId}.tests`))

  if (!Array.isArray(change.packages) || !change.packages.includes('LumenUI')) {
    failures.push(`${expectedChangeId}.packages must include LumenUI.`)
  }

  return failures
}

const validateSwiftBreakages = contract => {
  const failures = []
  const changes = Array.isArray(contract.changes) ? contract.changes : []
  const change = changes.find(item => item.id === expectedChangeId)

  if (!change) return [`changes must include ${expectedChangeId}.`]

  failures.push(...validateChangeFields(change))

  const breakages = change.swiftApiBreakages

  failures.push(...validateStringArray(breakages, `${expectedChangeId}.swiftApiBreakages`))

  if (Array.isArray(breakages) && new Set(breakages).size !== breakages.length) {
    failures.push(`${expectedChangeId}.swiftApiBreakages must not contain duplicates.`)
  }

  if (Array.isArray(breakages) && [...breakages].sort().some((item, index) => item !== breakages[index])) {
    failures.push(`${expectedChangeId}.swiftApiBreakages must be sorted.`)
  }

  return failures
}

const validateApprovalEvidence = (evidence, revision) => {
  const failures = [...validateStringArray(evidence, 'approval.evidence')]

  if (!Array.isArray(evidence)) return failures

  if (evidence.length < 2) {
    failures.push('approval.evidence must include exact revision and decision records.')
  }

  const urls = evidence
    .map((entry, index) => parseEvidenceUrl(entry, `approval.evidence[${index}]`, failures))
    .filter(Boolean)

  if (urls.some(url => !isExactRevisionUrl(url, revision) && !isDecisionRecordUrl(url))) {
    failures.push('approval.evidence must use immutable Lumen revision or permanent decision URLs.')
  }

  if (!urls.some(url => isExactRevisionUrl(url, revision))) {
    failures.push('approval.evidence must include the exact reviewed revision.')
  }

  if (!urls.some(isDecisionRecordUrl)) {
    failures.push('approval.evidence must include a permanent decision record.')
  }

  return failures
}

const validateApprovalFields = approval => {
  const failures = []
  const record = approval && typeof approval === 'object' ? approval : {}

  for (const field of ['approver', 'date', 'decision', 'reviewedRevision']) {
    if (!isNonEmptyString(record[field])) failures.push(`approval.${field} must be a non-empty string.`)
  }

  if (!isCalendarDate(record.date)) {
    failures.push('approval.date must be a valid YYYY-MM-DD calendar date.')
  } else if (record.date > currentDate) {
    failures.push('approval.date must not be in the future.')
  }

  if (!/^[\da-f]{40}$/u.test(record.reviewedRevision ?? '')) {
    failures.push('approval.reviewedRevision must be a full lowercase Git revision.')
  }

  failures.push(...validateApprovalEvidence(record.evidence, record.reviewedRevision))

  return failures
}

const validateApproval = contract => {
  if (contract.status === 'approved') return validateApprovalFields(contract.approval)

  return contract.approval === undefined ? [] : ['Draft contract must not contain an approval record.']
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
