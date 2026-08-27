import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import test from 'node:test'

const repositoryRoot = resolve(import.meta.dirname, '..')
const checkerPath = resolve(repositoryRoot, 'scripts', 'check-native-device-evidence.mjs')
const sourceLedgerPath = resolve(repositoryRoot, 'registry', 'native-device-evidence.json')

const completePass = (pass, index) => {
  pass.status = 'complete'

  pass.environment = {
    device: `Physical test device ${index}`,
    osVersion: `Platform ${index}.0`
  }

  pass.date = '2026-08-20'

  pass.revision = `${(index % 9) + 1}`.repeat(40)

  pass.tester = 'Native release tester'

  pass.evidence = [
    `https://github.com/santi020k/lumen/commit/${pass.revision}`,
    `https://github.com/santi020k/lumen/actions/runs/${index + 1}`
  ]

  pass.checks = Object.fromEntries(Object.keys(pass.checks).map(check => [check, true]))

  pass.blockingIssues = []
}

const runLedger = async (mutate, checkerArguments = []) => {
  const temporaryDirectory = await mkdtemp(resolve(tmpdir(), 'lumen-native-devices-'))

  try {
    const ledger = JSON.parse(await readFile(sourceLedgerPath, 'utf8'))
    let passIndex = 0

    for (const adapter of ledger.adapters) {
      completePass(adapter.minimum, passIndex)

      passIndex += 1

      completePass(adapter.current, passIndex)

      passIndex += 1
    }

    mutate(ledger)

    const ledgerPath = resolve(temporaryDirectory, 'ledger.json')

    await writeFile(ledgerPath, `${JSON.stringify(ledger, null, 2)}\n`)

    return spawnSync(process.execPath, [checkerPath, '--ledger', ledgerPath, ...checkerArguments], {
      cwd: repositoryRoot,
      encoding: 'utf8'
    })
  } finally {
    await rm(temporaryDirectory, { force: true, recursive: true })
  }
}

test('accepts a complete physical-device matrix in readiness mode', async () => {
  const result = await runLedger(() => {}, ['--require-complete'])

  assert.equal(result.status, 0, result.stderr)

  assert.match(result.stdout, /22 native physical-device evidence slots; 0 remain incomplete/)
})

test('rejects a complete pass without an actual device environment', async () => {
  const result = await runLedger(ledger => {
    ledger.adapters[0].minimum.environment = null
  })

  assert.equal(result.status, 1)

  assert.match(result.stderr, /requires its physical environment/)
})

test('rejects an invalid calendar date', async () => {
  const result = await runLedger(ledger => {
    ledger.adapters[0].minimum.date = '2026-02-30'
  })

  assert.equal(result.status, 1)

  assert.match(result.stderr, /requires a valid calendar date/)
})

test('rejects a physical-device pass dated in the future', async () => {
  const result = await runLedger(ledger => {
    ledger.adapters[0].minimum.date = '9999-12-31'
  })

  assert.equal(result.status, 1)

  assert.match(result.stderr, /date must not be in the future/)
})

test('rejects a shortened revision for a complete pass', async () => {
  const result = await runLedger(ledger => {
    ledger.adapters[0].minimum.revision = 'abcdef0'
  })

  assert.equal(result.status, 1)

  assert.match(result.stderr, /complete pass requires a full lowercase revision/)
})

test('rejects complete evidence that is not an immutable HTTPS URL', async () => {
  const result = await runLedger(ledger => {
    ledger.adapters[0].minimum.evidence[0] = 'manual test passed'
  })

  assert.equal(result.status, 1)

  assert.match(result.stderr, /must be a valid HTTPS URL/)
})

test('rejects complete evidence on a mutable workflow definition', async () => {
  const result = await runLedger(ledger => {
    ledger.adapters[0].minimum.evidence[1] =
      'https://github.com/santi020k/lumen/actions/workflows/native-release.yml'
  })

  assert.equal(result.status, 1)

  assert.match(result.stderr, /must use immutable revision or permanent run URLs/)
})

