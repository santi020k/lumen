import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import test from 'node:test'

const repositoryRoot = resolve(import.meta.dirname, '..')
const checkerPath = resolve(repositoryRoot, 'scripts', 'check-compose-api-classification.mjs')

const sourceClassificationPath = resolve(
  repositoryRoot,
  'registry',
  'compose-api-classification.json'
)

const sourcePhonePath = resolve(
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

const runClassification = async (mutate, mutateSource) => {
  const temporaryDirectory = await mkdtemp(resolve(tmpdir(), 'lumen-compose-classification-'))

  try {
    const classification = JSON.parse(await readFile(sourceClassificationPath, 'utf8'))
    const source = await readFile(sourcePhonePath, 'utf8')

    mutate(classification)

    const classificationPath = resolve(temporaryDirectory, 'classification.json')
    const phoneSourcePath = resolve(temporaryDirectory, 'PhoneComponents.kt')

    await Promise.all([
      writeFile(classificationPath, `${JSON.stringify(classification, null, 2)}\n`),
      writeFile(phoneSourcePath, mutateSource ? mutateSource(source) : source)
    ])

    return spawnSync(
      process.execPath,
      [
        checkerPath,
        '--classification',
        classificationPath,
        '--phone-source',
        phoneSourcePath
      ],
      { cwd: repositoryRoot, encoding: 'utf8', timeout: 2_000 }
    )
  } finally {
    await rm(temporaryDirectory, { force: true, recursive: true })
  }
}

test('accepts the reviewed Compose API maturity classification', async () => {
  const result = await runClassification(() => {})

  assert.equal(result.status, 0, result.stderr)

  assert.match(result.stdout, /Validated 146 Supported, 6 Experimental/)
})

test('rejects an unclassified Compose declaration', async () => {
  const result = await runClassification(classification => {
    classification.supported = classification.supported.filter(identifier => identifier !== 'LumenButton')
  })

  assert.equal(result.status, 1)

  assert.match(result.stderr, /public ABI and maturity classifications differ/)
})

test('rejects a phone API classified as Supported while its source remains Experimental', async () => {
  const result = await runClassification(classification => {
    classification.experimental = classification.experimental.filter(
      identifier => identifier !== 'LumenPhoneInput'
    )

    classification.supported = [...classification.supported, 'LumenPhoneInput']
      .sort((left, right) => left.localeCompare(right))
  })

  assert.equal(result.status, 1)

  assert.match(result.stderr, /Every Experimental Compose declaration must be visibly annotated/)
})

test('rejects duplicate maturity classifications', async () => {
  const result = await runClassification(classification => {
    classification.deprecated = ['LumenButton']
  })

  assert.equal(result.status, 1)

  assert.match(result.stderr, /appears in more than one classification/)
})

test('classifies long annotation sequences without catastrophic backtracking', async () => {
  const annotations = '@A() '.repeat(20_000)

  const result = await runClassification(
    () => {},
    source => source.replace(
      '@ExperimentalLumenPhoneApi\ndata class LumenPhoneCountry',
      `@ExperimentalLumenPhoneApi\n${annotations}data class LumenPhoneCountry`
    )
  )

  assert.equal(result.signal, null, 'classification timed out')

  assert.equal(result.status, 0, result.stderr)
})
