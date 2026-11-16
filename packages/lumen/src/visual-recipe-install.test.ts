import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { expect, test } from 'vitest'

import { addLumenRegistryItem } from './installer.js'

test.each(['astro', 'react', 'elements'] as const)('installs product-state recipes and their shared styles for %s', async target => {
  const directory = await mkdtemp(join(tmpdir(), 'lumen-product-recipes-'))
  try {
    for (const name of ['card-detail', 'metric-card', 'task-progress']) {
      const result = await addLumenRegistryItem(name, { cwd: directory, target })
      const extension = { astro: 'astro', react: 'tsx', elements: 'html' }[target]
      expect(result.files).toContain(`src/lumen/${name}.${extension}`)
      expect(result.files).toContain(`src/lumen/${name}.css`)
      const source = await readFile(join(directory, `src/lumen/${name}.${extension}`), 'utf8')
      expect(source).toContain(`@santi020k/lumen-${target}`)
      expect(result.files.includes('src/lumen/task-progress-controller.ts')).toBe(name === 'task-progress')
    }
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})
