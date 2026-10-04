import assert from 'node:assert/strict'
import { readFile, realpath, stat } from 'node:fs/promises'
import { isAbsolute, relative, resolve, sep } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

import { validateContractApproval } from './check-lumen-3-contract.mjs'

const repositoryRoot = resolve(import.meta.dirname, '..')
const consumerChangeId = 'consumer-driven-component-polish'
const swiftChangeId = 'swift-native-control-polish'

const requiredChangeIds = [
  consumerChangeId, swiftChangeId,
  'web-content-flow', 'web-control-visual-size', 'web-form-value-ownership',
  'web-combobox-focus', 'web-phone-input-identity', 'web-virtual-list-ranges',
  'web-rich-text-command-ownership'
]

const reviewedIconCaseDiagnostics = new Set([
  'enumelement LumenIconName.bangladeshiTaka has been added as a new enum case',
  'enumelement LumenIconName.layoutGridCircles has been added as a new enum case',
  'enumelement LumenIconName.letters has been added as a new enum case',
  'enumelement LumenIconName.printer3d has been added as a new enum case'
])

const isRecord = value => value !== null && typeof value === 'object' && !Array.isArray(value)
const isNonEmptyString = value => typeof value === 'string' && value.trim().length > 0
const isStringArray = value => Array.isArray(value) && value.length > 0 && value.every(isNonEmptyString)

const validateStringArray = (value, label) => {
  if (!isStringArray(value)) return [`${label} must be a non-empty string array.`]

  return new Set(value).size === value.length ? [] : [`${label} must not contain duplicates.`]
}

const isRepositoryPath = value => isNonEmptyString(value)
  && !isAbsolute(value)
  && !value.includes('\\')
  && !value.includes(':')
  && value.split('/').every(segment => segment && segment !== '.' && segment !== '..')

const validateMetadata = (contract, requireApproved) => {
  const failures = []

  if (contract.schemaVersion !== 1) failures.push('schemaVersion must be 1.')

  if (!['draft', 'approved'].includes(contract.status)) failures.push('status must be draft or approved.')

  if (requireApproved && contract.status !== 'approved') {
    failures.push('The Lumen 4 release requires an approved contract.')
  }

  if (contract.targetVersion !== '4.0.0') failures.push('targetVersion must be 4.0.0.')

  if (contract.swiftApiBaseline !== 'v3.0.1') failures.push('swiftApiBaseline must be the reviewed v3.0.1 release tag.')

  for (const field of ['compatibility', 'versioning']) {
    if (!isRecord(contract.policy) || !isNonEmptyString(contract.policy[field])) {
      failures.push(`policy.${field} must be a non-empty string.`)
    }
  }

  return failures
}

const validateChangePaths = (change, label) => {
  const failures = []

  for (const field of ['evidence', 'docs']) {
    if (!isStringArray(change[field])) continue

    for (const path of change[field]) {
      if (!isRepositoryPath(path)) failures.push(`${label}.${field} must reference files inside the repository: ${path}`)
    }
  }

  return failures
}

const validateRequiredTests = (change, commands) => commands
  .filter(command => !isStringArray(change.tests) || !change.tests.includes(command))
  .map(command => `${change.id}.tests must include ${command}.`)

const validateChange = change => {
  if (!isRecord(change)) return ['Every changes entry must be an object.']

  const failures = []
  const label = isNonEmptyString(change.id) ? change.id : 'change'

  if (!isNonEmptyString(change.id) || !/^[a-z][a-z0-9-]*$/u.test(change.id)) {
    failures.push('Every change id must be a lowercase kebab-case identifier.')
  }

  if (change.kind !== 'breaking') failures.push(`${label}.kind must be breaking.`)

  for (const field of ['currentContract', 'replacement', 'migration']) {
    if (!isNonEmptyString(change[field])) failures.push(`${label}.${field} must be a non-empty string.`)
  }

  for (const field of ['packages', 'evidence', 'docs', 'tests']) {
    failures.push(...validateStringArray(change[field], `${label}.${field}`))
  }

  failures.push(...validateChangePaths(change, label))

  if (change.id === consumerChangeId) {
    failures.push(...validateRequiredTests(change, ['pnpm run validate', 'pnpm run test:a11y']))
  }

  return failures
}

