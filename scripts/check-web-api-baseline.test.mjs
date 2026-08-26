import assert from 'node:assert/strict'
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import test from 'node:test'

import {
  checkWebApiBaseline,
  collectWebApiSnapshot
} from './check-web-api-baseline.mjs'

const fixturePackages = {
  fixture: {
    entrypoint: 'packages/fixture/src/index.ts',
    packageJson: 'packages/fixture/package.json'
  }
}

const createFixture = async ({ index = "export * from './values.js'\nexport { Alpha as Alias } from './values.js'\nexport { default as Card } from './Card.astro'\n", values = 'export const zebra = true\nexport type Alpha = string\n' } = {}) => {
  const repositoryRoot = await mkdtemp(resolve(tmpdir(), 'lumen-web-api-'))
  const sourceDirectory = resolve(repositoryRoot, 'packages/fixture/src')

  await mkdir(sourceDirectory, { recursive: true })

  await writeFile(resolve(repositoryRoot, 'packages/fixture/package.json'), JSON.stringify({
    exports: {
      './styles.css': './styles.css',
      '.': { import: './dist/index.js', types: './dist/index.d.ts' }
    },
    name: '@fixture/ui'
  }))

  await writeFile(resolve(sourceDirectory, 'index.ts'), index)

  await writeFile(resolve(sourceDirectory, 'values.ts'), values)

  await writeFile(resolve(sourceDirectory, 'Card.astro'), '---\nconst title = "Card"\n---\n<div>{title}</div>\n')

  return repositoryRoot
}

test('collects a deterministic sorted inventory through export stars and Astro reexports', async () => {
  const repositoryRoot = await createFixture()
  const first = await collectWebApiSnapshot({ packages: fixturePackages, repositoryRoot })
  const second = await collectWebApiSnapshot({ packages: fixturePackages, repositoryRoot })

  assert.deepEqual(first, second)

  assert.deepEqual(first.packages.fixture.symbols, ['Alias', 'Alpha', 'Card', 'zebra'])

  assert.deepEqual(Object.keys(first.packages.fixture.packageExports), ['.', './styles.css'])

  assert.deepEqual(Object.keys(first.packages.fixture.packageExports['.']), ['import', 'types'])
})

test('rejects duplicate and changed root exports', async t => {
  await t.test('duplicate exports', async () => {
    const repositoryRoot = await createFixture({
      index: "export * from './left.js'\nexport * from './right.js'\n",
      values: ''
    })

    const sourceDirectory = resolve(repositoryRoot, 'packages/fixture/src')

    await writeFile(resolve(sourceDirectory, 'left.ts'), 'export const duplicate = 1\n')

    await writeFile(resolve(sourceDirectory, 'right.ts'), 'export const duplicate = 2\n')

    await assert.rejects(
      collectWebApiSnapshot({ packages: fixturePackages, repositoryRoot }),
      /exports duplicate more than once/
    )
  })

  await t.test('changed exports', async () => {
    const repositoryRoot = await createFixture()
    const baselinePath = resolve(repositoryRoot, 'baseline.json')

    await checkWebApiBaseline({ baselinePath, packages: fixturePackages, repositoryRoot, update: true })

    await writeFile(
      resolve(repositoryRoot, 'packages/fixture/src/values.ts'),
      'export const changed = true\nexport type Alpha = string\n'
    )

    await assert.rejects(
      checkWebApiBaseline({ baselinePath, packages: fixturePackages, repositoryRoot }),
      /recorded root symbol inventory changed/
    )
  })
})

test('update preserves reviewed classifications and exposes new symbols as unclassified', async () => {
  const repositoryRoot = await createFixture()
  const baselinePath = resolve(repositoryRoot, 'baseline.json')

  await checkWebApiBaseline({ baselinePath, packages: fixturePackages, repositoryRoot, update: true })

  await checkWebApiBaseline({ baselinePath, packages: fixturePackages, repositoryRoot })

  await writeFile(
    resolve(repositoryRoot, 'packages/fixture/src/values.ts'),
    'export const zebra = true\nexport type Alpha = string\nexport const Beta = true\n'
  )

  await checkWebApiBaseline({ baselinePath, packages: fixturePackages, repositoryRoot, update: true })

  const updated = JSON.parse(await readFile(baselinePath, 'utf8'))

  assert.deepEqual(updated.packages.fixture.supported, ['Alias', 'Alpha', 'Card', 'zebra'])

  assert.deepEqual(updated.packages.fixture.unclassified, ['Beta'])

  await assert.rejects(
    checkWebApiBaseline({ baselinePath, packages: fixturePackages, repositoryRoot }),
    /contains unclassified API symbols/
  )
})
