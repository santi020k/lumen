import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { expect, test } from 'vitest'

import { addLumenRegistryItem } from './installer.js'

test.each(['astro', 'react', 'elements'] as const)('installs the complete media workspace for %s', async target => {
  const directory = await mkdtemp(join(tmpdir(), 'lumen-media-workspace-'))
  try {
    const result = await addLumenRegistryItem('media-workspace', { cwd: directory, target })
    const extension = { astro: 'astro', react: 'tsx', elements: 'html' }[target]
    expect(result.files).toContain(`src/lumen/media-workspace.${extension}`)
    expect(result.files).toContain('src/lumen/media-workspace.css')
    const stylesheet = await readFile(join(directory, 'src/lumen/media-workspace.css'), 'utf8')
    expect(stylesheet).toContain('@container')
    expect(stylesheet).toContain('prefers-reduced-transparency')
    const additionalFiles = target === 'elements' ?
      ['src/lumen/media-workspace.ts'] :
      [
        `src/lumen/adjustment-controls.${extension}`, `src/lumen/media-processing.${extension}`
      ]
    expect(result.files).toEqual(expect.arrayContaining(additionalFiles))
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})
