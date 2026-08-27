import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import test from 'node:test'

const repositoryRoot = resolve(import.meta.dirname, '..')

const generatorSource = await readFile(
  resolve(repositoryRoot, 'scripts', 'generate-release-manifest.mjs'),
  'utf8'
)

const contract = JSON.parse(
  await readFile(resolve(repositoryRoot, 'registry', 'lumen-2-contract.json'), 'utf8')
)

const writeJson = (path, value) => writeFile(path, `${JSON.stringify(value, null, 2)}\n`)

test('generates the contract migration metadata for a version 2 package family', async () => {
  const temporaryRoot = await mkdtemp(resolve(tmpdir(), 'lumen-v2-release-manifest-'))

  try {
    await Promise.all([
      mkdir(resolve(temporaryRoot, 'packages', 'astro'), { recursive: true }),
      mkdir(resolve(temporaryRoot, 'packages', 'compose'), { recursive: true }),
      mkdir(resolve(temporaryRoot, 'packages', 'lumen'), { recursive: true }),
      mkdir(resolve(temporaryRoot, 'registry'), { recursive: true }),
      mkdir(resolve(temporaryRoot, 'scripts'), { recursive: true })
    ])

    await Promise.all([
      writeJson(resolve(temporaryRoot, 'packages', 'astro', 'package.json'), {
        name: '@santi020k/lumen-astro',
        peerDependencies: { astro: '>=5' },
        version: '2.0.0'
      }),
      writeFile(
        resolve(temporaryRoot, 'packages', 'compose', 'gradle.properties'),
        'lumenComposeVersion=2.0.0\n'
      ),
      writeJson(resolve(temporaryRoot, 'packages', 'lumen', 'package.json'), {
        name: '@santi020k/lumen',
        version: '2.0.0'
      }),
      writeJson(resolve(temporaryRoot, 'registry', 'lumen-2-contract.json'), contract),
      writeFile(resolve(temporaryRoot, 'scripts', 'generate-release-manifest.mjs'), generatorSource)
    ])

    const result = spawnSync(
      process.execPath,
      [resolve(temporaryRoot, 'scripts', 'generate-release-manifest.mjs')],
      { cwd: temporaryRoot, encoding: 'utf8' }
    )

    assert.equal(result.status, 0, result.stderr)

    const [registryManifest, packageManifest] = await Promise.all([
      readFile(resolve(temporaryRoot, 'registry', 'release-manifest.json'), 'utf8'),
      readFile(resolve(temporaryRoot, 'packages', 'lumen', 'release-manifest.json'), 'utf8')
    ])

    const generated = JSON.parse(registryManifest)

    assert.equal(packageManifest, registryManifest)

    assert.deepEqual(
      {
        codemod: generated.migration.codemod,
        deprecatedExports: generated.migration.deprecatedExports,
        removedExports: generated.migration.removedExports,
        runtime: generated.migration.runtime
      },
      contract.releaseMigration
    )
  } finally {
    await rm(temporaryRoot, { force: true, recursive: true })
  }
})
