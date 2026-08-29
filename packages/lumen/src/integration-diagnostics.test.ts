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
          'import { Dialog } from \'@santi020k/lumen-astro\'\nimport UIPrimitives from \'@santi020k/lumen-astro/runtime\'\n<Dialog /><UIPrimitives />\n'
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
          'import { Dialog } from \'@santi020k/lumen-astro\'\nimport UIPrimitives from \'@santi020k/lumen-astro/runtime\'\n<Dialog /><UIPrimitives />\n'
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
        'import UIPrimitives from \'@santi020k/lumen-astro/runtime\'\n<UIPrimitives />\n'
      )
      await writeFile(
        join(root, 'src', 'pages', 'index.astro'),
        'import { Dialog } from \'@santi020k/lumen-astro\'\nimport UIPrimitives from \'@santi020k/lumen-astro/runtime\'\n<Dialog /><UIPrimitives />\n'
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

  test('reports duplicate adapter styles across an application boundary', async () => {
    const root = await mkdtemp(join(tmpdir(), 'lumen-doctor-style-layout-'))

    try {
      await mkdir(join(root, 'src', 'layouts'), { recursive: true })
      await mkdir(join(root, 'src', 'pages'), { recursive: true })
      await writeFile(join(root, 'package.json'), '{"name":"site"}\n')
      await writeFile(
        join(root, 'src', 'layouts', 'Base.astro'),
        'import "@santi020k/lumen-astro/styles.css"\n<slot />\n'
      )
      await writeFile(
        join(root, 'src', 'pages', 'index.astro'),
        'import "@santi020k/lumen-astro/styles.css"\nimport { Card } from \'@santi020k/lumen-astro\'\n<Card />\n'
      )

      const report = await inspectLumenIntegration(root)

      expect(report.healthy).toBe(false)
      expect(report.findings).toContainEqual(expect.objectContaining({
        file: 'src/pages/index.astro',
        rule: 'framework-style-duplicate'
      }))
    } finally {
      await rm(root, { force: true, recursive: true })
    }
  })

  test('propagates shared package requirements to Astro and React application boundaries', async () => {
    const root = await mkdtemp(join(tmpdir(), 'lumen-doctor-shared-ui-'))

    try {
      await writeFile(join(root, 'package.json'), '{"name":"workspace","private":true}\n')

      const astroLibrary = join(root, 'packages', 'astro-ui')
      const reactLibrary = join(root, 'packages', 'react-ui')
      const astroApplication = join(root, 'apps', 'docs')
      const reactApplication = join(root, 'apps', 'dashboard')

      await mkdir(join(astroLibrary, 'src'), { recursive: true })
      await mkdir(join(reactLibrary, 'src'), { recursive: true })
      await mkdir(join(astroApplication, 'src', 'layouts'), { recursive: true })
      await mkdir(join(reactApplication, 'src', 'app'), { recursive: true })
      await writeFile(
        join(astroLibrary, 'package.json'),
        '{"name":"@example/astro-ui","peerDependencies":{"@santi020k/lumen-astro":"^2.0.0"}}\n'
      )
      await writeFile(
        join(reactLibrary, 'package.json'),
        '{"name":"@example/react-ui","peerDependencies":{"@santi020k/lumen-react":"^2.0.0"}}\n'
      )
      await writeFile(
        join(astroLibrary, 'src', 'Dialog.astro'),
        'import { Dialog } from \'@santi020k/lumen-astro\'\n<Dialog />\n'
      )
      await writeFile(
        join(reactLibrary, 'src', 'Card.tsx'),
        'import { Card } from \'@santi020k/lumen-react\'\nexport const SharedCard = () => <Card />\n'
      )
      await writeFile(
        join(astroApplication, 'package.json'),
        '{"name":"docs","private":true,"dependencies":{"@example/astro-ui":"workspace:*"}}\n'
      )
      await writeFile(
        join(reactApplication, 'package.json'),
        '{"name":"dashboard","private":true,"dependencies":{"@example/react-ui":"workspace:*"}}\n'
      )
      await writeFile(
        join(astroApplication, 'src', 'layouts', 'Base.astro'),
        'import UIPrimitives from \'@santi020k/lumen-astro/runtime\'\nimport \'@santi020k/lumen-astro/styles.css\'\n<UIPrimitives /><slot />\n'
      )
      await writeFile(
        join(reactApplication, 'src', 'app', 'layout.tsx'),
        'import \'@santi020k/lumen-react/styles.css\'\nexport default function Layout({ children }: { children: React.ReactNode }) { return children }\n'
      )

      const report = await inspectLumenIntegration(root)

      expect(report.healthy).toBe(true)
      expect(report.frameworks).toEqual(expect.arrayContaining(['astro', 'react']))
      expect(report.findings).not.toContainEqual(expect.objectContaining({
        rule: 'framework-style-missing'
      }))

      await writeFile(
        join(reactLibrary, 'src', 'styles.css'),
        '@import "@santi020k/lumen-react/styles.css";\n'
      )

      const styleReport = await inspectLumenIntegration(root)

      expect(styleReport.healthy).toBe(true)
      expect(styleReport.findings).toContainEqual(expect.objectContaining({
        rule: 'shared-library-adapter-style',
        severity: 'advisory'
      }))
    } finally {
      await rm(root, { force: true, recursive: true })
    }
  })

  test('blocks the removed Astro runtime root import with an exact migration', async () => {
    const root = await mkdtemp(join(tmpdir(), 'lumen-doctor-runtime-export-'))

    try {
      await mkdir(join(root, 'src'), { recursive: true })
      await writeFile(join(root, 'package.json'), '{"name":"site"}\n')
      await writeFile(
        join(root, 'src', 'page.astro'),
        'import { UIPrimitives } from \'@santi020k/lumen-astro\'\n<UIPrimitives />\n'
      )
      await writeFile(
        join(root, 'src', 'global.css'),
        '@import "@santi020k/lumen-astro/styles.css";\n'
      )

      const report = await inspectLumenIntegration(root)
      const removedRootExport = report.findings.find(finding => finding.rule === 'removed-root-export')

      expect(report.healthy).toBe(false)
      expect(removedRootExport?.remediation).toContain('@santi020k/lumen-astro/runtime')
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

  test('provides component-aware internal selector remediation for Astro', async () => {
    const root = await mkdtemp(join(tmpdir(), 'lumen-doctor-astro-selectors-'))

    try {
      await mkdir(join(root, 'src'), { recursive: true })
      await writeFile(join(root, 'package.json'), '{"name":"site"}\n')
      await writeFile(
        join(root, 'src', 'page.astro'),
        'import { Badge, Card } from \'@santi020k/lumen-astro\'\n<Badge /><Card />\n'
      )
      await writeFile(
        join(root, 'src', 'global.css'),
        '.ui-badge {}\n.ui-card--glass {}\n.ui-card__header {}\n.ui-private {}\n'
      )

      const findings = (await inspectLumenIntegration(root)).findings
        .filter(item => item.rule === 'internal-selector')
      const badge = findings.find(item => item.message.includes('.ui-badge'))
      const cardModifier = findings.find(item => item.message.includes('.ui-card--glass'))
      const cardPart = findings.find(item => item.message.includes('.ui-card__header'))
      const unknown = findings.find(item => item.message.includes('.ui-private'))

      expect(badge?.message).toContain('Badge component')
      expect(badge?.remediation).toContain('public class prop in Astro')
      expect(badge?.remediation).not.toContain('[data-slot=')
      expect(cardModifier?.remediation).toContain('[data-slot="card"]')
      expect(cardPart?.remediation).toContain('[data-slot="card-header"]')
      expect(unknown?.message).not.toContain('most likely targets')
      expect(unknown?.remediation).not.toContain('[data-slot=')
    } finally {
      await rm(root, { force: true, recursive: true })
    }
  })

  test.each([
    {
      expected: 'public className prop in React',
      packageName: '@santi020k/lumen-react',
      sourceFile: 'component.tsx'
    },
    {
      expected: 'class attribute on the Elements host',
      packageName: '@santi020k/lumen-elements/define',
      sourceFile: 'elements.ts'
    }
  ])('uses adapter-specific class guidance for $packageName', async fixture => {
    const root = await mkdtemp(join(tmpdir(), 'lumen-doctor-adapter-selectors-'))

    try {
      await mkdir(join(root, 'src'), { recursive: true })
      await writeFile(join(root, 'package.json'), '{"name":"site"}\n')
      await writeFile(
        join(root, 'src', fixture.sourceFile),
        `import { Icon } from '${fixture.packageName}'\nvoid Icon\n`
      )
      await writeFile(join(root, 'src', 'global.css'), '.ui-icon {}\n')

      const icon = (await inspectLumenIntegration(root)).findings.find(
        item => item.rule === 'internal-selector'
      )

      expect(icon?.message).toContain('Icon component')
      expect(icon?.remediation).toContain(fixture.expected)
      expect(icon?.remediation).not.toContain('[data-slot=')
    } finally {
      await rm(root, { force: true, recursive: true })
    }
  })

  test('suggests Lumen primitives for common hand-built behavior without blocking the audit', async () => {
    const root = await mkdtemp(join(tmpdir(), 'lumen-doctor-duplication-'))

    try {
      await mkdir(join(root, 'src'), { recursive: true })
      await writeFile(join(root, 'package.json'), '{"name":"site"}\n')
      await writeFile(
        join(root, 'src', 'custom-ui.tsx'),
        `
          import { Card } from '@santi020k/lumen-react'
          const theme = localStorage.getItem('theme')
          document.documentElement.dataset.theme = theme ?? 'light'
          const onDialogKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Tab') document.querySelector('button')?.focus()
          }
          const onMenuKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'ArrowDown') document.querySelector('[role="menuitem"]')?.focus()
          }
          export const CustomUi = () => <>
            <details className="account-dropdown"><summary>Account</summary><div role="menu" onKeyDown={onMenuKeyDown} /></details>
            <div role="dialog" aria-modal="true" onKeyDown={onDialogKeyDown} />
          </>
        `
      )
      await writeFile(
        join(root, 'src', 'global.css'), '@import "@santi020k/lumen-react/styles.css";\n'
      )

      const report = await inspectLumenIntegration(root)
      const rules = report.findings.map(item => item.rule)

      expect(report.healthy).toBe(true)
      expect(rules).toEqual(expect.arrayContaining([
        'hand-built-dialog-focus',
        'hand-built-dropdown',
        'hand-built-menu-keyboard',
        'hand-built-theme-persistence'
      ]))
      expect(report.findings.every(item => item.severity === 'advisory')).toBe(true)
    } finally {
      await rm(root, { force: true, recursive: true })
    }
  })

  test('does not suggest replacements when the matching Lumen primitives are imported', async () => {
    const root = await mkdtemp(join(tmpdir(), 'lumen-doctor-primitives-'))

    try {
      await mkdir(join(root, 'src'), { recursive: true })
      await writeFile(join(root, 'package.json'), '{"name":"site"}\n')
      await writeFile(
        join(root, 'src', 'page.tsx'),
        `
          import { Dialog, DropdownMenu, ThemeToggle } from '@santi020k/lumen-react'
          const persistedTheme = localStorage.getItem('theme')
          document.documentElement.dataset.theme = persistedTheme ?? 'light'
          export const Page = () => <><details className="dropdown" /><div role="dialog" aria-modal="true" onKeyDown={event => event.key === 'Tab' && event.currentTarget.focus()} /><div role="menu" onKeyDown={event => event.key === 'ArrowDown'} /><Dialog /><DropdownMenu /><ThemeToggle /></>
        `
      )
      await writeFile(
        join(root, 'src', 'global.css'), '@import "@santi020k/lumen-react/styles.css";\n'
      )

      const report = await inspectLumenIntegration(root)

      expect(report.findings.some(item => item.rule.startsWith('hand-built-'))).toBe(false)
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
