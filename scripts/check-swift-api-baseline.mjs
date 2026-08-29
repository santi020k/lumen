import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import {
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync
} from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'

const repositoryRoot = resolve(import.meta.dirname, '..')
const moduleIndex = process.argv.indexOf('--module')
const moduleName = moduleIndex >= 0 ? process.argv[moduleIndex + 1] : 'LumenUI'
const supportedModules = new Set(['LumenUI', 'LumenWidgetUI'])

assert.ok(moduleName && supportedModules.has(moduleName), 'Use --module LumenUI or --module LumenWidgetUI')

const baselinePath = resolve(
  repositoryRoot,
  moduleName === 'LumenUI' ? 'registry/swift-api-baseline.json' : 'registry/swift-widget-api-baseline.json'
)

const shouldUpdate = process.argv.includes('--update')
const expectedMaturity = 'stable'
const classificationNames = ['supported', 'experimental', 'deprecated', 'unclassified']
const classifyNewIndex = process.argv.indexOf('--classify-new')
const classifyNew = classifyNewIndex >= 0 ? process.argv[classifyNewIndex + 1] : undefined

assert.ok(
  classifyNew === undefined || classificationNames.includes(classifyNew),
  `Use --classify-new with one of: ${classificationNames.join(', ')}`
)

const platforms = [
  {
    destination: 'generic/platform=macOS',
    key: 'macOS',
    minimumVersion: '13',
    sdk: 'macosx',
    targetPlatform: 'macosx'
  },
  {
    destination: 'generic/platform=iOS Simulator',
    key: 'iOS',
    minimumVersion: '16',
    sdk: 'iphonesimulator',
    targetPlatform: 'ios'
  },
  {
    destination: 'generic/platform=tvOS Simulator',
    key: 'tvOS',
    minimumVersion: '16',
    sdk: 'appletvsimulator',
    targetPlatform: 'tvos'
  },
  {
    destination: 'generic/platform=visionOS Simulator',
    key: 'visionOS',
    minimumVersion: '1',
    sdk: 'xrsimulator',
    targetPlatform: 'xros'
  },
  {
    destination: 'generic/platform=watchOS Simulator',
    key: 'watchOS',
    minimumVersion: '9',
    sdk: 'watchsimulator',
    targetPlatform: 'watchos'
  }
]

const activePlatforms = moduleName === 'LumenWidgetUI' ?
  platforms.filter(platform => platform.key !== 'tvOS' && platform.key !== 'visionOS') :
  platforms

const execute = (command, arguments_, options = {}) =>
  execFileSync(command, arguments_, {
    cwd: repositoryRoot,
    encoding: 'utf8',
    stdio: options.capture ? ['ignore', 'pipe', 'inherit'] : 'inherit'
  })

const findDirectories = (root, name) => {
  const matches = []

  for (const entry of readdirSync(root)) {
    const path = join(root, entry)

    if (!statSync(path).isDirectory()) continue

    if (entry === name) matches.push(path)
    else matches.push(...findDirectories(path, name))
  }

  return matches
}

const getSdkValue = (sdk, flag) => execute('xcrun', ['--sdk', sdk, flag], { capture: true }).trim()

const normalizeSymbol = symbol => {
  const normalized = {
    declaration: symbol.declarationFragments.map(fragment => fragment.spelling).join(''),
    kind: symbol.kind.identifier,
    path: symbol.pathComponents,
    precise: symbol.identifier.precise
  }

  if (symbol.availability) normalized.availability = symbol.availability

  return normalized
}

