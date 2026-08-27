import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const repositoryRoot = resolve(import.meta.dirname, '..')
const ledgerArgumentIndex = process.argv.indexOf('--ledger')
const ledgerArgument = ledgerArgumentIndex === -1 ? undefined : process.argv[ledgerArgumentIndex + 1]
const soakLedgerArgumentIndex = process.argv.indexOf('--soak-ledger')

const soakLedgerArgument = soakLedgerArgumentIndex === -1
  ? undefined
  : process.argv[soakLedgerArgumentIndex + 1]

assert.ok(
  ledgerArgumentIndex === -1 || ledgerArgument,
  'The --ledger option requires a JSON file path'
)

assert.ok(
  soakLedgerArgumentIndex === -1 || soakLedgerArgument,
  'The --soak-ledger option requires a JSON file path'
)

const ledgerPath = ledgerArgument
  ? resolve(repositoryRoot, ledgerArgument)
  : resolve(repositoryRoot, 'registry', 'native-consumer-evidence.json')

const ledger = JSON.parse(await readFile(ledgerPath, 'utf8'))
const requireComplete = process.argv.includes('--require-complete')
const expectedAdapterIds = ['compose', 'react-native', 'swiftui', 'wear']

const expectedChecks = [
  'accessibility',
  'activeProduct',
  'build',
  'icons',
  'installation',
  'integration',
  'signedArtifact',
  'stateManagement',
  'theming',
  'upgrade'
]

const incompleteAdapters = []

const isRecord = value => (
  typeof value === 'object' && value !== null && !Array.isArray(value)
)

const validateStringArray = (value, label) => {
  assert.ok(Array.isArray(value), `${label} must be an array`)

  for (const entry of value) {
    assert.equal(typeof entry, 'string', `${label} entries must be strings`)

    assert.ok(entry.trim().length > 0, `${label} entries must not be empty`)
  }
}

const parseOrdinaryVersion = (value, label) => {
  assert.equal(typeof value, 'string', `${label} must be a string`)

  const match = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.exec(value)

  assert.ok(match, `${label} must be an ordinary semantic version`)

  return match.slice(1).map(Number)
}

const isNewerVersion = (current, previous) => {
  for (const [index, value] of current.entries()) {
    if (value > previous[index]) return true

    if (value < previous[index]) return false
  }

  return false
}

