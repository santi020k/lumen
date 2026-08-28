import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const repositoryRoot = resolve(import.meta.dirname, '..')
const ledgerArgumentIndex = process.argv.indexOf('--ledger')
const ledgerArgument = ledgerArgumentIndex === -1 ? undefined : process.argv[ledgerArgumentIndex + 1]

assert.ok(
  ledgerArgumentIndex === -1 || ledgerArgument,
  'The --ledger option requires a JSON file path'
)

const ledgerPath = ledgerArgument
  ? resolve(repositoryRoot, ledgerArgument)
  : resolve(repositoryRoot, 'registry', 'native-stability-soak.json')

const ledger = JSON.parse(
  await readFile(ledgerPath, 'utf8')
)

const currentDate = new Date().toISOString().slice(0, 10)
const requireComplete = process.argv.includes('--require-complete')

const expectedBaselines = {
  compose: 'packages/compose/api/lumen-compose.api',
  composeClassification: 'registry/compose-api-classification.json',
  reactNative: 'registry/native-api-baseline.json',
  swiftUI: 'registry/swift-api-baseline.json',
  swiftWidget: 'registry/swift-widget-api-baseline.json',
  wear: 'packages/compose/wear/api/wear.api',
  wearClassification: 'registry/wear-api-classification.json'
}

const lumenRepository = 'https://github.com/santi020k/lumen'

const isRecord = value => (
  typeof value === 'object' && value !== null && !Array.isArray(value)
)

const parseHttpsUrl = (value, label) => {
  assert.equal(typeof value, 'string', `${label} must be a string`)

  let parsed

  try {
    parsed = new URL(value)
  } catch {
    assert.fail(`${label} must be a valid HTTPS URL`)
  }

  assert.equal(parsed.protocol, 'https:', `${label} must be a valid HTTPS URL`)

  assert.equal(parsed.username, '', `${label} must not embed credentials`)

  assert.equal(parsed.password, '', `${label} must not embed credentials`)

  assert.equal(parsed.search, '', `${label} must not use a query string`)

  assert.equal(parsed.hash, '', `${label} must not use a fragment`)

  return parsed
}

const repositoryIdentity = url => (
  `${url.hostname}${url.pathname}`
    .replace(/\/+$/u, '')
    .replace(/\.git$/u, '')
    .toLowerCase()
)

const repositoryPath = url => (
  url.pathname.replace(/\/+$/u, '').replace(/\.git$/u, '')
)

const belongsToRepository = (url, repositoryUrl) => (
  url.hostname.toLowerCase() === repositoryUrl.hostname.toLowerCase()
  && url.pathname.startsWith(`${repositoryPath(repositoryUrl)}/`)
)

const isExactRevisionUrl = (url, repositoryUrl, revision) => (
  belongsToRepository(url, repositoryUrl)
  && new RegExp(`/(?:blob|commit|commits)/${revision}(?:/|$)`, 'u').test(url.pathname)
)

const isPermanentRunUrl = (url, repositoryUrl) => (
  belongsToRepository(url, repositoryUrl)
  && /\/(?:actions\/runs|artifacts|builds|jobs|pipelines|runs)\/[\w-]+(?:\/|$)/u.test(url.pathname)
)

const validateEvidenceRecord = (record, label, options = {}) => {
  assert.ok(isRecord(record), `${label} must be an object`)

  assert.deepEqual(
    Object.keys(record).sort(),
    ['repository', 'revision', 'revisionUrl', 'verificationUrl'],
    `${label} must record repository, revision, revision URL, and verification URL`
  )

  const repositoryUrl = parseHttpsUrl(record.repository, `${label}.repository`)

  assert.equal(typeof record.revision, 'string', `${label}.revision must be a string`)

  assert.match(record.revision, /^[\da-f]{40}$/, `${label} requires a full lowercase revision`)

  if (options.expectedRepository) {
    assert.equal(
      repositoryIdentity(repositoryUrl),
      repositoryIdentity(parseHttpsUrl(options.expectedRepository, `${label} expected repository`)),
      `${label} must target the Lumen repository`
    )
  }

  if (options.external) {
    assert.notEqual(
      repositoryIdentity(repositoryUrl),
      repositoryIdentity(parseHttpsUrl(lumenRepository, `${label} Lumen repository`)),
      `${label} must target an external consumer repository`
    )
  }

  if (options.expectedRevision) {
    assert.equal(
      record.revision,
      options.expectedRevision,
      `${label} revision must match the soak iteration revision`
    )
  }

  const revisionUrl = parseHttpsUrl(record.revisionUrl, `${label}.revisionUrl`)

  assert.ok(
    isExactRevisionUrl(revisionUrl, repositoryUrl, record.revision),
    `${label}.revisionUrl must bind the exact repository revision`
  )

  const verificationUrl = parseHttpsUrl(record.verificationUrl, `${label}.verificationUrl`)

  assert.ok(
    isPermanentRunUrl(verificationUrl, repositoryUrl),
    `${label}.verificationUrl must be a permanent workflow, pipeline, job, or build URL`
  )
}

const hashFile = async path => {
  const contents = await readFile(resolve(repositoryRoot, path))

  return createHash('sha256').update(contents).digest('hex')
}

assert.equal(ledger.schemaVersion, 2, 'Unsupported native stability soak schema')

assert.equal(ledger.requiredIterations, 2, 'Native stability requires exactly two soak iterations')

assert.deepEqual(
  Object.keys(ledger.baselines).sort(),
  Object.keys(expectedBaselines).sort(),
  'Soak ledger must cover every native API baseline'
)