const extractPlatformSymbols = (platform, temporaryRoot) => {
  const derivedData = join(temporaryRoot, `${platform.key}-derived-data`)
  const outputDirectory = join(temporaryRoot, `${platform.key}-symbols`)

  mkdirSync(outputDirectory)

  process.stdout.write(`Building and extracting ${platform.key} public API...\n`)

  execute('xcodebuild', [
    '-quiet',
    '-scheme',
    moduleName,
    '-destination',
    platform.destination,
    '-derivedDataPath',
    derivedData,
    'CODE_SIGNING_ALLOWED=NO',
    'build'
  ])

  const productsDirectory = join(derivedData, 'Build/Products')
  const moduleDirectories = findDirectories(productsDirectory, `${moduleName}.swiftmodule`)

  assert.equal(moduleDirectories.length, 1, `Expected one ${platform.key} ${moduleName}.swiftmodule`)

  const sdkPath = getSdkValue(platform.sdk, '--show-sdk-path')
  const sdkVersion = getSdkValue(platform.sdk, '--show-sdk-version')
  const simulatorSuffix = platform.sdk === 'macosx' ? '' : '-simulator'
  const target = `arm64-apple-${platform.targetPlatform}${sdkVersion}${simulatorSuffix}`

  execute('xcrun', [
    'swift-symbolgraph-extract',
    '-module-name',
    moduleName,
    '-I',
    dirname(moduleDirectories[0]),
    '-target',
    target,
    '-sdk',
    sdkPath,
    '-output-dir',
    outputDirectory,
    '-minimum-access-level',
    'public',
    '-skip-inherited-docs',
    '-skip-synthesized-members'
  ])

  const symbolsByIdentifier = new Map()

  const graphFiles = readdirSync(outputDirectory)
    .filter(file => file.endsWith('.symbols.json'))
    .sort()

  assert.ok(graphFiles.length > 0, `No ${platform.key} symbol graphs were generated`)

  for (const graphFile of graphFiles) {
    const graph = JSON.parse(readFileSync(join(outputDirectory, graphFile), 'utf8'))

    for (const symbol of graph.symbols) {
      if (symbol.accessLevel !== 'public') continue

      const normalized = normalizeSymbol(symbol)
      const existing = symbolsByIdentifier.get(normalized.precise)

      assert.ok(
        !existing || JSON.stringify(existing) === JSON.stringify(normalized),
        `${platform.key} emitted conflicting declarations for ${normalized.precise}`
      )

      symbolsByIdentifier.set(normalized.precise, normalized)
    }
  }

  return [...symbolsByIdentifier.values()].sort((left, right) =>
    left.precise.localeCompare(right.precise)
  )
}

const readBaseline = () => JSON.parse(readFileSync(baselinePath, 'utf8'))

const validatePlatformBaseline = (platformName, platformBaseline) => {
  const classified = []

  for (const classification of classificationNames) {
    const symbols = platformBaseline[classification]

    assert.ok(Array.isArray(symbols), `${platformName}.${classification} must be an array`)

    assert.deepEqual(
      symbols,
      [...symbols].sort((left, right) => left.precise.localeCompare(right.precise)),
      `${platformName}.${classification} must remain sorted by precise identifier`
    )

    classified.push(...symbols)
  }

  const identifiers = classified.map(symbol => symbol.precise)

  assert.equal(
    new Set(identifiers).size,
    identifiers.length,
    `${platformName} classifies at least one symbol more than once`
  )

  assert.equal(
    platformBaseline.unclassified.length,
    0,
    `${platformName} contains unclassified public symbols`
  )

  return classified.sort((left, right) => left.precise.localeCompare(right.precise))
}

const describeSymbol = symbol => `${symbol.path.join('.')} — ${symbol.declaration}`

const comparableSymbol = symbol => ({
  ...symbol,
  // Xcode 26 includes @Sendable in declaration fragments while Xcode 16 omits it even though the
  // precise symbol identifier retains the Sendable contract. Compare the stable identifier for
  // that semantic distinction and normalize the toolchain-only presentation difference.
  declaration: symbol.declaration.replaceAll('@Sendable ', '')
})

const compareSymbols = (platformName, expected, actual) => {
  const expectedByIdentifier = new Map(expected.map(symbol => [symbol.precise, symbol]))
  const actualByIdentifier = new Map(actual.map(symbol => [symbol.precise, symbol]))
  const removed = expected.filter(symbol => !actualByIdentifier.has(symbol.precise))
  const added = actual.filter(symbol => !expectedByIdentifier.has(symbol.precise))

  const changed = actual.filter(symbol => {
    const expectedSymbol = expectedByIdentifier.get(symbol.precise)

    return expectedSymbol &&
      JSON.stringify(comparableSymbol(expectedSymbol)) !== JSON.stringify(comparableSymbol(symbol))
  })

  if (removed.length === 0 && added.length === 0 && changed.length === 0) return

  const details = [
    ...removed.slice(0, 10).map(symbol => `removed: ${describeSymbol(symbol)}`),
    ...added.slice(0, 10).map(symbol => `added: ${describeSymbol(symbol)}`),
    ...changed.slice(0, 10).map(symbol => `changed: ${describeSymbol(symbol)}`)
  ]

  throw new Error(
    `${platformName} public API changed (${removed.length} removed, ${added.length} added, ` +
      `${changed.length} changed). Run the update command, review the diff, and classify every ` +
      `addition.\n${details.join('\n')}`
  )
}

