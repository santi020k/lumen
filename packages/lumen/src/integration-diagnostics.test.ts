import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, expect, test } from 'vitest'

import {
  createLumenSetup,
  inspectLumenIntegration
} from './integration-diagnostics.js'

describe('Lumen integration diagnostics', () => {
  test('distinguishes static Astro use from missing interactive runtime setup', async () => {
    const root = await mkdtemp(join(tmpdir(), 'lumen-doctor-'))

    try {
      await mkdir(join(root, 'src'), { recursive: true })
      await writeFile(
        join(root, 'src', 'global.css'), '@import "@santi020k/lumen-astro/styles.css";\n'
      )
      await writeFile(
        join(root, 'src', 'page.astro'), 'import { Card } from \'@santi020k/lumen-astro\'\n<Card />\n'
      )

      expect((await inspectLumenIntegration(root)).healthy).toBe(true)

      await writeFile(
        join(root, 'src', 'page.astro'), 'import { Card, Dialog } from \'@santi020k/lumen-astro\'\n<Card /><Dialog />\n'
      )

      const report = await inspectLumenIntegration(root)

      expect(report.healthy).toBe(false)
      expect(report.runtimeComponents).toContain('Dialog')
      expect(report.findings).toContainEqual(expect.objectContaining({ rule: 'astro-runtime-missing' }))
    } finally {
      await rm(root, { force: true, recursive: true })
    }
  })

  test('prints deterministic framework and Tailwind setup', () => {
    expect(createLumenSetup('react', true)).toContain('@import "tailwindcss";')
    expect(createLumenSetup('astro')).toContain('<UIPrimitives />')
    expect(createLumenSetup('elements')).toContain('defineLumenElements()')
  })
})
