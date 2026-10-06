import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { expect, test } from 'vitest'

import { addLumenRegistryItem } from './installer.js'

test.each(['astro', 'react', 'elements'] as const)('installs all four interactive blocks for %s', async target => {
  const directory = await mkdtemp(join(tmpdir(), 'lumen-visual-blocks-'))
  try {
    for (const name of ['interactive-pricing', 'feature-preview', 'guided-onboarding', 'command-center']) {
      const result = await addLumenRegistryItem(name, { cwd: directory, target })
      const extension = { astro: 'astro', react: 'tsx', elements: 'html' }[target]
      expect(result.files).toContain(`src/lumen/${name}.${extension}`)
      const source = await readFile(join(directory, `src/lumen/${name}.${extension}`), 'utf8')
      expect(source).toContain(`@santi020k/lumen-${target}`)
      expect(result.files.includes('src/lumen/product-blocks.ts')).toBe(target !== 'react')
    }
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})