const actualHashes = {}

for (const [adapter, expectedPath] of Object.entries(expectedBaselines)) {
  const baseline = ledger.baselines[adapter]

  assert.equal(baseline.path, expectedPath, `${adapter} baseline path changed unexpectedly`)

  assert.match(baseline.sha256, /^[\da-f]{64}$/, `${adapter} requires a SHA-256 digest`)

  const actualHash = await hashFile(expectedPath)

  assert.equal(
    baseline.sha256,
    actualHash,
    `${adapter} compatibility baseline changed; review it and restart the two-iteration soak`
  )

  actualHashes[adapter] = actualHash
}

assert.ok(Array.isArray(ledger.iterations), 'Soak iterations must be an array')

assert.ok(
  ledger.iterations.length <= ledger.requiredIterations,
  'Soak ledger contains more iterations than required'
)

const iterationIds = new Set()
let previousDate = ''
let previousVersions

const parseVersion = (iterationId, adapter, version) => {
  assert.equal(typeof version, 'string', `${iterationId}.${adapter} version must be a string`)

  const match = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.exec(version)

  assert.ok(
    match,
    `${iterationId}.${adapter} must record an ordinary semantic release without a prerelease suffix`
  )

  const parsed = match.slice(1).map(Number)

  assert.ok(parsed[0] < 2, `${iterationId}.${adapter} must remain on its pre-2.0 release line`)

  return parsed
}

const isNewer = (current, previous) => {
  for (const [index, value] of current.entries()) {
    if (value > previous[index]) return true

    if (value < previous[index]) return false
  }

  return false
}

for (const [iterationIndex, iteration] of ledger.iterations.entries()) {
  assert.equal(typeof iteration.id, 'string', 'Each soak iteration requires an id')

  assert.equal(
    iteration.id,
    `native-soak.${iterationIndex}`,
    `Soak iteration ${iterationIndex + 1} must use its stability sequence id`
  )

  assert.ok(!iterationIds.has(iteration.id), `Duplicate soak iteration: ${iteration.id}`)

  iterationIds.add(iteration.id)

  assert.match(iteration.date, /^\d{4}-\d{2}-\d{2}$/, `${iteration.id} requires an ISO date`)

  assert.equal(
    new Date(`${iteration.date}T00:00:00.000Z`).toISOString().slice(0, 10),
    iteration.date,
    `${iteration.id} requires a valid calendar date`
  )

  assert.ok(iteration.date <= currentDate, `${iteration.id} date must not be in the future`)

  assert.ok(iteration.date >= previousDate, 'Soak iterations must be chronological')

  previousDate = iteration.date

  assert.match(
    iteration.revision,
    /^[\da-f]{40}$/,
    `${iteration.id} requires a full lowercase Git revision`
  )

  assert.deepEqual(
    Object.keys(iteration.versions).sort(),
    ['compose', 'reactNative', 'swift', 'wear'],
    `${iteration.id} must record every released native version`
  )

  const parsedVersions = Object.fromEntries(
    Object.entries(iteration.versions)
      .map(([adapter, version]) => [adapter, parseVersion(iteration.id, adapter, version)])
  )

  if (previousVersions) {
    for (const [adapter, version] of Object.entries(parsedVersions)) {
      assert.ok(
        isNewer(version, previousVersions[adapter]),
        `${iteration.id}.${adapter} must be newer than the previous stability iteration`
      )
    }
  }

  previousVersions = parsedVersions

  assert.deepEqual(
    iteration.baselines,
    actualHashes,
    `${iteration.id} was not validated against the current reviewed baselines`
  )

  assert.ok(isRecord(iteration.evidence), `${iteration.id} requires structured release evidence`)

  assert.deepEqual(
    Object.keys(iteration.evidence).sort(),
    ['artifactVerification', 'consumerValidation', 'release'],
    `${iteration.id} evidence must record release, published-artifact verification, and consumer validation`
  )

  validateEvidenceRecord(iteration.evidence.release, `${iteration.id}.release`, {
    expectedRepository: lumenRepository,
    expectedRevision: iteration.revision
  })

  validateEvidenceRecord(
    iteration.evidence.artifactVerification,
    `${iteration.id}.artifactVerification`,
    {
      expectedRepository: lumenRepository,
      expectedRevision: iteration.revision
    }
  )

  assert.ok(
    isRecord(iteration.evidence.consumerValidation),
    `${iteration.id} requires structured real-consumer validation evidence`
  )

  assert.deepEqual(
    Object.keys(iteration.evidence.consumerValidation).sort(),
    ['compose', 'reactNative', 'swiftUI', 'swiftWidget', 'wear'],
    `${iteration.id} must record every real-consumer validation surface`
  )

  for (const [adapter, evidence] of Object.entries(iteration.evidence.consumerValidation)) {
    validateEvidenceRecord(evidence, `${iteration.id}.${adapter}`, { external: true })
  }
}

const remainingIterations = Math.max(0, ledger.requiredIterations - ledger.iterations.length)

if (requireComplete && remainingIterations > 0) {
  process.stderr.write(
    `Native stability soak is incomplete: ${remainingIterations} iteration(s) remain.\n`
  )

  process.exitCode = 1
}

process.stdout.write(
  `Validated ${ledger.iterations.length}/${ledger.requiredIterations} native stability soak `
    + `iterations against ${Object.keys(expectedBaselines).length} reviewed API baselines.\n`
)
