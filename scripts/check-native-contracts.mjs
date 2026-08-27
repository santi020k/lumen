import assert from 'node:assert/strict'
import { readdir,readFile } from 'node:fs/promises'
import { extname, join, resolve } from 'node:path'

const repositoryRoot = resolve(import.meta.dirname, '..')
const registryPath = join(repositoryRoot, 'registry', 'native-components.json')
const documentationPath = join(repositoryRoot, 'docs', 'native-components.md')
const registry = JSON.parse(await readFile(registryPath, 'utf8'))
const documentation = await readFile(documentationPath, 'utf8')
const adapterNames = ['reactNative', 'swiftUI', 'compose']
const supportedExtensions = new Set(['.kt', '.swift', '.ts', '.tsx'])
const escapeRegExp = value => value.replaceAll(/[.*+?^${}()|[\]\\]/g, '\\$&')

const hasPublicSwiftSymbol = (source, symbol) => {
  const escapedSymbol = escapeRegExp(symbol)

  if (new RegExp(`public\\s+(?:class|enum|func|struct)\\s+${escapedSymbol}\\b`).test(source)) {
    return true
  }

  let extensionStart = source.indexOf('public extension ')

  while (extensionStart !== -1) {
    const bodyStart = source.indexOf('{', extensionStart)

    if (bodyStart === -1) return false

    let depth = 1
    let cursor = bodyStart + 1

    while (cursor < source.length && depth > 0) {
      if (source[cursor] === '{') depth += 1

      if (source[cursor] === '}') depth -= 1

      cursor += 1
    }

    const body = source.slice(bodyStart + 1, cursor - 1)

    if (new RegExp(`\\bfunc\\s+${escapedSymbol}\\b`).test(body)) return true

    extensionStart = source.indexOf('public extension ', cursor)
  }

  return false
}

const readSourceDirectory = async directory => {
  const entries = await readdir(directory, { withFileTypes: true })

  const contents = await Promise.all(entries.map(async entry => {
    const path = join(directory, entry.name)

    if (entry.isDirectory()) return readSourceDirectory(path)

    if (!supportedExtensions.has(extname(entry.name))) return ''

    return readFile(path, 'utf8')
  }))

  return contents.flat().join('\n')
}

assert.equal(registry.schemaVersion, 5, 'Unsupported native contract schema version')

assert.deepEqual(Object.keys(registry.adapters).sort(), [...adapterNames].sort())

assert.ok(Array.isArray(registry.components) && registry.components.length > 0)

assert.ok(Array.isArray(registry.platformComponents) && registry.platformComponents.length > 0)

const sourceByAdapter = Object.fromEntries(await Promise.all(adapterNames.map(async adapterName => {
  const adapter = registry.adapters[adapterName]

  assert.equal(typeof adapter.package, 'string')

  assert.equal(typeof adapter.sourceDirectory, 'string')

  return [
    adapterName,
    (
      await Promise.all(
        [adapter.sourceDirectory, ...(adapter.additionalSourceDirectories ?? [])]
          .map(directory => readSourceDirectory(join(repositoryRoot, directory)))
      )
    ).join('\n')
  ]
})))

const reactNativePublicSource = (
  await Promise.all((registry.adapters.reactNative.publicEntrypoints ?? ['index.ts']).map(entrypoint => (
    readFile(join(repositoryRoot, registry.adapters.reactNative.sourceDirectory, entrypoint), 'utf8')
  )))
).join('\n')

const ids = new Set()

