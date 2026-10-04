import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdir, mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { promisify } from 'node:util'

import { packagePlugin } from './package.mjs'

const execute = promisify(execFile)
const revision = 'a'.repeat(40)
const source = { revision, dirty: false }
const manifest = { main: 'code.js', ui: 'ui.html', networkAccess: { allowedDomains: ['none'] } }

const fixture = async (t, overrides = {}) => {
  const root = await mkdtemp(join(tmpdir(), 'lumen-figma-package-test-'))

  t.after(() => rm(root, { recursive: true, force: true }))

  await mkdir(join(root, 'dist'))

  await writeFile(join(root, 'package.json'), JSON.stringify({ version: '0.1.0-beta.1' }))

  const manifestText = JSON.stringify({ ...manifest, ...overrides })

  await writeFile(join(root, 'manifest.json'), manifestText)

  await writeFile(join(root, 'dist/manifest.json'), manifestText)

  await writeFile(join(root, 'dist/code.js'), 'figma.showUI(__html__)')

  await writeFile(join(root, 'dist/ui.html'), '<!doctype html><title>Beta</title>')

  return root
}

test('packages only runtime files and verifiable source metadata, with repeatable bytes', async t => {
  const root = await fixture(t)

  await writeFile(join(root, 'dist/private.txt'), 'Must never be distributed')

  const first = await packagePlugin(root, source)
  const archive = join(first.output, first.archiveName)
  const contents = await readFile(archive)
  const { stdout: listing } = await execute('unzip', ['-Z1', archive])

  assert.deepEqual(listing.trim().split('\n'), ['code.js', 'manifest.json', 'ui.html', 'release.json'])

  const extraction = join(root, 'extracted')

  await execute('unzip', ['-q', archive, '-d', extraction])

  const metadata = JSON.parse(await readFile(join(extraction, 'release.json'), 'utf8'))

  assert.equal(metadata.revision, revision)

  assert.equal(metadata.version, '0.1.0-beta.1')

  assert.equal(metadata.pluginId, null)

  assert.equal(metadata.dirty, false)

  assert.deepEqual(Object.keys(metadata.sha256), ['code.js', 'manifest.json', 'ui.html'])

  for (const [name, hash] of Object.entries(metadata.sha256)) {
    const extracted = await readFile(join(extraction, name))

    assert.deepEqual(extracted, await readFile(join(root, 'dist', name)))

    assert.equal(createHash('sha256').update(extracted).digest('hex'), hash)
  }

  assert.equal(await readFile(`${archive}.sha256`, 'utf8'), `${createHash('sha256').update(contents).digest('hex')}  ${first.archiveName}\n`)

  await packagePlugin(root, source)

  assert.deepEqual(await readFile(archive), contents)
})

test('preserves the registered ID and distinguishes dirty local candidates', async t => {
  const root = await fixture(t, { id: '123456789' })
  const result = await packagePlugin(root, { revision, dirty: true })

  assert.equal(result.metadata.pluginId, '123456789')

  assert.equal(result.metadata.dirty, true)

  assert.ok(result.archiveName.endsWith('-dirty.zip'))

  await packagePlugin(root, source)

  assert.equal((await readdir(result.output)).some(name => name.includes('-dirty')), false)
})

test('rejects stale manifests, missing output, unsafe names, and invalid source identities', async t => {
  const root = await fixture(t)

  await writeFile(join(root, 'manifest.json'), '{}')

  await assert.rejects(packagePlugin(root, source), /Rebuild/u)

  await writeFile(join(root, 'manifest.json'), JSON.stringify(manifest))

  await writeFile(join(root, 'dist/code.js'), '')

  await assert.rejects(packagePlugin(root, source), /empty code.js/u)

  await rm(join(root, 'dist/code.js'))

  await assert.rejects(packagePlugin(root, source), /ENOENT/u)

  await writeFile(join(root, 'package.json'), JSON.stringify({ version: '../../escape' }))

  await assert.rejects(packagePlugin(root, source), /version/u)

  await assert.rejects(packagePlugin(root, { revision: 'unknown', dirty: false }), /Git commit/u)
})

test('rejects unexpected entrypoints, invalid IDs, and network access in the offline beta', async t => {
  for (const override of [{ main: '../code.js' }, { id: 'placeholder' }, { networkAccess: { allowedDomains: ['*'] } }]) {
    const root = await fixture(t, override)

    await assert.rejects(packagePlugin(root, source), /beta package|plugin ID/u)
  }
})