const validateSwiftDiagnostics = diagnostics => {
  const failures = validateStringArray(diagnostics, `${swiftChangeId}.swiftApiBreakages`)

  if (!isStringArray(diagnostics)) return failures

  if ([...diagnostics].sort().some((entry, index) => entry !== diagnostics[index])) {
    failures.push(`${swiftChangeId}.swiftApiBreakages must be sorted.`)
  }

  for (const diagnostic of diagnostics) {
    const isInitializerRemoval = diagnostic.startsWith('constructor Lumen') && diagnostic.endsWith(' has been removed')

    if (!isInitializerRemoval && !reviewedIconCaseDiagnostics.has(diagnostic)) {
      failures.push(`${swiftChangeId}.swiftApiBreakages must identify exact removed Lumen initializer or reviewed icon-case addition diagnostics.`)
    }
  }

  return failures
}

const validateSwiftChange = changes => {
  const change = changes.find(entry => isRecord(entry) && entry.id === swiftChangeId)

  if (!change) return []

  const failures = validateSwiftDiagnostics(change.swiftApiBreakages)

  if (!isStringArray(change.packages) || !change.packages.includes('LumenUI')) {
    failures.push(`${swiftChangeId}.packages must include LumenUI.`)
  }

  failures.push(...validateRequiredTests(change, [
    'swift test', 'pnpm run check:swift-api-baseline', 'pnpm run check:swift-source-compatibility'
  ]))

  return failures
}

export const validateLumen4Contract = (contract, { requireApproved = false } = {}) => {
  if (!isRecord(contract)) return ['The Lumen 4 contract must be an object.']

  const failures = validateMetadata(contract, requireApproved)
  const changes = Array.isArray(contract.changes) ? contract.changes : []

  if (changes.length === 0) failures.push('changes must be a non-empty array.')

  for (const id of requiredChangeIds) {
    if (!changes.some(change => isRecord(change) && change.id === id)) failures.push(`changes must include ${id}.`)
  }

  const identifiers = changes.filter(isRecord).map(change => change.id)

  if (new Set(identifiers).size !== identifiers.length) failures.push('changes must not contain duplicate ids.')

  for (const change of changes) failures.push(...validateChange(change))

  failures.push(...validateSwiftChange(changes), ...validateContractApproval(contract))

  return failures
}

const validateReferencedFile = async (root, referencedPath) => {
  try {
    const path = await realpath(resolve(root, referencedPath))
    const relativePath = relative(root, path)

    if (relativePath === '..' || relativePath.startsWith(`..${sep}`) || isAbsolute(relativePath)) {
      return [`Referenced file must stay inside the repository: ${referencedPath}.`]
    }

    return (await stat(path)).isFile() ? [] : [`Referenced path must be a file: ${referencedPath}.`]
  } catch {
    return [`Referenced file does not exist: ${referencedPath}.`]
  }
}

export const validateLumen4ContractReferences = async (contract, repository = repositoryRoot) => {
  if (!isRecord(contract) || !Array.isArray(contract.changes)) return []

  const root = await realpath(repository)

  const references = contract.changes.filter(isRecord).flatMap(change => ['evidence', 'docs']
    .flatMap(field => isStringArray(change[field]) ? change[field] : [])).filter(isRepositoryPath)

  const failures = await Promise.all([...new Set(references)].map(path => validateReferencedFile(root, path)))

  return failures.flat()
}

const run = async () => {
  const contract = JSON.parse(await readFile(resolve(repositoryRoot, 'registry/lumen-4-contract.json'), 'utf8'))

  const failures = [
    ...validateLumen4Contract(contract, { requireApproved: process.argv.includes('--require-approved') }),
    ...await validateLumen4ContractReferences(contract)
  ]

  assert.deepEqual(failures, [], `Lumen 4 contract validation failed:\n${failures.join('\n')}`)

  process.stdout.write(`Validated the ${contract.status} Lumen 4 contract.\n`)
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await run()
