import assert from 'node:assert/strict'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import test from 'node:test'

import {
  checkComponentCatalogFreshness,
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

const createComponentCatalog = () => ({
  components: [{
    apiReference: [{ attribute: 'tone', defaultValue: 'neutral', values: 'neutral | brand' }],
    behavior: { astro: 'ui-primitives', elements: 'registered-element', react: 'component' },
    dependencies: ['styles', 'runtime'],
    frameworkDetails: {
      astro: {
        available: true,
        behavior: { mode: 'runtime', setup: 'Mount the runtime once.' },
        importStatement: "import { Card } from '@fixture/ui'",
        packageName: '@fixture/ui',
        props: [{ name: 'tone', optional: true, type: "'brand' | 'neutral'" }],
        propsExtends: "HTMLAttributes<'article'>",
        source: '<article class="ui-card" data-ui-card></article>',
        styleImport: "import '@fixture/ui/styles.css'"
      },
      elements: {
        attributes: ['tone'],
        available: true,
        behavior: { mode: 'registration', setup: 'Register once.' },
        importStatement: "import { defineFixture } from '@fixture/ui/define'",
        packageName: '@fixture/ui',
        props: [],
        propsExtends: 'HTMLElement attributes',
        registration: 'defineFixture()',
        source: "tagName: 'fixture-card', baseClassName: 'ui-card'",
        styleImport: "import '@fixture/ui/styles.css'",
        tagName: 'fixture-card'
      }
    },
    name: 'Card',
    props: [{ name: 'tone', optional: true, type: "'brand' | 'neutral'" }],
    propsExtends: "HTMLAttributes<'article'>",
    runtimeEvents: [{ detail: '{ open: boolean }', name: 'ui:card-change' }]
  }]
})

const writeComponentCatalog = (repositoryRoot, catalog) => {
  const catalogPath = resolve(repositoryRoot, 'component-catalog.json')

  return writeFile(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`).then(() => catalogPath)
}

test('requires a current generated component catalog', async () => {
  const repositoryRoot = await mkdtemp(resolve(tmpdir(), 'lumen-web-api-freshness-'))
  const generatorDirectory = resolve(repositoryRoot, 'packages', 'mcp', 'scripts')
  const generatorPath = resolve(generatorDirectory, 'generate-data.mjs')

  try {
    await mkdir(generatorDirectory, { recursive: true })

    await writeFile(generatorPath, "process.stdout.write('fixture catalog is current\\n')\n")

    assert.doesNotThrow(() => checkComponentCatalogFreshness(repositoryRoot))

    await writeFile(
      generatorPath,
      "process.stderr.write('fixture catalog is stale\\n')\nprocess.exitCode = 1\n"
    )

    assert.throws(
      () => checkComponentCatalogFreshness(repositoryRoot),
      /component catalog freshness check failed[\s\S]*fixture catalog is stale/u
    )
  } finally {
    await rm(repositoryRoot, { force: true, recursive: true })
  }
})

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

test('schema 2 rejects component contract drift', async t => {
  const cases = [
    ['props', catalog => catalog.components[0].props.push({ name: 'size', optional: true, type: 'number' })],
    ['Elements attributes', catalog => catalog.components[0].frameworkDetails.elements.attributes.push('size')],
    ['runtime behavior', catalog => { catalog.components[0].behavior.astro = 'none' }],
    ['runtime events', catalog => catalog.components[0].runtimeEvents.push({ detail: '{}', name: 'ui:card-close' })],
    ['styling hooks', catalog => { catalog.components[0].frameworkDetails.astro.source = '<article class="ui-panel"></article>' }]
  ]

  for (const [name, mutate] of cases) {
    await t.test(name, async () => {
      const repositoryRoot = await createFixture()
      const baselinePath = resolve(repositoryRoot, 'baseline.json')

      try {
        const catalog = createComponentCatalog()
        const catalogPath = await writeComponentCatalog(repositoryRoot, catalog)

        const baseline = await checkWebApiBaseline({
          baselinePath,
          catalogPath,
          packages: fixturePackages,
          repositoryRoot,
          update: true
        })

        assert.equal(baseline.schemaVersion, 2)

        assert.match(baseline.componentContracts.Card, /^[0-9a-f]{64}$/u)

        mutate(catalog)

        await writeComponentCatalog(repositoryRoot, catalog)

        await assert.rejects(
          checkWebApiBaseline({
            baselinePath,
            catalogPath,
            packages: fixturePackages,
            repositoryRoot
          }),
          /Web component props, attributes, runtime behavior, events, or styling hooks changed/
        )
      } finally {
        await rm(repositoryRoot, { force: true, recursive: true })
      }
    })
  }
})
