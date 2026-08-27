import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const repositoryRoot = resolve(import.meta.dirname, '..')

const sourcePath = resolve(
  repositoryRoot,
  'packages',
  'compose',
  'wear',
  'src',
  'main',
  'kotlin',
  'com',
  'santi020k',
  'lumen',
  'wear',
  'WearComponents.kt'
)

const [classification, api, source] = await Promise.all([
  readFile(resolve(repositoryRoot, 'registry', 'wear-api-classification.json'), 'utf8').then(JSON.parse),
  readFile(resolve(repositoryRoot, 'packages', 'compose', 'wear', 'api', 'wear.api'), 'utf8'),
  readFile(sourcePath, 'utf8')
])

assert.equal(classification.schemaVersion, 1, 'Unsupported Wear API classification schema')

const categories = ['experimental', 'internal', 'supported']
const classified = new Map()

for (const category of categories) {
  const identifiers = classification[category]

  assert.ok(Array.isArray(identifiers), `${category} must be an array`)

  assert.deepEqual(
    identifiers,
    [...identifiers].sort((left, right) => left.localeCompare(right)),
    `${category} identifiers must be sorted`
  )

  for (const identifier of identifiers) {
    assert.match(identifier, /^[A-Za-z][A-Za-z\d]*$/, `Invalid ${category} identifier: ${identifier}`)

    assert.ok(!classified.has(identifier), `${identifier} appears in more than one classification`)

    classified.set(identifier, category)
  }
}

const publicClasses = [...api.matchAll(/^public .* class com\/santi020k\/lumen\/([^\s{$]+).*$/gm)]
  .map(match => match[1])
  .filter(identifier => identifier !== 'WearComponentsKt' && !identifier.endsWith('$Companion'))

const publicFunctions = [...api.matchAll(/^\s*public static final fun ([A-Za-z][A-Za-z\d]*)(?:-|\s)/gm)]
  .map(match => match[1])

const publicIdentifiers = [...new Set([...publicClasses, ...publicFunctions])]
  .sort((left, right) => left.localeCompare(right))

const expectedPublicIdentifiers = [...classification.experimental, ...classification.supported]
  .sort((left, right) => left.localeCompare(right))

assert.deepEqual(
  publicIdentifiers,
  expectedPublicIdentifiers,
  'Wear public ABI and Supported/Experimental classifications differ'
)

if (classification.experimental.length > 0) {
  assert.match(
    source,
    /@RequiresOptIn\([\s\S]*?annotation class ExperimentalLumenWearApi/,
    'ExperimentalLumenWearApi must require an explicit consumer opt-in'
  )
} else {
  assert.doesNotMatch(
    source,
    /ExperimentalLumenWearApi/,
    'The obsolete experimental Wear opt-in must be removed once every Wear API is Supported'
  )
}

for (const identifier of classification.experimental) {
  if (identifier === 'ExperimentalLumenWearApi') continue

  assert.match(
    source,
    new RegExp(`@ExperimentalLumenWearApi\\s+(?:@Composable\\s+)?fun ${identifier}\\b`),
    `${identifier} must be visibly annotated Experimental in source`
  )
}

for (const identifier of classification.internal) {
  assert.ok(!publicIdentifiers.includes(identifier), `${identifier} must not appear in the public ABI`)

  assert.match(
    source,
    new RegExp(`internal (?:data class|fun) ${identifier}\\b`),
    `${identifier} must remain internal in source`
  )
}

process.stdout.write(
  `Validated ${classification.supported.length} Supported, `
    + `${classification.experimental.length} Experimental, and `
    + `${classification.internal.length} internal Wear API declarations.\n`
)
