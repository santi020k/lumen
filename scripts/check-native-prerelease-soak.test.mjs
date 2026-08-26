import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import test from 'node:test'

const repositoryRoot = resolve(import.meta.dirname, '..')
const checkerPath = resolve(repositoryRoot, 'scripts', 'check-native-prerelease-soak.mjs')
const sourceLedgerPath = resolve(repositoryRoot, 'registry', 'native-prerelease-soak.json')

const createIteration = (ledger, index) => ({
  id: `native-rc.${index}`,
  date: `2026-09-0${index + 1}`,
  revision: `${index + 1}`.repeat(40),
  versions: {
    compose: `1.0.0-rc.${index}`,
    reactNative: `1.0.0-rc.${index}`,
    swift: `1.7.0-rc.${index}`,
    wear: `1.0.0-rc.${index}`
  },
  baselines: Object.fromEntries(
    Object.entries(ledger.baselines).map(([adapter, baseline]) => [adapter, baseline.sha256])
  ),
  evidence: {
    releaseVerificationUrl: `https://github.com/santi020k/lumen/actions/runs/${index + 1}`,
    consumerValidation: {
      compose: `https://github.com/example/compose/releases/${index + 1}`,
      reactNative: `https://github.com/example/react-native/releases/${index + 1}`,
      swiftUI: `https://github.com/example/swift/releases/${index + 1}`,
      wear: `https://github.com/example/wear/releases/${index + 1}`
    }
  }
})

const runLedger = async (mutate, checkerArguments = []) => {
  const temporaryDirectory = await mkdtemp(resolve(tmpdir(), 'lumen-native-soak-'))

  try {
    const ledger = JSON.parse(await readFile(sourceLedgerPath, 'utf8'))

    ledger.iterations = [createIteration(ledger, 0), createIteration(ledger, 1)]

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

test('accepts two chronological public release-candidate iterations', async () => {
  const result = await runLedger(() => {})

  assert.equal(result.status, 0, result.stderr)

  assert.match(result.stdout, /Validated 2\/2 native prerelease soak iterations/)
})

test('requires both iterations in readiness mode', async () => {
  const result = await runLedger(ledger => {
    ledger.iterations.pop()
  }, ['--require-complete'])

  assert.equal(result.status, 1)

  assert.match(result.stderr, /Native prerelease soak is incomplete: 1 iteration\(s\) remain/)
})

test('rejects a consumer record without an immutable HTTPS URL', async () => {
  const result = await runLedger(ledger => {
    ledger.iterations[0].evidence.consumerValidation.wear = 'local playground passed'
  })

  assert.equal(result.status, 1)

  assert.match(result.stderr, /requires an immutable HTTPS consumer evidence URL/)
})

test('rejects a release verification URL outside the repository workflow', async () => {
  const result = await runLedger(ledger => {
    ledger.iterations[0].evidence.releaseVerificationUrl = 'https://example.com/run/1'
  })

  assert.equal(result.status, 1)

  assert.match(result.stderr, /successful published-native verification workflow URL/)
})

test('rejects a version that does not match the iteration RC sequence', async () => {
  const result = await runLedger(ledger => {
    ledger.iterations[1].versions.compose = '1.0.0-rc.0'
  })

  assert.equal(result.status, 1)

  assert.match(result.stderr, /must record its exact rc\.1 semantic version/)
})