test('rejects complete evidence for a different tested revision', async () => {
  const result = await runLedger(ledger => {
    ledger.adapters[0].minimum.evidence[0] =
      `https://github.com/santi020k/lumen/commit/${'f'.repeat(40)}`
  })

  assert.equal(result.status, 1)

  assert.match(result.stderr, /must include the exact tested revision/)
})

test('rejects a workflow URL that merely contains the tested revision', async () => {
  const result = await runLedger(ledger => {
    const pass = ledger.adapters[0].minimum

    pass.evidence = [
      `https://github.com/santi020k/lumen/actions/runs/1/${pass.revision}`,
      'https://github.com/santi020k/lumen/actions/runs/2'
    ]
  })

  assert.equal(result.status, 1)

  assert.match(result.stderr, /must include the exact tested revision/)
})

test('rejects revision evidence from a repository other than Lumen', async () => {
  const result = await runLedger(ledger => {
    const pass = ledger.adapters[0].minimum

    pass.evidence = [
      `https://github.com/example/native-tests/commit/${pass.revision}`,
      'https://github.com/example/native-tests/actions/runs/1'
    ]
  })

  assert.equal(result.status, 1)

  assert.match(result.stderr, /must include the exact tested revision/)
})

test('rejects complete evidence without a permanent physical-test record', async () => {
  const result = await runLedger(ledger => {
    const pass = ledger.adapters[0].minimum

    pass.evidence = [
      `https://github.com/santi020k/lumen/commit/${pass.revision}`,
      `https://github.com/santi020k/lumen/commits/${pass.revision}`
    ]
  })

  assert.equal(result.status, 1)

  assert.match(result.stderr, /must include a permanent physical-test record/)
})

test('rejects complete evidence with query state', async () => {
  const result = await runLedger(ledger => {
    ledger.adapters[0].minimum.evidence[1] =
      'https://github.com/santi020k/lumen/actions/runs/1?attempt=1'
  })

  assert.equal(result.status, 1)

  assert.match(result.stderr, /must not use a query string/)
})

test('rejects complete evidence with fragment state', async () => {
  const result = await runLedger(ledger => {
    ledger.adapters[0].minimum.evidence[1] =
      'https://github.com/santi020k/lumen/actions/runs/1#physical-test'
  })

  assert.equal(result.status, 1)

  assert.match(result.stderr, /must not use a fragment/)
})

test('rejects uppercase complete revisions', async () => {
  const result = await runLedger(ledger => {
    const pass = ledger.adapters[0].minimum

    pass.revision = 'A'.repeat(40)

    pass.evidence[0] = `https://github.com/santi020k/lumen/commit/${pass.revision}`
  })

  assert.equal(result.status, 1)

  assert.match(result.stderr, /requires a full lowercase revision/)
})

test('rejects a minimum operating system that differs from the supported package baseline', async () => {
  const result = await runLedger(ledger => {
    ledger.adapters.find(adapter => adapter.id === 'react-native-android').minimumOperatingSystem = 'Android API 23'
  })

  assert.equal(result.status, 1)

  assert.match(result.stderr, /minimum operating system must match the supported package baseline/)
})

test('rejects a minimum device target that omits its supported package baseline', async () => {
  const result = await runLedger(ledger => {
    ledger.adapters[0].minimum.targetDescription = 'Old phone'
  })

  assert.equal(result.status, 1)

  assert.match(result.stderr, /minimum target must name the supported package baseline/)
})

test('rejects a matrix that omits WidgetKit physical-device coverage', async () => {
  const result = await runLedger(ledger => {
    ledger.adapters = ledger.adapters.filter(adapter => adapter.id !== 'swift-widget-watchos')
  })

  assert.equal(result.status, 1)

  assert.match(result.stderr, /must cover every required adapter and platform/)
})

test('rejects a partial pass without explicit blocking issues', async () => {
  const result = await runLedger(ledger => {
    ledger.adapters[0].minimum.status = 'partial'

    ledger.adapters[0].minimum.blockingIssues = []
  })

  assert.equal(result.status, 1)

  assert.match(result.stderr, /partial pass requires blocking issues/)
})
