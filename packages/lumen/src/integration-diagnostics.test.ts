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

  test('scopes styles and runtime mounts to workspace application boundaries', async () => {
    const root = await mkdtemp(join(tmpdir(), 'lumen-doctor-workspace-'))

    try {
      await writeFile(join(root, 'package.json'), '{"name":"workspace"}\n')

      for (const application of ['docs', 'marketing']) {
        const applicationRoot = join(root, 'apps', application)

        await mkdir(join(applicationRoot, 'src', 'pages'), { recursive: true })
        await writeFile(join(applicationRoot, 'package.json'), `{"name":"${application}"}\n`)
        await writeFile(
          join(applicationRoot, 'src', 'global.css'),
          '@import "@santi020k/lumen-astro/styles.css";\n'
        )
        await writeFile(
          join(applicationRoot, 'src', 'pages', 'index.astro'),
          'import { Dialog, UIPrimitives } from \'@santi020k/lumen-astro\'\n<Dialog /><UIPrimitives />\n'
        )
      }

      const report = await inspectLumenIntegration(root)

      expect(report.healthy).toBe(true)
      expect(report.findings).not.toContainEqual(expect.objectContaining({
        rule: 'astro-runtime-duplicate'
      }))
      expect(report.findings).not.toContainEqual(expect.objectContaining({
        rule: 'framework-style-duplicate'
      }))
    } finally {
      await rm(root, { force: true, recursive: true })
    }
  })

  test('allows one page-local runtime mount per mutually exclusive Astro route', async () => {
    const root = await mkdtemp(join(tmpdir(), 'lumen-doctor-routes-'))

    try {
      await mkdir(join(root, 'src', 'pages'), { recursive: true })
      await writeFile(join(root, 'package.json'), '{"name":"site"}\n')
      await writeFile(
        join(root, 'src', 'global.css'), '@import "@santi020k/lumen-astro/styles.css";\n'
      )

      for (const page of ['index', 'gallery']) {
        await writeFile(
          join(root, 'src', 'pages', `${page}.astro`),
          'import { Dialog, UIPrimitives } from \'@santi020k/lumen-astro\'\n<Dialog /><UIPrimitives />\n'
        )
      }

      await expect(inspectLumenIntegration(root)).resolves.toMatchObject({
        healthy: true
      })
    } finally {
      await rm(root, { force: true, recursive: true })
    }
  })

  test('reports a route runtime mount when the application layout already mounts it', async () => {
    const root = await mkdtemp(join(tmpdir(), 'lumen-doctor-layout-'))

    try {
      await mkdir(join(root, 'src', 'layouts'), { recursive: true })
      await mkdir(join(root, 'src', 'pages'), { recursive: true })
      await writeFile(join(root, 'package.json'), '{"name":"site"}\n')
      await writeFile(
        join(root, 'src', 'global.css'), '@import "@santi020k/lumen-astro/styles.css";\n'
      )
      await writeFile(
        join(root, 'src', 'layouts', 'Base.astro'),
        'import { UIPrimitives } from \'@santi020k/lumen-astro\'\n<UIPrimitives />\n'
      )
      await writeFile(
        join(root, 'src', 'pages', 'index.astro'),
        'import { Dialog, UIPrimitives } from \'@santi020k/lumen-astro\'\n<Dialog /><UIPrimitives />\n'
      )

      const report = await inspectLumenIntegration(root)

      expect(report.healthy).toBe(false)
      expect(report.findings).toContainEqual(expect.objectContaining({
        file: 'src/pages/index.astro',
        rule: 'astro-runtime-duplicate'
      }))
    } finally {
      await rm(root, { force: true, recursive: true })
    }
  })

  test('ignores generated output and package-name strings that are not imports', async () => {
    const root = await mkdtemp(join(tmpdir(), 'lumen-doctor-generated-'))

    try {
      await mkdir(join(root, 'src'), { recursive: true })
      await mkdir(join(root, '.open-next', 'assets'), { recursive: true })
      await writeFile(join(root, 'package.json'), '{"name":"site"}\n')
      await writeFile(
        join(root, 'src', 'catalog.ts'),
        'export const packages = [\'@santi020k/lumen-elements\', \'@santi020k/lumen-react\']\n'
      )
      await writeFile(
        join(root, 'src', 'global.css'), '@import "@santi020k/lumen-astro/styles.css";\n'
      )
      await writeFile(
        join(root, 'src', 'page.astro'),
        'import { Card } from \'@santi020k/lumen-astro\'\n<Card />\n'
      )
      await writeFile(
        join(root, '.open-next', 'assets', 'compiled.css'),
        '.ui-internal { color: red; }\n/* @santi020k/lumen-react */\n'
      )

      const report = await inspectLumenIntegration(root)

      expect(report.frameworks).toEqual(['astro'])
      expect(report.healthy).toBe(true)
      expect(report.findings).toEqual([])
    } finally {
      await rm(root, { force: true, recursive: true })
    }
  })

  test('validates Tailwind order only in a Lumen stylesheet entry', async () => {
    const root = await mkdtemp(join(tmpdir(), 'lumen-doctor-tailwind-'))

    try {
      await mkdir(join(root, 'src'), { recursive: true })
      await mkdir(join(root, 'fixtures'), { recursive: true })
      await writeFile(join(root, 'package.json'), '{"name":"site"}\n')
      await writeFile(
        join(root, 'src', 'global.css'),
        '@import "@santi020k/lumen-astro/layers.css";\n@import "tailwindcss";\n@import "@santi020k/lumen-astro/styles.css";\n'
      )
      await writeFile(
        join(root, 'src', 'prose.css'),
        '/* This builds on @tailwindcss/typography. */\n'
      )
      await writeFile(join(root, 'fixtures', 'tailwind.css'), '@import "tailwindcss";\n')
      await writeFile(
        join(root, 'src', 'page.astro'),
        'import { Card } from \'@santi020k/lumen-astro\'\n<Card />\n'
      )

      await expect(inspectLumenIntegration(root)).resolves.toMatchObject({
        findings: [],
        healthy: true
      })

      await writeFile(
        join(root, 'src', 'global.css'),
        '@import "tailwindcss";\n@import "@santi020k/lumen-astro/styles.css";\n'
      )

      expect((await inspectLumenIntegration(root)).findings).toContainEqual(
        expect.objectContaining({ rule: 'tailwind-layer-order' })
      )
    } finally {
      await rm(root, { force: true, recursive: true })
    }
  })

  test('reports adapter styles that do not match component imports', async () => {
    const root = await mkdtemp(join(tmpdir(), 'lumen-doctor-adapter-'))

    try {
      await mkdir(join(root, 'src'), { recursive: true })
      await writeFile(join(root, 'package.json'), '{"name":"site"}\n')
      await writeFile(
        join(root, 'src', 'global.css'), '@import "@santi020k/lumen-react/styles.css";\n'
      )
      await writeFile(
        join(root, 'src', 'page.astro'),
        'import { Card } from \'@santi020k/lumen-astro\'\n<Card />\n'
      )

      const report = await inspectLumenIntegration(root)

      expect(report.frameworks).toEqual(['astro'])
      expect(report.findings).toContainEqual(expect.objectContaining({
        rule: 'adapter-style-mismatch'
      }))
      expect(report.findings).toContainEqual(expect.objectContaining({
        rule: 'framework-style-missing'
      }))
    } finally {
      await rm(root, { force: true, recursive: true })
    }
  })

  test('does not require UIPrimitives for application-controlled toggles', async () => {
    const root = await mkdtemp(join(tmpdir(), 'lumen-doctor-controlled-'))

    try {
      await mkdir(join(root, 'src'), { recursive: true })
      await writeFile(join(root, 'package.json'), '{"name":"site"}\n')
      await writeFile(
        join(root, 'src', 'global.css'), '@import "@santi020k/lumen-astro/styles.css";\n'
      )
      await writeFile(
        join(root, 'src', 'page.astro'),
        'import { Toggle } from \'@santi020k/lumen-astro\'\n<Toggle controlled pressed>Preview</Toggle>\n'
      )

      const controlledReport = await inspectLumenIntegration(root)

      expect(controlledReport.healthy).toBe(true)
      expect(controlledReport.runtimeComponents).not.toContain('Toggle')

      await writeFile(
        join(root, 'src', 'page.astro'),
        'import { Toggle } from \'@santi020k/lumen-astro\'\n<Toggle pressed>Preview</Toggle>\n'
      )

      const uncontrolledReport = await inspectLumenIntegration(root)

      expect(uncontrolledReport.healthy).toBe(false)
      expect(uncontrolledReport.findings).toContainEqual(expect.objectContaining({
        file: 'src/page.astro',
        rule: 'astro-runtime-missing'
      }))
    } finally {
      await rm(root, { force: true, recursive: true })
    }
  })

  test('deduplicates repeated internal selector advisories', async () => {
    const root = await mkdtemp(join(tmpdir(), 'lumen-doctor-selectors-'))

    try {
      await mkdir(join(root, 'src'), { recursive: true })
      await writeFile(join(root, 'package.json'), '{"name":"site"}\n')
      await writeFile(
        join(root, 'src', 'global.css'),
        '.ui-private {}\n.wrapper .ui-private {}\n'
      )

      const report = await inspectLumenIntegration(root)

      expect(report.findings.filter(item => item.rule === 'internal-selector')).toHaveLength(1)
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
