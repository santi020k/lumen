import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import test from 'node:test'

const repositoryRoot = resolve(import.meta.dirname, '..')
const checkerPath = resolve(repositoryRoot, 'scripts', 'check-native-consumer-evidence.mjs')
const sourceLedgerPath = resolve(repositoryRoot, 'registry', 'native-consumer-evidence.json')
const sourceSoakLedgerPath = resolve(repositoryRoot, 'registry', 'native-stability-soak.json')

const completeEntry = (entry, index) => {
  entry.status = 'complete'

  entry.consumer.owner = `Product owner ${index}`

  entry.consumer.repository = `https://github.com/example/consumer-${index}`

  entry.minimumOperatingSystems = [`Platform ${index}.0`]

  entry.toolchain = `Native toolchain ${index}`

  entry.checks = Object.fromEntries(Object.keys(entry.checks).map(check => [check, true]))

  entry.evidence = [
    `https://github.com/example/consumer-${index}/commit/${entry.upgrade.revision}`,
    `https://github.com/example/consumer-${index}/actions/runs/${index + 1}`
  ]

  entry.blockingIssues = []
}

const runLedger = async (mutate, checkerArguments = []) => {
  const temporaryDirectory = await mkdtemp(resolve(tmpdir(), 'lumen-native-consumers-'))

  try {
    const ledger = JSON.parse(await readFile(sourceLedgerPath, 'utf8'))
    const soakLedger = JSON.parse(await readFile(sourceSoakLedgerPath, 'utf8'))
    const adapters = Object.fromEntries(ledger.adapters.map(entry => [entry.id, entry]))

    adapters['swift-widget'].upgrade = {
      ...adapters.swiftui.upgrade
    }

    soakLedger.iterations = ['fromVersion', 'toVersion'].map(versionField => ({
      versions: {
        compose: adapters.compose.upgrade[versionField],
        reactNative: adapters['react-native'].upgrade[versionField],
        swift: adapters.swiftui.upgrade[versionField],
        wear: adapters.wear.upgrade[versionField]
      }
    }))

    ledger.adapters.forEach(completeEntry)

    mutate(ledger)

    const ledgerPath = resolve(temporaryDirectory, 'ledger.json')
    const soakLedgerPath = resolve(temporaryDirectory, 'soak.json')

    await Promise.all([
      writeFile(ledgerPath, `${JSON.stringify(ledger, null, 2)}\n`),
      writeFile(soakLedgerPath, `${JSON.stringify(soakLedger, null, 2)}\n`)
    ])

    return spawnSync(
      process.execPath,
      [checkerPath, '--ledger', ledgerPath, '--soak-ledger', soakLedgerPath, ...checkerArguments],
      { cwd: repositoryRoot, encoding: 'utf8' }
    )
  } finally {
    await rm(temporaryDirectory, { force: true, recursive: true })
  }
}

test('accepts a complete real-consumer matrix in readiness mode', async () => {
  const result = await runLedger(() => {}, ['--require-complete'])

  assert.equal(result.status, 0, result.stderr)

  assert.match(result.stdout, /5 native real-consumer records; 0 remain incomplete/)
})

test('reports the checked-in partial matrix as incomplete in readiness mode', () => {
  const result = spawnSync(process.execPath, [checkerPath, '--require-complete'], {
    cwd: repositoryRoot,
    encoding: 'utf8'
  })

  assert.equal(result.status, 1)

  assert.match(result.stderr, /Native real-consumer validation is incomplete/)
})

test('rejects a missing adapter record', async () => {
  const result = await runLedger(ledger => {
    ledger.adapters.pop()
  })

  assert.equal(result.status, 1)

  assert.match(result.stderr, /must cover every required adapter/)
})

test('rejects a prerelease as upgrade evidence', async () => {
  const result = await runLedger(ledger => {
    ledger.adapters[0].upgrade.toVersion = '0.5.0-rc.1'
  })

  assert.equal(result.status, 1)

  assert.match(result.stderr, /must be an ordinary semantic version/)
})

test('allows a pending consumer without fabricated upgrade evidence', () => {
  const result = spawnSync(process.execPath, [checkerPath], {
    cwd: repositoryRoot,
    encoding: 'utf8'
  })

  assert.equal(result.status, 0, result.stderr)

  assert.match(result.stdout, /5 native real-consumer records/)
})

test('rejects complete WidgetKit evidence without an upgrade', async () => {
  const result = await runLedger(ledger => {
    const widget = ledger.adapters.find(entry => entry.id === 'swift-widget')

    widget.upgrade = null
  })

  assert.equal(result.status, 1)

  assert.match(result.stderr, /swift-widget\.upgrade must be an object/)
})

