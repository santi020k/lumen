import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { expect, test } from 'vitest'

import { addLumenRegistryItem } from './installer.js'

test('CLI installs only the optional Astro recipe with its scoped assets', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'lumen-ticket-'))
  try {
    const result = await addLumenRegistryItem('editable-ticket', { cwd: dir, target: 'astro' })
    expect(result.files).toEqual(['src/lumen/editable-ticket.astro', 'src/lumen/editable-ticket.css', 'src/lumen/editable-ticket-controller.ts'].sort())
    const source = await readFile(join(dir, 'src/lumen/editable-ticket.astro'), 'utf8')
    expect(source).toContain('import \'./editable-ticket.css\'')
    await expect(addLumenRegistryItem('editable-ticket', { cwd: dir, target: 'react' })).rejects.toThrow('does not have react starter files')
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})
