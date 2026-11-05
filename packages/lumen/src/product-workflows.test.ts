import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, expect, test } from 'vitest'

import { addLumenRegistryItem, loadLumenRegistry, lumenRegistry } from './index.js'

describe('product workflow recipes', () => {
  test.each(['code-example', 'share'])('installs %s with setup metadata and preserves consumer edits', async name => {
    const cwd = await mkdtemp(join(tmpdir(), 'lumen-workflow-'))
    try {
      const dryRun = await addLumenRegistryItem(name, { cwd, target: 'astro', dryRun: true })
      expect(dryRun.item).toMatchObject({
        dependencies: ['@santi020k/lumen-astro'],
        setup: { astro: { runtime: '@santi020k/lumen-astro/runtime' } }
      })
      const result = await addLumenRegistryItem(name, { cwd, target: 'astro' })
      expect(result.added).toContain('src/lumen/' + name + '.astro')
      expect(result.added.some(file => file.endsWith('SETUP.md'))).toBe(true)
      const source = await readFile(join(cwd, 'src/lumen/' + name + '.astro'), 'utf8')
      expect(source).toContain('@santi020k/lumen-astro/components/')
      expect(source).not.toContain('from \'@santi020k/lumen-astro\'')
      expect(source).not.toContain('styles.css')
      await writeFile(join(cwd, 'src/lumen/' + name + '.astro'), 'Edited consumer source')
      await addLumenRegistryItem(name, { cwd, target: 'astro' })
      expect(await readFile(join(cwd, 'src/lumen/' + name + '.astro'), 'utf8')).toBe('Edited consumer source')
    } finally {
      await rm(cwd, { force: true, recursive: true })
    }
  })

  test('validates machine-readable recipe setup loaded from an external registry', async () => {
    const cwd = await mkdtemp(join(tmpdir(), 'lumen-setup-'))
    try {
      const file = join(cwd, 'registry.json')
      const item = lumenRegistry.items.find(entry => entry.name === 'share')
      if (!item) throw new Error('Missing share recipe')
      const registry = { name: 'test', description: 'Setup metadata', version: 1, packages: [], items: [item] }
      await writeFile(file, JSON.stringify(registry))
      expect((await loadLumenRegistry(file)).items[0]).toEqual(item)
      for (const setup of [
        { astro: { instructions: [null] } },
        { astro: { instructions: [], dependencies: [1] } },
        { astro: { instructions: [], dependencies: [''] } },
        { astro: { instructions: [], runtime: 1 } },
        { unknown: { instructions: [] } },
        { astro: { instructions: [], execute: 'unexpected command' } }
      ]) {
        await writeFile(file, JSON.stringify({ ...registry, items: [{ ...item, setup }] }))
        await expect(loadLumenRegistry(file)).rejects.toThrow()
      }
    } finally {
      await rm(cwd, { force: true, recursive: true })
    }
  })
})
