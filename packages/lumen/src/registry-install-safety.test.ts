import { renameSync } from 'node:fs'
import { link, mkdir, mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { afterEach, beforeEach, expect, test } from 'vitest'

import { addLumenRegistryItem, getLumenRegistryItem, loadLumenRegistry, type LumenRegistryFile } from './registry.js'

let cwd: string

beforeEach(async () => {
  cwd = await mkdtemp(join(tmpdir(), 'lumen-registry-safety-'))
})
afterEach(async () => {
  await rm(cwd, { force: true, recursive: true })
})

const recipe = (name: string, files: LumenRegistryFile[]) => ({
  description: 'External registry',
  name: 'external',
  packages: [],
  version: 1,
  items: [{ files, name, type: 'recipe' as const }]
})

test('a manifest item name cannot select files outside the bundled template catalog', async () => {
  const name = '../../src/fixtures/v2-migration'
  const manifest = join(cwd, 'registry.json')

  await writeFile(manifest, JSON.stringify(recipe(name, [])))
  const registry = await loadLumenRegistry(manifest)

  await expect(addLumenRegistryItem(name, { cwd, registry })).rejects.toThrow('starter files')
  expect(await readdir(cwd)).toEqual(['registry.json'])
})

test.each(['share', '@scope/Useful Recipe'])('installs the inline files supplied for %s', async name => {
  const registry = recipe(name, [{ path: 'custom.txt', source: 'custom' }])

  const result = await addLumenRegistryItem(name, { cwd, registry })

  expect(result.added).toEqual(['custom.txt'])
  expect(await readFile(join(cwd, 'custom.txt'), 'utf8')).toBe('custom')
})

test.each([['a', 'a/b.txt'], ['a/b.txt', 'a']])('detects file/directory conflicts for %s and %s before writing', async (first, second) => {
  const registry = recipe('example', [first, second].map(path => ({ path, source: 'sample' })))

  for (const dryRun of [true, false]) {
    await expect(addLumenRegistryItem('example', { cwd, dryRun, registry })).rejects.toThrow('directory')
    expect(await readdir(cwd)).toEqual([])
  }
})

test.each(['skip', 'merge', 'overwrite', 'error'] as const)('checks existing filesystem types in %s mode', async conflict => {
  await mkdir(join(cwd, 'folder'))
  await writeFile(join(cwd, 'file'), 'keep')
  for (const path of ['folder', 'file/child']) {
    const registry = recipe('example', [{ path: 'first.txt', source: 'first' }, { path, source: 'second' }])

    for (const dryRun of [true, false]) {
      await expect(addLumenRegistryItem('example', { conflict, cwd, dryRun, registry })).rejects.toThrow()
      expect((await readdir(cwd)).sort()).toEqual(['file', 'folder'])
    }
  }
})

test('refuses to overwrite shared hard-linked data', async () => {
  await writeFile(join(cwd, 'original'), 'keep')
  await link(join(cwd, 'original'), join(cwd, 'linked'))
  const registry = recipe('example', [{ path: 'linked', source: 'replace' }])

  for (const dryRun of [true, false]) {
    await expect(addLumenRegistryItem('example', { cwd, dryRun, force: true, registry })).rejects.toThrow('link')
  }
  expect(await readFile(join(cwd, 'original'), 'utf8')).toBe('keep')
})

test('local registry limits count encoded bytes, including the last byte', async () => {
  const path = join(cwd, 'registry.json')
  const registry = recipe('café', [{ path: 'example.txt', source: 'é'.repeat(40_000) }])
  const source = JSON.stringify(registry)
  const maxBytes = Buffer.byteLength(source)

  await writeFile(path, source)
  await expect(loadLumenRegistry(path, { maxBytes })).resolves.toEqual(registry)
  await expect(loadLumenRegistry(path, { maxBytes: maxBytes - 1 })).rejects.toThrow('byte limit')
  await expect(loadLumenRegistry(cwd)).rejects.toThrow('regular file')
})

test('a merge resolver can replace long content with short or empty UTF-8 output', async () => {
  const path = 'edit.txt'
  const registry = recipe('example', [{ path, source: 'incoming' }])

  await writeFile(join(cwd, path), 'previous'.repeat(256))
  for (const replacement of ['café', '']) {
    const result = await addLumenRegistryItem('example', { conflict: 'merge', cwd, merge: () => replacement, registry })

    expect(result.merged).toEqual([path])
    expect(await readFile(join(cwd, path), 'utf8')).toBe(replacement)
  }
})

test.each(['C:relative', 'src/NUL.txt', 'dir/COM¹', 'src/name.', 'src/name ', 'src/readme:stream', 'src/line\nbreak'])(
  'rejects unsafe destination %j before writing any files', async path => {
    const registry = recipe('example', [{ path: 'first.txt', source: 'first' }, { path, source: 'second' }])

    await expect(addLumenRegistryItem('example', { cwd, registry })).rejects.toThrow('Unsafe Lumen registry file path')
    expect(await readdir(cwd)).toEqual([])
  }
)

test('preserves a replacement file created during a custom merge', async () => {
  const path = 'target.txt'
  const registry = recipe('example', [{ path, source: 'incoming' }])

  await writeFile(join(cwd, path), 'before')
  await writeFile(join(cwd, 'pending.txt'), 'editor save')

  await expect(addLumenRegistryItem('example', {
    conflict: 'merge',
    cwd,
    registry,
    merge: () => {
      renameSync(join(cwd, 'pending.txt'), join(cwd, path))

      return 'merged'
    }
  })).rejects.toThrow('File changed')
  expect(await readFile(join(cwd, path), 'utf8')).toBe('editor save')
})

test.skipIf(process.platform !== 'linux')('counts bytes in a virtual registry file with a zero stat size', async () => {
  await expect(loadLumenRegistry('/proc/version', { maxBytes: 1 })).rejects.toThrow('byte limit')
})

test.each([['Config.txt', 'config.txt'], ['Café', 'Cafe\u0301'], ['Folder', 'folder/entry']])(
  'rejects ambiguous portable paths %s and %s in both preview and install', async (first, second) => {
    const registry = recipe('example', [first, second].map(path => ({ path, source: 'example' })))

    for (const dryRun of [true, false]) {
      await expect(addLumenRegistryItem('example', { cwd, dryRun, force: true, registry })).rejects.toThrow(/Duplicate|directory/u)
      expect(await readdir(cwd)).toEqual([])
    }
  }
)

test.each(['QRCode', 'qrcode', 'qr-code'])('resolves the published QRCode component as %s', name => {
  expect(getLumenRegistryItem(name)?.name).toBe('QRCode')
})
