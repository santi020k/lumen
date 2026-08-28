import { access, readFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

const readArgument = name => {
  const index = process.argv.indexOf(name)

  if (index === -1) return undefined

  const value = process.argv[index + 1]

  if (!value || value.startsWith('--')) {
    throw new Error(`${name} requires a value.`)
  }

  return value
}

const requireApproved = process.argv.includes('--require-approved')
const requireRemovedExports = process.argv.includes('--require-removed-exports')
const contractArgument = readArgument('--contract')
const releaseManifestArgument = readArgument('--release-manifest')

const contractPath = contractArgument
  ? path.resolve(root, contractArgument)
  : path.join(root, 'registry/lumen-2-contract.json')

const contract = JSON.parse(await readFile(contractPath, 'utf8'))
const currentDate = new Date().toISOString().slice(0, 10)

const releaseManifestPath = releaseManifestArgument
  ? path.resolve(root, releaseManifestArgument)
  : path.join(root, 'registry/release-manifest.json')

const releaseManifest = JSON.parse(await readFile(releaseManifestPath, 'utf8'))

const nativeApiBaseline = JSON.parse(
  await readFile(path.join(root, 'registry/native-api-baseline.json'), 'utf8')
)

const webApiBaseline = JSON.parse(
  await readFile(path.join(root, 'registry/web-api-baseline.json'), 'utf8')
)

const v2MigratorSource = await readFile(
  path.join(root, 'packages/lumen/src/v2-migration.ts'),
  'utf8'
)

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

const isCalendarDate = value => {
  if (!/^\d{4}-\d{2}-\d{2}$/u.test(value ?? '')) return false

  const date = new Date(`${value}T00:00:00.000Z`)

  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value
}

const parseEvidenceUrl = (evidence, label) => {
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

const isApprovalRecordUrl = url => (
  isLumenRepositoryUrl(url)
  && /\/(?:actions\/runs|discussions|issues|pull)\/[\w-]+(?:\/|$)/u.test(url.pathname)
)

const isGraduationRecordUrl = url => (
  isLumenRepositoryUrl(url)
  && (
    /\/actions\/runs\/[\w-]+(?:\/|$)/u.test(url.pathname)
    || /\/releases\/tag\/v2\.0\.0(?:\/|$)/u.test(url.pathname)
  )
)

const validateDecisionEvidence = (entries, label, revision, isDecisionRecord) => {
  if (!Array.isArray(entries)) return

  if (entries.length < 2) {
    failures.push(`${label} evidence must include exact revision and decision records.`)
  }

  const urls = entries
    .map((evidence, index) => parseEvidenceUrl(evidence, `${label} evidence ${index + 1}`))
    .filter(Boolean)

  if (urls.some(url => !isExactRevisionUrl(url, revision) && !isDecisionRecord(url))) {
    failures.push(`${label} evidence must use immutable Lumen revision or permanent decision URLs.`)
  }

  if (!urls.some(url => isExactRevisionUrl(url, revision))) {
    failures.push(`${label} evidence must include the exact recorded revision.`)
  }

  if (!urls.some(isDecisionRecord)) {
    failures.push(`${label} evidence must include a permanent decision record.`)
  }
}

if (contract.schemaVersion !== 1) failures.push('schemaVersion must be 1.')

if (!['approved', 'draft'].includes(contract.status)) {
  failures.push('status must be draft or approved.')
}

if (requireApproved && contract.status !== 'approved') {
  failures.push('The coordinated Lumen 2 release requires an approved contract.')
}

if (contract.targetVersion !== '2.0.0') failures.push('targetVersion must be 2.0.0.')

requireString(contract.policy?.compatibility, 'policy.compatibility')

requireString(contract.policy?.nativeGraduation, 'policy.nativeGraduation')

requireString(contract.policy?.nonGoal, 'policy.nonGoal')

requireString(contract.releaseMigration?.codemod, 'releaseMigration.codemod')

if (
  !Array.isArray(contract.releaseMigration?.deprecatedExports)
  || contract.releaseMigration.deprecatedExports.some(
    exportName => typeof exportName !== 'string' || exportName.length === 0
  )
) {
  failures.push('releaseMigration.deprecatedExports must be a string array.')
}

requireStringArray(contract.releaseMigration?.removedExports, 'releaseMigration.removedExports')

for (const runtime of ['astro', 'elements', 'react']) {
  requireString(contract.releaseMigration?.runtime?.[runtime], `releaseMigration.runtime.${runtime}`)
}

const changes = Array.isArray(contract.changes) ? contract.changes : []
const investigations = Array.isArray(contract.investigations) ? contract.investigations : []

if (changes.length === 0) {
  failures.push('changes must contain at least one reviewed candidate.')
}

if (!Array.isArray(contract.investigations)) {
  failures.push('investigations must be an array.')
}

const ids = new Set()
const referencedFiles = new Set()

for (const [index, change] of changes.entries()) {
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

const currentRootExports = new Map(
  Object.values(webApiBaseline.packages ?? {}).map(packageDefinition => [
    packageDefinition.packageName,
    new Set(packageDefinition.symbols ?? [])
  ])
)

const reactNativeApi = nativeApiBaseline.adapters?.reactNative

if (reactNativeApi) {
  currentRootExports.set(
    '@santi020k/lumen-react-native',
    new Set(['supported', 'experimental', 'deprecated'].flatMap(
      classification => reactNativeApi[classification] ?? []
    ))
  )
}

const reviewedPackages = new Set(
  changes
    .filter(change => change.status !== 'rejected')
    .flatMap(change => change.packages ?? [])
)

const removedExports = Array.isArray(contract.releaseMigration?.removedExports)
  ? contract.releaseMigration.removedExports
  : []

const targetMajor = Number.parseInt(contract.targetVersion?.split('.')[0] ?? '', 10)
const npmReleasePackages = releaseManifest.release?.npm?.packages ?? {}

if (new Set(removedExports).size !== removedExports.length) {
  failures.push('releaseMigration.removedExports must not contain duplicates.')
}

if (JSON.stringify(removedExports) !== JSON.stringify([...removedExports].sort())) {
  failures.push('releaseMigration.removedExports must remain sorted.')
}

for (const entry of removedExports) {
  const match = /^(@[a-z0-9][a-z0-9._-]*\/[a-z0-9][a-z0-9._-]*)#([A-Za-z_$][A-Za-z0-9_$]*)$/u.exec(entry)

  if (!match) {
    failures.push(`releaseMigration.removedExports contains an invalid package#symbol entry: ${entry}`)

    continue
  }

  const [, packageName, symbol] = match
  const rootExports = currentRootExports.get(packageName)

  if (!reviewedPackages.has(packageName)) {
    failures.push(`${entry} does not belong to a reviewed Lumen 2 breaking-change package.`)
  }

  if (!rootExports) {
    failures.push(`${entry} references a package without an authoritative root API baseline.`)
  } else if (
    rootExports.has(symbol)
    && (
      requireRemovedExports
      || Number.parseInt(npmReleasePackages[packageName]?.version?.split('.')[0] ?? '', 10) >= targetMajor
    )
  ) {
    failures.push(`${entry} is still exported from the current package root.`)
  }

  if (!v2MigratorSource.includes(`'${symbol}'`) && !v2MigratorSource.includes(`"${symbol}"`)) {
    failures.push(`${entry} is not handled by the Lumen v2 migrator.`)
  }
}

for (const [index, investigation] of investigations.entries()) {
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

if (contract.status === 'approved') {
  requireString(contract.approval?.approver, 'approval.approver')

  requireString(contract.approval?.date, 'approval.date')

  if (!isCalendarDate(contract.approval?.date)) {
    failures.push('approval.date must be a valid YYYY-MM-DD calendar date.')
  } else if (contract.approval.date > currentDate) {
    failures.push('approval.date must not be in the future.')
  }

  requireString(contract.approval?.reviewedRevision, 'approval.reviewedRevision')

  if (!/^[0-9a-f]{40}$/u.test(contract.approval?.reviewedRevision ?? '')) {
    failures.push('approval.reviewedRevision must be a full lowercase Git revision.')
  }

  requireStringArray(contract.approval?.evidence, 'approval.evidence')

  validateDecisionEvidence(
    contract.approval?.evidence,
    'Approval',
    contract.approval?.reviewedRevision,
    isApprovalRecordUrl
  )

  const unresolvedChanges = changes.filter(change => change.status === 'candidate')

  const deferredInvestigations = investigations.filter(
    investigation => investigation.status === 'deferred'
  )

  if (unresolvedChanges.length > 0) {
    failures.push(`Approved contract contains candidate changes: ${unresolvedChanges.map(change => change.id).join(', ')}`)
  }

  if (deferredInvestigations.length > 0) {
    failures.push(
      `Approved contract contains deferred investigations: ${deferredInvestigations.map(investigation => investigation.id).join(', ')}`
    )
  }

  if (contract.graduation !== undefined) {
    requireString(contract.graduation?.verifiedBy, 'graduation.verifiedBy')

    requireString(contract.graduation?.date, 'graduation.date')

    if (!isCalendarDate(contract.graduation?.date)) {
      failures.push('graduation.date must be a valid YYYY-MM-DD calendar date.')
    } else if (contract.graduation.date > currentDate) {
      failures.push('graduation.date must not be in the future.')
    }

    if (contract.graduation?.version !== contract.targetVersion) {
      failures.push('graduation.version must match targetVersion.')
    }

    requireString(contract.graduation?.releaseRevision, 'graduation.releaseRevision')

    if (!/^[0-9a-f]{40}$/u.test(contract.graduation?.releaseRevision ?? '')) {
      failures.push('graduation.releaseRevision must be a full lowercase Git revision.')
    }

    requireStringArray(contract.graduation?.evidence, 'graduation.evidence')

    validateDecisionEvidence(
      contract.graduation?.evidence,
      'Graduation',
      contract.graduation?.releaseRevision,
      isGraduationRecordUrl
    )
  }
} else if (contract.approval !== undefined) {
  failures.push('Draft contract must not contain an approval record.')
} else if (contract.graduation !== undefined) {
  failures.push('Draft contract must not contain a graduation record.')
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
  const deferredCount = investigations.filter(investigation => investigation.status === 'deferred').length
  const resolvedCount = investigations.filter(investigation => investigation.status === 'resolved').length

  console.log(
    `Lumen 2 ${contract.status} contract check passed for ${changes.length} breaking changes, `
      + `${resolvedCount} resolved investigation, and ${deferredCount} deferred investigations.`
  )
}