const validateConsumer = (entry) => {
  const label = entry.id

  assert.ok(['complete', 'partial', 'pending'].includes(entry.status), `${label} has an invalid status`)

  assert.equal(typeof entry.adapter, 'string', `${label} requires an adapter name`)

  assert.ok(entry.adapter.trim().length > 0, `${label} requires an adapter name`)

  assert.ok(isRecord(entry.consumer), `${label}.consumer must be an object`)

  assert.equal(typeof entry.consumer.name, 'string', `${label}.consumer requires a name`)

  assert.ok(entry.consumer.name.trim().length > 0, `${label}.consumer requires a name`)

  assert.ok(
    entry.consumer.owner === null || typeof entry.consumer.owner === 'string',
    `${label}.consumer.owner must be null or a string`
  )

  assert.ok(
    entry.consumer.repository === null || typeof entry.consumer.repository === 'string',
    `${label}.consumer.repository must be null or a string`
  )

  validateStringArray(entry.platforms, `${label}.platforms`)

  validateStringArray(entry.minimumOperatingSystems, `${label}.minimumOperatingSystems`)

  validateStringArray(entry.supportedComponents, `${label}.supportedComponents`)

  validateStringArray(entry.compatibilityWorkarounds, `${label}.compatibilityWorkarounds`)

  validateStringArray(entry.evidence, `${label}.evidence`)

  validateStringArray(entry.blockingIssues, `${label}.blockingIssues`)

  assert.ok(entry.platforms.length > 0, `${label} requires at least one platform`)

  assert.ok(
    entry.toolchain === null || typeof entry.toolchain === 'string',
    `${label}.toolchain must be null or a string`
  )

  assert.ok(entry.supportedComponents.length > 0, `${label} requires supported component usage`)

  assert.ok(isRecord(entry.upgrade), `${label}.upgrade must be an object`)

  const fromVersion = parseOrdinaryVersion(entry.upgrade.fromVersion, `${label}.upgrade.fromVersion`)
  const toVersion = parseOrdinaryVersion(entry.upgrade.toVersion, `${label}.upgrade.toVersion`)

  assert.ok(isNewerVersion(toVersion, fromVersion), `${label} must record a real version upgrade`)

  assert.match(entry.upgrade.revision, /^[\da-f]{40}$/i, `${label} requires a full consumer revision`)

  assert.ok(isRecord(entry.checks), `${label}.checks must be an object`)

  assert.deepEqual(
    Object.keys(entry.checks).sort(),
    expectedChecks,
    `${label}.checks must cover the complete consumer matrix`
  )

  for (const [check, completed] of Object.entries(entry.checks)) {
    assert.equal(typeof completed, 'boolean', `${label}.checks.${check} must be Boolean`)
  }

  const completedChecks = Object.values(entry.checks).filter(Boolean).length

  if (entry.status === 'pending') {
    assert.equal(completedChecks, 0, `${label} pending checks must be false`)
  } else {
    assert.ok(completedChecks > 0, `${label} partial or complete evidence requires a completed check`)

    assert.ok(entry.evidence.length > 0, `${label} partial or complete evidence requires a record`)
  }

  if (entry.status === 'complete') {
    assert.equal(completedChecks, expectedChecks.length, `${label} complete evidence has unchecked items`)

    assert.equal(entry.blockingIssues.length, 0, `${label} complete evidence has blocking issues`)

    assert.ok(
      entry.minimumOperatingSystems.length > 0,
      `${label} complete evidence requires minimum operating-system targets`
    )

    assert.equal(typeof entry.toolchain, 'string', `${label} complete evidence requires a toolchain`)

    assert.ok(entry.toolchain.trim().length > 0, `${label} complete evidence requires a toolchain`)

    assert.equal(typeof entry.consumer.owner, 'string', `${label} complete evidence requires an owner`)

    assert.ok(entry.consumer.owner.trim().length > 0, `${label} complete evidence requires an owner`)

    assert.match(
      entry.consumer.repository,
      /^https:\/\/\S+$/,
      `${label} complete evidence requires an HTTPS consumer repository`
    )

    for (const evidence of entry.evidence) {
      assert.match(evidence, /^https:\/\/\S+$/, `${label} complete evidence must use immutable HTTPS records`)
    }
  } else {
    incompleteAdapters.push(label)
  }
}

assert.equal(ledger.schemaVersion, 1, 'Unsupported native consumer evidence schema')

assert.ok(Array.isArray(ledger.adapters), 'Native consumer adapters must be an array')

assert.deepEqual(
  ledger.adapters.map(adapter => adapter.id).sort(),
  expectedAdapterIds,
  'Native consumer evidence must cover every required adapter'
)

for (const entry of ledger.adapters) validateConsumer(entry)

if (requireComplete && incompleteAdapters.length > 0) {
  process.stderr.write(
    `Native real-consumer validation is incomplete: ${incompleteAdapters.join(', ')}\n`
  )

  process.exitCode = 1
}

if (requireComplete && incompleteAdapters.length === 0) {
  const soakLedgerPath = soakLedgerArgument
    ? resolve(repositoryRoot, soakLedgerArgument)
    : resolve(repositoryRoot, 'registry', 'native-stability-soak.json')

  const soakLedger = JSON.parse(await readFile(soakLedgerPath, 'utf8'))

  assert.equal(
    soakLedger.iterations?.length,
    2,
    'Complete consumer evidence requires both native stability iterations'
  )

  const versionKeys = {
    compose: 'compose',
    'react-native': 'reactNative',
    swiftui: 'swift',
    wear: 'wear'
  }

  for (const entry of ledger.adapters) {
    const versionKey = versionKeys[entry.id]

    assert.equal(
      entry.upgrade.fromVersion,
      soakLedger.iterations[0].versions[versionKey],
      `${entry.id} upgrade must start at native stability iteration 1`
    )

    assert.equal(
      entry.upgrade.toVersion,
      soakLedger.iterations[1].versions[versionKey],
      `${entry.id} upgrade must end at native stability iteration 2`
    )
  }
}

process.stdout.write(
  `Validated ${ledger.adapters.length} native real-consumer records; `
    + `${incompleteAdapters.length} remain incomplete.\n`
)
