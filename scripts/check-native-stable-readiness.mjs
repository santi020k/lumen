import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const repositoryRoot = resolve(import.meta.dirname, '..')

const readArgument = name => {
  const index = process.argv.indexOf(name)

  if (index === -1) return undefined

  const value = process.argv[index + 1]

  assert.ok(value && !value.startsWith('--'), `${name} requires a value`)

  return value
}

const reactNativeManifest = JSON.parse(
  await readFile(resolve(repositoryRoot, 'packages', 'react-native', 'package.json'), 'utf8')
)

const umbrellaManifest = JSON.parse(
  await readFile(resolve(repositoryRoot, 'packages', 'lumen', 'package.json'), 'utf8')
)

const gradleProperties = await readFile(
  resolve(repositoryRoot, 'packages', 'compose', 'gradle.properties'),
  'utf8'
)

const reactNativeVersion = readArgument('--react-native-version') ?? reactNativeManifest.version
const swiftVersion = readArgument('--swift-version') ?? umbrellaManifest.version
const soakLedger = readArgument('--soak-ledger')
const deviceLedger = readArgument('--device-ledger')

const composeVersion = readArgument('--compose-version')
  ?? /^lumenComposeVersion=(.+)$/m.exec(gradleProperties)?.[1]

const parseVersion = (adapter, version) => {
  assert.equal(typeof version, 'string', `${adapter} version is missing`)

  const match = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([0-9A-Za-z.-]+))?$/.exec(
    version
  )

  assert.ok(match, `${adapter} version is not semantic: ${version}`)

  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
    prerelease: match[4]
  }
}

const isAtLeast = (version, minimum) => {
  const current = [version.major, version.minor, version.patch]

  for (const [index, value] of current.entries()) {
    if (value > minimum[index]) return true

    if (value < minimum[index]) return false
  }

  return true
}

const versions = {
  Compose: {
    minimumStable: [1, 0, 0],
    raw: composeVersion,
    ...parseVersion('Compose', composeVersion)
  },
  'React Native': {
    minimumStable: [1, 0, 0],
    raw: reactNativeVersion,
    ...parseVersion('React Native', reactNativeVersion)
  },
  SwiftUI: {
    minimumStable: [1, 7, 0],
    raw: swiftVersion,
    ...parseVersion('SwiftUI', swiftVersion)
  }
}

const stableAdapters = Object.entries(versions)
  .filter(([, version]) => isAtLeast(version, version.minimumStable) && !version.prerelease)
  .map(([adapter, version]) => `${adapter} ${version.raw}`)

if (stableAdapters.length === 0) {
  process.stdout.write(
    `Native stable readiness is not required for React Native ${reactNativeVersion} and Compose `
      + `${composeVersion}, or SwiftUI ${swiftVersion}.\n`
  )

  process.exit(0)
}

process.stdout.write(`Native stable readiness is required for ${stableAdapters.join(' and ')}.\n`)

for (const check of [
  { ledger: soakLedger, script: 'check-native-prerelease-soak.mjs' },
  { ledger: deviceLedger, script: 'check-native-device-evidence.mjs' }
]) {
  const arguments_ = [
    resolve(repositoryRoot, 'scripts', check.script),
    '--require-complete',
    ...(check.ledger ? ['--ledger', check.ledger] : [])
  ]

  const result = spawnSync(process.execPath, arguments_, {
    cwd: repositoryRoot,
    encoding: 'utf8',
    stdio: 'inherit'
  })

  if (result.error) throw result.error

  if (result.status !== 0) process.exit(result.status ?? 1)
}

process.stdout.write('Native stable release gates are complete.\n')
