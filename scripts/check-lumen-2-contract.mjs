import { access, readFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const contractPath = path.join(root, 'registry/lumen-2-contract.json')
const contract = JSON.parse(await readFile(contractPath, 'utf8'))
const failures = []

const requireString = (value, label) => {
  if (typeof value !== 'string' || value.trim().length === 0) {
    failures.push(`${label} must be a non-empty string.`)
  }
}

const requireStringArray = (value, label) => {
  if (!Array.isArray(value) || value.length === 0 || value.some(item => typeof item !== 'string' || item.length === 0)) {
    failures.push(`${label} must be a non-empty string array.`)
  }
}

if (contract.schemaVersion !== 1) failures.push('schemaVersion must be 1.')

if (contract.status !== 'draft') failures.push('The pre-release Lumen 2 contract must remain draft.')

if (contract.targetVersion !== '2.0.0') failures.push('targetVersion must be 2.0.0.')

requireString(contract.policy?.compatibility, 'policy.compatibility')

requireString(contract.policy?.nativeGraduation, 'policy.nativeGraduation')

requireString(contract.policy?.nonGoal, 'policy.nonGoal')

if (!Array.isArray(contract.changes) || contract.changes.length === 0) {
  failures.push('changes must contain at least one reviewed candidate.')
}

const ids = new Set()
const referencedFiles = new Set()

for (const [index, change] of (contract.changes ?? []).entries()) {
  const label = `changes[${index}]`

  requireString(change.id, `${label}.id`)

  if (ids.has(change.id)) failures.push(`${label}.id duplicates ${change.id}.`)

  ids.add(change.id)

  if (!['candidate', 'approved', 'rejected'].includes(change.status)) {
    failures.push(`${label}.status must be candidate, approved, or rejected.`)
  }

  if (change.kind !== 'breaking') failures.push(`${label}.kind must be breaking.`)

  requireStringArray(change.packages, `${label}.packages`)

  requireString(change.currentContract, `${label}.currentContract`)

  requireString(change.replacement, `${label}.replacement`)

  requireString(change.migration, `${label}.migration`)

  requireStringArray(change.evidence, `${label}.evidence`)

  requireStringArray(change.docs, `${label}.docs`)

  requireStringArray(change.tests, `${label}.tests`)

  if (change.swiftApiBreakages !== undefined) {
    requireStringArray(change.swiftApiBreakages, `${label}.swiftApiBreakages`)

    if (change.id !== 'swift-surface-scale-expansion') {
      failures.push(`${label}.swiftApiBreakages is only supported for the reviewed Swift surface change.`)
    }
  }

  for (const file of [...(change.evidence ?? []), ...(change.docs ?? [])]) {
    referencedFiles.add(file)
  }
}

for (const [index, investigation] of (contract.investigations ?? []).entries()) {
  const label = `investigations[${index}]`

  requireString(investigation.id, `${label}.id`)

  if (ids.has(investigation.id)) failures.push(`${label}.id duplicates ${investigation.id}.`)

  ids.add(investigation.id)

  if (!['deferred', 'resolved'].includes(investigation.status)) {
    failures.push(`${label}.status must be deferred or resolved.`)
  }

  if (investigation.status === 'deferred') {
    requireString(investigation.decisionGate, `${label}.decisionGate`)
  }

  if (investigation.status === 'resolved') {
    if (!['retain', 'change'].includes(investigation.decision)) {
      failures.push(`${label}.decision must be retain or change.`)
    }

    requireString(investigation.resolution, `${label}.resolution`)

    requireStringArray(investigation.evidence, `${label}.evidence`)

    for (const file of investigation.evidence ?? []) referencedFiles.add(file)
  }
}

for (const file of referencedFiles) {
  try {
    await access(path.join(root, file))
  } catch {
    failures.push(`Referenced contract evidence does not exist: ${file}`)
  }
}

if (failures.length > 0) {
  console.error(`Lumen 2 contract check failed:\n- ${failures.join('\n- ')}`)

  process.exitCode = 1
} else {
  const deferredCount = contract.investigations.filter(investigation => investigation.status === 'deferred').length
  const resolvedCount = contract.investigations.filter(investigation => investigation.status === 'resolved').length

  console.log(`Lumen 2 contract check passed for ${contract.changes.length} breaking-change candidates, ${resolvedCount} resolved investigation, and ${deferredCount} deferred investigations.`)
}
