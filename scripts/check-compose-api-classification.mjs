import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const repositoryRoot = resolve(import.meta.dirname, '..')
const apiPath = resolve(repositoryRoot, 'packages', 'compose', 'api', 'lumen-compose.api')
const classificationArgumentIndex = process.argv.indexOf('--classification')
const phoneSourceArgumentIndex = process.argv.indexOf('--phone-source')

const classificationArgument = classificationArgumentIndex === -1
  ? undefined
  : process.argv[classificationArgumentIndex + 1]

assert.ok(
  classificationArgumentIndex === -1 || classificationArgument,
  'The --classification option requires a JSON file path'
)

const phoneSourceArgument = phoneSourceArgumentIndex === -1
  ? undefined
  : process.argv[phoneSourceArgumentIndex + 1]

assert.ok(
  phoneSourceArgumentIndex === -1 || phoneSourceArgument,
  'The --phone-source option requires a Kotlin file path'
)

const classificationPath = classificationArgument
  ? resolve(repositoryRoot, classificationArgument)
  : resolve(repositoryRoot, 'registry', 'compose-api-classification.json')

const phoneSourcePath = phoneSourceArgument
  ? resolve(repositoryRoot, phoneSourceArgument)
  : resolve(
      repositoryRoot,
      'packages',
      'compose',
      'src',
      'main',
      'kotlin',
      'com',
      'santi020k',
      'lumen',
      'PhoneComponents.kt'
    )

const [api, classification, phoneSource] = await Promise.all([
  readFile(apiPath, 'utf8'),
  readFile(classificationPath, 'utf8').then(JSON.parse),
  readFile(phoneSourcePath, 'utf8')
])

assert.equal(classification.schemaVersion, 1, 'Unsupported Compose API classification schema')

const categories = ['deprecated', 'experimental', 'supported']
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
    assert.match(
      identifier,
      /^[A-Za-z][A-Za-z\d]*(?:\$[A-Za-z][A-Za-z\d]*)?$/,
      `Invalid ${category} identifier: ${identifier}`
    )

    assert.ok(!classified.has(identifier), `${identifier} appears in more than one classification`)

    classified.set(identifier, category)
  }
}

const fileFacades = new Set([
  'AdditionalComponentsKt',
  'ChartComponentsKt',
  'ContentComponentsKt',
  'FormComponentsKt',
  'LumenThemeKt',
  'MediaComponentsKt',
  'OverlayComponentsKt',
  'PhoneComponentsKt',
  'PlatformComponentsKt',
  'PrimitivesKt',
  'SelectionComponentsKt',
  'SharedComponentsKt',
  'StructuredComponentsKt'
])

const publicIdentifiers = []
const apiBlocks = api.trim().split(/\n\n(?=public )/u)

for (const block of apiBlocks) {
  const classMatch = /^public .* class com\/santi020k\/lumen\/([^\s{:]+)/u.exec(block)

  if (!classMatch) continue

  const identifier = classMatch[1]

  if (fileFacades.has(identifier)) {
    const functions = block.matchAll(
      /^\s*public static final fun ([A-Za-z][A-Za-z\d]*)(?:-|\s)/gmu
    )

    for (const functionMatch of functions) publicIdentifiers.push(functionMatch[1])
  } else if (!identifier.endsWith('$Companion')) {
    publicIdentifiers.push(identifier)
  }
}

const uniquePublicIdentifiers = [...new Set(publicIdentifiers)]
  .sort((left, right) => left.localeCompare(right))

const expectedPublicIdentifiers = categories
  .flatMap(category => classification[category])
  .sort((left, right) => left.localeCompare(right))

assert.deepEqual(
  uniquePublicIdentifiers,
  expectedPublicIdentifiers,
  'Compose public ABI and maturity classifications differ'
)

assert.match(
  phoneSource,
  /@RequiresOptIn\([\s\S]*?annotation class ExperimentalLumenPhoneApi/u,
  'ExperimentalLumenPhoneApi must require an explicit consumer opt-in'
)

const isAnnotationNameCharacter = character =>
  character !== undefined && /[A-Za-z\d_.:]/u.test(character)

const skipWhitespace = (source, start) => {
  let cursor = start

  while (cursor < source.length && /\s/u.test(source[cursor])) cursor += 1

  return cursor
}

const skipQuotedString = (source, start) => {
  const quote = source[start]
  let cursor = start + 1

  while (cursor < source.length) {
    if (source[cursor] === '\\') {
      cursor += 2
    } else if (source[cursor] === quote) {
      return cursor + 1
    } else {
      cursor += 1
    }
  }

  return cursor
}

const skipAnnotationArguments = (source, start) => {
  let cursor = start
  let depth = 0

  while (cursor < source.length) {
    const character = source[cursor]

    if (character === '"' || character === "'") {
      cursor = skipQuotedString(source, cursor)

      continue
    }

    if (character === '(') depth += 1

    if (character === ')') {
      depth -= 1

      if (depth === 0) return cursor + 1
    }

    cursor += 1
  }

  return cursor
}

const skipAnnotation = (source, start) => {
  let cursor = start + 1

  while (isAnnotationNameCharacter(source[cursor])) cursor += 1

  cursor = skipWhitespace(source, cursor)

  if (source[cursor] !== '(') return cursor

  return skipAnnotationArguments(source, cursor)
}

const extractExperimentalDeclarations = source => {
  const annotation = '@ExperimentalLumenPhoneApi'
  const declarations = []
  let searchStart = 0

  while (searchStart < source.length) {
    const annotationStart = source.indexOf(annotation, searchStart)

    if (annotationStart === -1) break

    let cursor = skipWhitespace(source, annotationStart + annotation.length)

    while (source[cursor] === '@') {
      cursor = skipWhitespace(source, skipAnnotation(source, cursor))
    }

    const declaration = /^(?:data\s+class|object|fun)\s+([A-Za-z][A-Za-z\d]*)/u.exec(
      source.slice(cursor)
    )

    if (declaration) declarations.push(declaration[1])

    searchStart = annotationStart + annotation.length
  }

  return declarations
}

const annotatedDeclarations = extractExperimentalDeclarations(phoneSource)

assert.deepEqual(
  [...annotatedDeclarations, 'ExperimentalLumenPhoneApi']
    .sort((left, right) => left.localeCompare(right)),
  classification.experimental,
  'Every Experimental Compose declaration must be visibly annotated in source'
)

process.stdout.write(
  `Validated ${classification.supported.length} Supported, `
    + `${classification.experimental.length} Experimental, and `
    + `${classification.deprecated.length} deprecated Compose API declarations.\n`
)
