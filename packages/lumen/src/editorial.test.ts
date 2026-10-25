import { mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, expect, test } from 'vitest'

import { addLumenRegistryItem } from './index.js'

describe('editorial recipe installation', () => {
  test('copies independent components and an example, preserving consumer edits on reinstall', async () => {
    const cwd = await mkdtemp(join(tmpdir(), 'lumen-editorial-'))
    try {
      const result = await addLumenRegistryItem('editorial', { cwd, target: 'astro' })
      const files = [
        'EDITORIAL.md',
        'editorial-card.astro',
        'editorial-contact-panel.astro',
        'editorial-cover-spread.astro',
        'editorial-introduction.astro',
        'editorial-replacement-notice.astro',
        'editorial.astro'
      ].map(name => `src/lumen/${name}`)
      expect(new Set(result.added)).toEqual(new Set(files))
      for (const file of files) {
        expect(await readFile(join(cwd, file), 'utf8')).toBe(
          await readFile(new URL(`../templates/astro/editorial/${file}`, import.meta.url), 'utf8')
        )
      }
      const cardPath = join(cwd, 'src/lumen/editorial-card.astro')
      const editedCard = '<article>My adapted card</article>\n'
      await writeFile(cardPath, editedCard)
      const repeated = await addLumenRegistryItem('editorial', { cwd, target: 'astro' })
      expect(repeated.added).toEqual([])
      expect(await readFile(cardPath, 'utf8')).toBe(editedCard)
    } finally {
      await rm(cwd, { force: true, recursive: true })
    }
  })

  test.each(['react', 'elements'] as const)('rejects %s before writing files', async target => {
    const cwd = await mkdtemp(join(tmpdir(), 'lumen-editorial-unsupported-'))
    try {
      await expect(addLumenRegistryItem('editorial', { cwd, target })).rejects.toThrow(
        `does not have ${target} starter files yet`
      )
      expect(await readdir(cwd)).toEqual([])
    } finally {
      await rm(cwd, { force: true, recursive: true })
    }
  })
})
