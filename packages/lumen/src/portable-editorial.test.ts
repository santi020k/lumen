import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { expect, test } from 'vitest'

import { addLumenRegistryItem } from './index.js'

for (const target of ['react', 'elements'] as const) {
  for (const name of ['article-reading', 'site-search-dialog', 'image-viewer']) {
    test(`installs ${name} for ${target} while preserving edited source`, async () => {
      const cwd = await mkdtemp(join(tmpdir(), 'lumen-portable-'))
      try {
        const result = await addLumenRegistryItem(name, { cwd, target })
        const main = `src/lumen/${name}.${target === 'react' ? 'tsx' : 'ts'}`
        expect(result.added).toContain(main)
        expect(result.added).toContain(`src/lumen/${name}.css`)
        const html = target === 'elements' ? [`src/lumen/${name}.html`] : []
        expect(new Set(result.added)).toEqual(new Set([main, `src/lumen/${name}.css`, ...html]))
        const edited = '// Consumer-owned adaptation\n'
        await writeFile(join(cwd, main), edited)
        const repeated = await addLumenRegistryItem(name, { cwd, target })
        expect(repeated.added).toEqual([])
        expect(await readFile(join(cwd, main), 'utf8')).toBe(edited)
      } finally {
        await rm(cwd, { recursive: true, force: true })
      }
    })
  }
}
