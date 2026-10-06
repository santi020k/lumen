import { mkdir, mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { expect, test } from 'vitest'

import { prepareCloudflarePages } from '../../scripts/prepare-cloudflare-pages.mjs'

test('packages canonical HTML routes while preserving assets, embedded previews, and audited source', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'lumen-pages-'))
  const source = path.join(root, 'source')
  const destination = path.join(root, 'output')
  const html = '<meta name="robots" content="index, follow"><link rel="canonical" href="https://lumen.santi020k.com/docs"><h1>Docs</h1>'

  try {
    await mkdir(path.join(source, 'docs'), { recursive: true })
    await mkdir(path.join(source, 'native-previews/live'), { recursive: true })
    await writeFile(path.join(source, 'docs/index.html'), html)
    await writeFile(path.join(source, 'docs/data.json'), '{}')
    await writeFile(path.join(source, 'native-previews/live/index.html'), '<meta name="robots" content="noindex">')
    await writeFile(path.join(source, 'index.html'), '<link rel="canonical" href="https://lumen.santi020k.com/">')
    await writeFile(path.join(source, '404.html'), '<meta name="robots" content="noindex">')

    expect(await prepareCloudflarePages({ source, destination })).toBe(1)
    expect(await readFile(path.join(destination, 'docs.html'), 'utf8')).toBe(html)
    expect(await readFile(path.join(source, 'docs/index.html'), 'utf8')).toBe(html)
    expect(await stat(path.join(destination, 'docs/index.html')).then(() => true, () => false)).toBe(false)
    expect(await readFile(path.join(destination, 'docs/data.json'), 'utf8')).toBe('{}')
    expect((await stat(path.join(destination, 'native-previews/live/index.html'))).isFile()).toBe(true)
    expect((await stat(path.join(destination, 'index.html'))).isFile()).toBe(true)
    expect((await stat(path.join(destination, '404.html'))).isFile()).toBe(true)

    await writeFile(path.join(destination, 'stale.txt'), 'stale')
    expect(await prepareCloudflarePages({ source, destination })).toBe(1)
    expect(await stat(path.join(destination, 'stale.txt')).then(() => true, () => false)).toBe(false)

    await writeFile(path.join(source, 'docs/index.html'), html.replace('/docs', '/wrong'))
    await expect(prepareCloudflarePages({ source, destination })).rejects.toThrow('Canonical URL does not match')
    expect(await readFile(path.join(destination, 'docs.html'), 'utf8')).toBe(html)
    await expect(prepareCloudflarePages({ source, destination: source })).rejects.toThrow('separate directories')
    await expect(prepareCloudflarePages({ source, destination: path.join(source, 'nested') })).rejects.toThrow('separate directories')
  } finally {
    await rm(root, { force: true, recursive: true })
  }
})