for (const component of registry.components) {
  assert.equal(typeof component.id, 'string')

  assert.ok(!ids.has(component.id), `Duplicate native component id: ${component.id}`)

  ids.add(component.id)

  assert.ok(['shared', 'universal'].includes(component.tier), `Invalid tier for ${component.id}`)

  assert.ok(
    component.formFactor === undefined || component.formFactor === 'wearable',
    `Invalid form factor for ${component.id}`
  )

  assert.equal(typeof component.contract, 'string')

  assert.ok(component.contract.length > 0)

  assert.equal(typeof component.accessibility, 'string')

  assert.ok(component.accessibility.length > 0)

  const implementationEntries = Object.entries(component.symbols)

  assert.ok(implementationEntries.length > 0, `${component.id} must support at least one adapter`)

  const expectedAdapters = component.formFactor === 'wearable'
    ? ['compose', 'swiftUI']
    : adapterNames

  assert.deepEqual(
    implementationEntries.map(([adapterName]) => adapterName).sort(),
    [...expectedAdapters].sort(),
    component.formFactor === 'wearable'
      ? `${component.id} must support SwiftUI and Compose without adding wearable code to React Native`
      : `${component.id} must support every native adapter`
  )

  for (const [adapterName, symbol] of implementationEntries) {
    assert.ok(adapterNames.includes(adapterName), `${component.id} uses an unknown adapter ${adapterName}`)

    const escapedSymbol = escapeRegExp(symbol)

    assert.equal(typeof symbol, 'string', `${component.id} is missing ${adapterName} symbol`)

    assert.match(
      sourceByAdapter[adapterName],
      new RegExp(`\\b${escapedSymbol}\\b`),
      `${component.id} claims ${symbol} support in ${adapterName}, but no source symbol exists`
    )

    if (adapterName === 'reactNative') {
      assert.match(
        reactNativePublicSource,
        new RegExp(`\\b${escapedSymbol}\\b`),
        `${component.id} claims React Native support, but ${symbol} is not publicly exported`
      )
    }

    if (adapterName === 'swiftUI') {
      assert.ok(
        hasPublicSwiftSymbol(sourceByAdapter.swiftUI, symbol),
        `${component.id} claims SwiftUI support, but ${symbol} is not public`
      )
    }

    if (adapterName === 'compose') {
      assert.match(
        sourceByAdapter.compose,
        new RegExp(
          `(?:^|\\n)(?:@[^\\n]+\\n)*(?:(?:data|enum)\\s+class|class|fun(?:\\s+<[^>]+>)?|object)`
            + `\\s+${escapedSymbol}\\b`
        ),
        `${component.id} claims Compose support, but ${symbol} is not a public declaration`
      )
    }

    assert.ok(
      documentation.includes(`\`${symbol}\``),
      `${component.id} symbol ${symbol} is missing from docs/native-components.md`
    )
  }
}

const nativePlatforms = new Set([
  'Android',
  'iOS',
  'macOS',
  'tvOS',
  'visionOS',
  'watchOS'
])

for (const component of registry.platformComponents) {
  assert.equal(typeof component.id, 'string')

  assert.ok(!ids.has(component.id), `Duplicate native component id: ${component.id}`)

  ids.add(component.id)

  assert.ok(Array.isArray(component.platforms) && component.platforms.length > 0)

  for (const platform of component.platforms) {
    assert.ok(nativePlatforms.has(platform), `Unsupported native platform for ${component.id}`)
  }

  assert.ok(adapterNames.includes(component.adapter), `${component.id} uses an unknown adapter`)

  assert.equal(typeof component.contract, 'string')

  assert.ok(component.contract.length > 0)

  assert.equal(typeof component.accessibility, 'string')

  assert.ok(component.accessibility.length > 0)

  assert.equal(typeof component.symbol, 'string')

  const escapedSymbol = escapeRegExp(component.symbol)

  assert.match(sourceByAdapter[component.adapter], new RegExp(`\\b${escapedSymbol}\\b`))

  if (component.adapter === 'reactNative') {
    assert.match(
      reactNativePublicSource,
      new RegExp(`\\b${escapedSymbol}\\b`),
      `${component.id} claims React Native support, but ${component.symbol} is not publicly exported`
    )
  }

  if (component.adapter === 'swiftUI') {
    assert.ok(
      hasPublicSwiftSymbol(sourceByAdapter.swiftUI, component.symbol),
      `${component.id} claims SwiftUI support, but ${component.symbol} is not public`
    )
  }

  if (component.adapter === 'compose') {
    assert.match(
      sourceByAdapter.compose,
      new RegExp(
        `(?:^|\\n)(?:@[^\\n]+\\n)*(?:(?:data|enum)\\s+class|class|fun(?:\\s+<[^>]+>)?)`
          + `\\s+${escapedSymbol}\\b`
      ),
      `${component.id} claims Compose support, but ${component.symbol} is not public`
    )
  }

  assert.ok(
    documentation.includes(`\`${component.symbol}\``),
    `${component.id} symbol ${component.symbol} is missing from docs/native-components.md`
  )
}

assert.match(
  await readFile(join(repositoryRoot, 'Package.swift'), 'utf8'),
  /\.library\(name: "LumenUI"/,
  'The repository-root Swift package must expose the LumenUI product'
)

process.stdout.write(
  `Checked ${registry.components.length} shared native contracts and `
    + `${registry.platformComponents.length} platform contracts across ${adapterNames.length} adapters.\n`
)
