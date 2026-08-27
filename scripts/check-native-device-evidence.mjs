import assert from 'node:assert/strict'
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
  : resolve(repositoryRoot, 'registry', 'native-device-evidence.json')

const evidence = JSON.parse(
  await readFile(ledgerPath, 'utf8')
)

const requireComplete = process.argv.includes('--require-complete')

const expectedAdapters = {
  'compose-android': {
    adapter: 'Compose',
    minimumOperatingSystem: 'Android API 23',
    platform: 'Android'
  },
  'compose-wear': {
    adapter: 'Compose',
    minimumOperatingSystem: 'Wear OS API 30',
    platform: 'Wear OS'
  },
  'react-native-android': {
    adapter: 'React Native',
    minimumOperatingSystem: 'Android API 24',
    platform: 'Android'
  },
  'react-native-ios': {
    adapter: 'React Native',
    minimumOperatingSystem: 'iOS 15.1',
    platform: 'iOS'
  },
  'swiftui-ios': {
    adapter: 'SwiftUI',
    minimumOperatingSystem: 'iOS 16',
    platform: 'iOS'
  },
  'swiftui-macos': {
    adapter: 'SwiftUI',
    minimumOperatingSystem: 'macOS 13',
    platform: 'macOS'
  },
  'swiftui-visionos': {
    adapter: 'SwiftUI',
    minimumOperatingSystem: 'visionOS 1',
    platform: 'visionOS'
  },
  'swiftui-watchos': {
    adapter: 'SwiftUI',
    minimumOperatingSystem: 'watchOS 9',
    platform: 'watchOS'
  },
  'swift-widget-ios': {
    adapter: 'WidgetKit',
    minimumOperatingSystem: 'iOS 16',
    platform: 'iOS'
  },
  'swift-widget-macos': {
    adapter: 'WidgetKit',
    minimumOperatingSystem: 'macOS 13',
    platform: 'macOS'
  },
  'swift-widget-watchos': {
    adapter: 'WidgetKit',
    minimumOperatingSystem: 'watchOS 9',
    platform: 'watchOS'
  }
}

const expectedAdapterIds = Object.keys(expectedAdapters).sort()

const expectedChecks = [
  'alternateInput',
  'increasedContrast',
  'maximumTextScale',
  'reducedMotion',
  'responsiveLayout',
  'screenReader',
  'stateAndAnnouncements'
]

const incompletePasses = []

const isRecord = value => (
  typeof value === 'object' && value !== null && !Array.isArray(value)
)

const validateStringArray = (value, label) => {
  assert.ok(Array.isArray(value), `${label} must be an array`)

  for (const entry of value) {
    assert.equal(typeof entry, 'string', `${label} entries must be strings`)

    assert.ok(entry.length > 0, `${label} entries must not be empty`)
  }
}

