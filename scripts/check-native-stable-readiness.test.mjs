import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import test from 'node:test'

const repositoryRoot = resolve(import.meta.dirname, '..')
const checkerPath = resolve(repositoryRoot, 'scripts', 'check-native-stable-readiness.mjs')
const deviceLedgerPath = resolve(repositoryRoot, 'registry', 'native-device-evidence.json')
const soakLedgerPath = resolve(repositoryRoot, 'registry', 'native-stability-soak.json')

const runChecker = arguments_ => spawnSync(process.execPath, [checkerPath, ...arguments_], {
  cwd: repositoryRoot,
  encoding: 'utf8'
})

const createSoakIteration = (ledger, index) => ({
  id: `native-soak.${index}`,
  date: `2026-09-0${index + 1}`,
  revision: `${index + 1}`.repeat(40),
  versions: {
    compose: `0.${index + 5}.0`,
    reactNative: `0.${index + 5}.0`,
    swift: `1.${index + 6}.0`,
    wear: `0.${index + 5}.0`
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

const completeDevicePass = (pass, index) => {
  pass.status = 'complete'

  pass.environment = {
    device: `Physical test device ${index}`,
    osVersion: `Platform ${index}.0`
  }

  pass.date = '2026-09-03'

  pass.revision = `${(index % 9) + 1}`.repeat(40)

  pass.tester = 'Native release tester'

  pass.evidence = [`https://github.com/santi020k/lumen/issues/${index + 1}`]

  pass.checks = Object.fromEntries(Object.keys(pass.checks).map(check => [check, true]))

  pass.blockingIssues = []
}

const withCompleteLedgers = async callback => {
  const temporaryDirectory = await mkdtemp(resolve(tmpdir(), 'lumen-native-stable-'))

  try {
    const soakLedger = JSON.parse(await readFile(soakLedgerPath, 'utf8'))
    const deviceLedger = JSON.parse(await readFile(deviceLedgerPath, 'utf8'))
    let passIndex = 0

    soakLedger.iterations = [createSoakIteration(soakLedger, 0), createSoakIteration(soakLedger, 1)]

    for (const adapter of deviceLedger.adapters) {
      completeDevicePass(adapter.minimum, passIndex)

      passIndex += 1

      completeDevicePass(adapter.current, passIndex)

      passIndex += 1
    }

    const temporarySoakPath = resolve(temporaryDirectory, 'soak.json')
    const temporaryDevicePath = resolve(temporaryDirectory, 'devices.json')

    await Promise.all([
      writeFile(temporarySoakPath, `${JSON.stringify(soakLedger, null, 2)}\n`),
      writeFile(temporaryDevicePath, `${JSON.stringify(deviceLedger, null, 2)}\n`)
    ])

    return callback({ deviceLedger: temporaryDevicePath, soakLedger: temporarySoakPath })
  } finally {
    await rm(temporaryDirectory, { force: true, recursive: true })
  }
}

test('does not require stable evidence for the current Beta adapters', () => {
  const result = runChecker([])

  assert.equal(result.status, 0, result.stderr)

  assert.match(result.stdout, /Native stable readiness is not required/)
})

test('does not treat release candidates as stable releases', () => {
  const result = runChecker([
    '--compose-version', '2.0.0-rc.1',
    '--react-native-version', '2.0.0-rc.1',
    '--swift-version', '2.0.0-rc.1'
  ])

  assert.equal(result.status, 0, result.stderr)

  assert.match(result.stdout, /Native stable readiness is not required/)
})

for (const release of [
  { adapter: 'Compose', arguments: ['--compose-version', '2.0.0'] },
  { adapter: 'React Native', arguments: ['--react-native-version', '2.0.0'] },
  { adapter: 'SwiftUI', arguments: ['--swift-version', '2.0.0'] }
]) {
  test(`rejects an uncoordinated ${release.adapter} version 2 launch`, () => {
    const result = runChecker(release.arguments)

    assert.equal(result.status, 1)

    assert.match(result.stderr, /Lumen 2 must launch every native adapter together/)
  })
}

test('blocks a coordinated version 2 launch while evidence is incomplete', () => {
  const result = runChecker([
    '--compose-version', '2.0.0',
    '--react-native-version', '2.0.0',
    '--swift-version', '2.0.0'
  ])

  assert.equal(result.status, 1)

  assert.match(result.stdout, /Native stable readiness is required for Compose 2\.0\.0/)

  assert.match(result.stderr, /Native stability soak is incomplete/)
})

test('allows a coordinated stable release after both evidence ledgers are complete', async () => {
  const result = await withCompleteLedgers(ledgers => runChecker([
    '--compose-version', '2.0.0',
    '--react-native-version', '2.0.0',
    '--swift-version', '2.0.0',
    '--soak-ledger', ledgers.soakLedger,
    '--device-ledger', ledgers.deviceLedger
  ]))

  assert.equal(result.status, 0, result.stderr)

  assert.match(result.stdout, /Validated 2\/2 native stability soak iterations/)

  assert.match(result.stdout, /14 native physical-device passes; 0 remain incomplete/)

  assert.match(result.stdout, /Native stable release gates are complete/)
})