test('rejects complete evidence without an owner', async () => {
  const result = await runLedger(ledger => {
    ledger.adapters[0].consumer.owner = null
  })

  assert.equal(result.status, 1)

  assert.match(result.stderr, /complete evidence requires an owner/)
})

test('rejects built partial evidence without minimum OS targets', async () => {
  const result = await runLedger(ledger => {
    ledger.adapters[0].status = 'partial'

    ledger.adapters[0].minimumOperatingSystems = []
  })

  assert.equal(result.status, 1)

  assert.match(result.stderr, /built consumer evidence requires minimum operating-system targets/)
})

test('rejects built partial evidence without an exact toolchain', async () => {
  const result = await runLedger(ledger => {
    ledger.adapters[0].status = 'partial'

    ledger.adapters[0].toolchain = null
  })

  assert.equal(result.status, 1)

  assert.match(result.stderr, /built consumer evidence requires a toolchain/)
})

test('rejects complete evidence that is not an HTTPS record', async () => {
  const result = await runLedger(ledger => {
    ledger.adapters[0].evidence[0] = 'local build passed'
  })

  assert.equal(result.status, 1)

  assert.match(result.stderr, /must be a valid HTTPS URL/)
})

test('rejects complete evidence backed by a disguised Lumen fixture', async () => {
  const result = await runLedger(ledger => {
    ledger.adapters[0].consumer.repository = 'https://github.com/santi020k/lumen.git/'
  })

  assert.equal(result.status, 1)

  assert.match(result.stderr, /cannot qualify with a Lumen-owned fixture/)
})

test('rejects evidence from a repository other than the declared consumer', async () => {
  const result = await runLedger(ledger => {
    const entry = ledger.adapters[0]

    entry.evidence = [
      `https://github.com/example/unrelated-consumer/commit/${entry.upgrade.revision}`,
      'https://github.com/example/unrelated-consumer/actions/runs/1'
    ]
  })

  assert.equal(result.status, 1)

  assert.match(result.stderr, /must belong to the declared consumer repository/)
})

test('rejects arbitrary HTTPS pages as mutable evidence', async () => {
  const result = await runLedger(ledger => {
    ledger.adapters[0].evidence[1] = 'https://github.com/example/consumer-0/actions/workflows/lumen-canary.yml'
  })

  assert.equal(result.status, 1)

  assert.match(result.stderr, /must use immutable workflow or revision URLs/)
})

test('rejects evidence for a different consumer revision', async () => {
  const result = await runLedger(ledger => {
    ledger.adapters[0].evidence[0] = `https://github.com/example/consumer-0/commit/${'f'.repeat(40)}`
  })

  assert.equal(result.status, 1)

  assert.match(result.stderr, /must include the exact consumer revision/)
})

test('rejects a workflow URL that merely contains the consumer revision', async () => {
  const result = await runLedger(ledger => {
    const entry = ledger.adapters[0]

    entry.evidence = [
      `https://github.com/example/consumer-0/actions/runs/1/${entry.upgrade.revision}`,
      'https://github.com/example/consumer-0/actions/runs/2'
    ]
  })

  assert.equal(result.status, 1)

  assert.match(result.stderr, /must include the exact consumer revision/)
})

test('rejects complete evidence without an immutable workflow or build', async () => {
  const result = await runLedger(ledger => {
    ledger.adapters[0].evidence = [
      `https://github.com/example/consumer-0/commit/${ledger.adapters[0].upgrade.revision}`,
      `https://github.com/example/consumer-0/blob/${ledger.adapters[0].upgrade.revision}/README.md`
    ]
  })

  assert.equal(result.status, 1)

  assert.match(result.stderr, /must include an immutable workflow or build URL/)
})

test('rejects pending evidence that claims a record', async () => {
  const result = await runLedger(ledger => {
    const entry = ledger.adapters[0]

    entry.status = 'pending'

    entry.checks = Object.fromEntries(Object.keys(entry.checks).map(check => [check, false]))

    entry.blockingIssues = ['Qualification is pending.']
  })

  assert.equal(result.status, 1)

  assert.match(result.stderr, /pending evidence must be empty/)
})

test('rejects an upgrade outside the two stability iterations', async () => {
  const result = await runLedger(ledger => {
    ledger.adapters[0].upgrade.fromVersion = '0.3.0'
  }, ['--require-complete'])

  assert.equal(result.status, 1)

  assert.match(result.stderr, /upgrade must start at native stability iteration 1/)
})
