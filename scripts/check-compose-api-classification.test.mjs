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

const runClassification = async mutate => {
  const temporaryDirectory = await mkdtemp(resolve(tmpdir(), 'lumen-compose-classification-'))

  try {
    const classification = JSON.parse(await readFile(sourceClassificationPath, 'utf8'))

    mutate(classification)

    const classificationPath = resolve(temporaryDirectory, 'classification.json')

    await writeFile(classificationPath, `${JSON.stringify(classification, null, 2)}\n`)

    return spawnSync(
      process.execPath,
      [checkerPath, '--classification', classificationPath],
      { cwd: repositoryRoot, encoding: 'utf8' }
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