const getClassificationsByIdentifier = existingPlatform => {
  const classificationsByIdentifier = new Map()

  if (!existingPlatform) return classificationsByIdentifier

  for (const classification of classificationNames) {
    for (const symbol of existingPlatform[classification]) {
      classificationsByIdentifier.set(symbol.precise, classification)
    }
  }

  return classificationsByIdentifier
}

const getUpdatedClassification = (
  classificationsByIdentifier,
  symbol,
  hasExistingBaseline
) => {
  const existingClassification = classificationsByIdentifier.get(symbol.precise)

  if (existingClassification && existingClassification !== 'unclassified') {
    return existingClassification
  }

  if (existingClassification === 'unclassified' && classifyNew) return classifyNew

  if (!hasExistingBaseline) return 'supported'

  return classifyNew ?? 'unclassified'
}

const createUpdatedBaseline = (extracted, existingBaseline) => {
  const updatedPlatforms = {}

  for (const platform of activePlatforms) {
    const existingPlatform = existingBaseline?.platforms?.[platform.key]
    const classificationsByIdentifier = getClassificationsByIdentifier(existingPlatform)
    const classified = Object.fromEntries(classificationNames.map(name => [name, []]))

    for (const symbol of extracted[platform.key]) {
      const classification = getUpdatedClassification(
        classificationsByIdentifier,
        symbol,
        existingBaseline !== undefined
      )

      classified[classification].push(symbol)
    }

    updatedPlatforms[platform.key] = {
      minimumVersion: platform.minimumVersion,
      ...classified
    }
  }

  return {
    schemaVersion: 1,
    module: moduleName,
    maturity: expectedMaturity,
    platforms: updatedPlatforms
  }
}

if (process.platform !== 'darwin') {
  throw new Error('The Swift API baseline requires macOS, Xcode, and the Apple platform SDKs')
}

const temporaryRoot = mkdtempSync(join(tmpdir(), 'lumen-swift-api-'))

try {
  const extracted = Object.fromEntries(
    activePlatforms.map(platform => [platform.key, extractPlatformSymbols(platform, temporaryRoot)])
  )

  if (shouldUpdate) {
    let existingBaseline

    try {
      existingBaseline = readBaseline()
    } catch (error) {
      if (error.code !== 'ENOENT') throw error
    }

    const updatedBaseline = createUpdatedBaseline(extracted, existingBaseline)

    writeFileSync(baselinePath, `${JSON.stringify(updatedBaseline, null, 2)}\n`)

    for (const platform of activePlatforms) {
      const baseline = updatedBaseline.platforms[platform.key]

      process.stdout.write(
        `Updated ${platform.key}: ${baseline.supported.length} supported, ` +
          `${baseline.experimental.length} experimental, ${baseline.deprecated.length} deprecated, ` +
          `${baseline.unclassified.length} unclassified.\n`
      )
    }
  } else {
    const baseline = readBaseline()

    assert.equal(baseline.schemaVersion, 1, 'Unsupported Swift API baseline schema version')

    assert.equal(baseline.module, moduleName, 'Unexpected Swift API baseline module')

    assert.equal(
      baseline.maturity,
      expectedMaturity,
      'Unexpected Swift API baseline maturity'
    )

    assert.deepEqual(
      Object.keys(baseline.platforms),
      activePlatforms.map(platform => platform.key),
      'Swift API baseline platforms changed'
    )

    for (const platform of activePlatforms) {
      const platformBaseline = baseline.platforms[platform.key]

      assert.equal(
        platformBaseline.experimental.length,
        0,
        `${platform.key} stable baseline contains experimental public symbols`
      )

      assert.equal(
        platformBaseline.minimumVersion,
        platform.minimumVersion,
        `${platform.key} minimum version changed`
      )

      const classified = validatePlatformBaseline(platform.key, platformBaseline)

      compareSymbols(platform.key, classified, extracted[platform.key])

      process.stdout.write(`Checked ${classified.length} classified ${platform.key} symbols.\n`)
    }
  }
} finally {
  rmSync(temporaryRoot, { recursive: true, force: true })
}