const validatePass = (pass, label) => {
  assert.ok(isRecord(pass), `${label} must be an object`)

  assert.ok(
    ['complete', 'partial', 'pending'].includes(pass.status),
    `${label} has an invalid status`
  )

  assert.equal(typeof pass.targetDescription, 'string', `${label} requires a target description`)

  assert.ok(pass.targetDescription.length > 0, `${label} requires a target description`)

  assert.ok(
    pass.environment === null || isRecord(pass.environment),
    `${label}.environment must be null or an object`
  )

  validateStringArray(pass.evidence, `${label}.evidence`)

  validateStringArray(pass.blockingIssues, `${label}.blockingIssues`)

  assert.ok(isRecord(pass.checks), `${label}.checks must be an object`)

  assert.deepEqual(
    Object.keys(pass.checks).sort(),
    expectedChecks,
    `${label}.checks must cover the complete manual matrix`
  )

  for (const [check, completed] of Object.entries(pass.checks)) {
    assert.equal(typeof completed, 'boolean', `${label}.checks.${check} must be Boolean`)
  }

  const completedChecks = Object.values(pass.checks).filter(Boolean).length

  if (pass.status === 'pending') {
    assert.equal(pass.date, null, `${label} pending date must be null`)

    assert.equal(pass.revision, null, `${label} pending revision must be null`)

    assert.equal(pass.tester, null, `${label} pending tester must be null`)

    assert.equal(pass.environment, null, `${label} pending environment must be null`)

    assert.equal(pass.evidence.length, 0, `${label} pending evidence must be empty`)

    assert.equal(completedChecks, 0, `${label} pending checks must be false`)
  } else {
    assert.match(pass.date, /^\d{4}-\d{2}-\d{2}$/, `${label} requires an ISO date`)

    assert.equal(
      new Date(`${pass.date}T00:00:00.000Z`).toISOString().slice(0, 10),
      pass.date,
      `${label} requires a valid calendar date`
    )

    assert.match(pass.revision, /^[\da-f]{7,40}$/i, `${label} requires a Git revision`)

    assert.equal(typeof pass.tester, 'string', `${label} requires a tester`)

    assert.ok(pass.tester.length > 0, `${label} requires a tester`)

    assert.ok(isRecord(pass.environment), `${label} requires its physical environment`)

    assert.deepEqual(
      Object.keys(pass.environment).sort(),
      ['device', 'osVersion'],
      `${label}.environment must record the device and exact OS version`
    )

    for (const [field, value] of Object.entries(pass.environment)) {
      assert.equal(typeof value, 'string', `${label}.environment.${field} must be a string`)

      assert.ok(value.trim().length > 0, `${label}.environment.${field} must not be empty`)
    }

    assert.ok(pass.evidence.length > 0, `${label} requires evidence`)

    assert.ok(completedChecks > 0, `${label} partial or complete pass requires a completed check`)
  }

  if (pass.status === 'complete') {
    assert.match(pass.revision, /^[\da-f]{40}$/i, `${label} complete pass requires a full revision`)

    for (const entry of pass.evidence) {
      assert.match(entry, /^https:\/\/\S+$/, `${label} complete evidence must be an HTTPS URL`)
    }

    assert.equal(completedChecks, expectedChecks.length, `${label} complete pass has unchecked items`)

    assert.equal(pass.blockingIssues.length, 0, `${label} complete pass has blocking issues`)
  } else if (pass.status === 'partial') {
    assert.ok(pass.blockingIssues.length > 0, `${label} partial pass requires blocking issues`)

    incompletePasses.push(label)
  } else {
    incompletePasses.push(label)
  }
}

assert.equal(evidence.schemaVersion, 3, 'Unsupported native device evidence schema')

assert.ok(Array.isArray(evidence.adapters), 'Native device adapters must be an array')

assert.deepEqual(
  evidence.adapters.map(adapter => adapter.id).sort(),
  expectedAdapterIds,
  'Native device evidence must cover every required adapter and platform'
)

for (const adapter of evidence.adapters) {
  const expectedAdapter = expectedAdapters[adapter.id]

  assert.equal(adapter.adapter, expectedAdapter.adapter, `${adapter.id} has an unexpected adapter name`)

  assert.equal(adapter.platform, expectedAdapter.platform, `${adapter.id} has an unexpected platform name`)

  assert.equal(
    adapter.minimumOperatingSystem,
    expectedAdapter.minimumOperatingSystem,
    `${adapter.id} minimum operating system must match the supported package baseline`
  )

  assert.ok(
    adapter.minimum.targetDescription.includes(adapter.minimumOperatingSystem),
    `${adapter.id}.minimum target must name the supported package baseline`
  )

  validatePass(adapter.minimum, `${adapter.id}.minimum`)

  validatePass(adapter.current, `${adapter.id}.current`)
}

if (requireComplete) {
  if (incompletePasses.length > 0) {
    process.stderr.write(
      `Native physical-device validation is incomplete: ${incompletePasses.join(', ')}\n`
    )

    process.exitCode = 1
  }
}

process.stdout.write(
  `Validated ${evidence.adapters.length * 2} native physical-device evidence slots; `
    + `${incompletePasses.length} remain incomplete.\n`
)
