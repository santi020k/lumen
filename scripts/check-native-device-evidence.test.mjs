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

  pass.date = '2026-09-01'

  pass.revision = `${(index % 9) + 1}`.repeat(40)

  pass.tester = 'Native release tester'

  pass.evidence = [`https://github.com/santi020k/lumen/issues/${index + 1}`]

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

  assert.match(result.stdout, /14 native physical-device evidence slots; 0 remain incomplete/)
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

test('rejects a shortened revision for a complete pass', async () => {
  const result = await runLedger(ledger => {
    ledger.adapters[0].minimum.revision = 'abcdef0'
  })

  assert.equal(result.status, 1)

  assert.match(result.stderr, /complete pass requires a full revision/)
})

test('rejects complete evidence that is not an immutable HTTPS URL', async () => {
  const result = await runLedger(ledger => {
    ledger.adapters[0].minimum.evidence = ['manual test passed']
  })

  assert.equal(result.status, 1)

  assert.match(result.stderr, /complete evidence must be an HTTPS URL/)
})
