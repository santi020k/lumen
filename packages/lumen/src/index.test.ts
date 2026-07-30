import {
  existsSync
} from 'node:fs'
import {
  mkdir,
  mkdtemp,
  readFile,
  rm,
  writeFile
} from 'node:fs/promises'
import {
  tmpdir
} from 'node:os'
import {
  join
} from 'node:path'

import { describe, expect, test, vi } from 'vitest'

import {
  addLumenRegistryItem,
  auditLumenTokenCss,
  getLumenRegistryEntries,
  getLumenRegistryItem,
  loadLumenRegistry,
  lumen,
  lumenComponentNames,
  lumenGlass,
  lumenPackages,
  lumenRegistry } from './index.js'

describe('@santi020k/lumen umbrella package', () => {
  test('audits semantic token declarations that use complete CSS colors', () => {
    expect(auditLumenTokenCss(`
      :root {
        --surface: #fff;
        --ink: hsl(220 20% 10%);
        --line: 220 13% 86%;
        --brand: var(--legacy-brand-channels);
      }
    `, 'theme.css')).toEqual([
      expect.objectContaining({ file: 'theme.css', token: 'surface', value: '#fff' }),
      expect.objectContaining({ file: 'theme.css', token: 'ink', value: 'hsl(220 20% 10%)' })
    ])
  })

  test('exports umbrella metadata and shared package metadata', () => {
    expect(lumen).toEqual({
      name: 'Lumen',
      packageName: '@santi020k/lumen',
      scope: '@santi020k'
    })

    expect(lumenComponentNames).toContain('Button')
    expect(lumenGlass.blur).toBe('22px')

    expect(lumenPackages.some(pkg => pkg.packageName === lumen.packageName)).toBe(true)
  })

  test('exports registry recipes and components for product surfaces', () => {
    expect(lumenRegistry.items.map(item => item.name)).toEqual([
      'all-components',
      'advanced-fields',
      'scheduler',
      'data-collections',
      'theme-builder',
      'rich-text-editor',
      'data-visualization',
      'analytics-dashboard',
      'saas-admin',
      'commerce-dashboard',
      'project-workspace',
      'auth-onboarding',
      'ai-docs',
      'figma-design-to-code'
    ])

    expect(getLumenRegistryItem('scheduler')).toMatchObject({
      components: [
        'Schedule',
        'Agenda',
        'Calendar',
        'DatePicker'
      ]
    })

    expect(lumenRegistry.components.map(component => component.name)).toEqual(lumenComponentNames)
    expect(getLumenRegistryEntries()).toHaveLength(lumenRegistry.items.length + lumenComponentNames.length)

    const dataTable = getLumenRegistryItem('data-table')

    expect(dataTable?.type).toBe('component')
    expect(dataTable).toMatchObject({
      category: 'Data display',
      dependencies: ['styles', 'runtime'],
      description: 'Styles dense tabular data and records.',
      name: 'DataTable'
    })
    expect(dataTable?.files).toContain('packages/astro/runtime/UIPrimitives.astro')
  })

  test('installs registry recipes into a target directory', async () => {
    const cwd = await mkdtemp(join(tmpdir(), 'lumen-add-'))

    try {
      const dryRun = await addLumenRegistryItem('scheduler', { cwd, dryRun: true })

      expect(dryRun.files).toEqual(['src/lumen/scheduler.astro'])
      expect(existsSync(join(cwd, 'src/lumen/scheduler.astro'))).toBe(false)

      const result = await addLumenRegistryItem('scheduler', { cwd })
      const source = await readFile(join(cwd, 'src/lumen/scheduler.astro'), 'utf8')

      expect(result.dryRun).toBe(false)
      expect(source).toContain('data-ui-schedule-event')
      expect(source).toContain('@santi020k/lumen-astro')

      await writeFile(join(cwd, 'src/lumen/scheduler.astro'), 'custom', 'utf8')

      const skipped = await addLumenRegistryItem('scheduler', { cwd })

      expect(skipped.added).toEqual([])
      expect(skipped.skipped).toEqual(['src/lumen/scheduler.astro'])
      await expect(readFile(join(cwd, 'src/lumen/scheduler.astro'), 'utf8')).resolves.toBe('custom')

      const forced = await addLumenRegistryItem('scheduler', { cwd, force: true })

      expect(forced.added).toEqual(['src/lumen/scheduler.astro'])
      await expect(readFile(join(cwd, 'src/lumen/scheduler.astro'), 'utf8')).resolves.toContain('data-ui-schedule-event')
      await expect(addLumenRegistryItem('scheduler', { conflict: 'error', cwd })).rejects.toThrow('Refusing to overwrite')
    } finally {
      await rm(cwd, { force: true, recursive: true })
    }
  })

  test('installs registry components into a target directory', async () => {
    const cwd = await mkdtemp(join(tmpdir(), 'lumen-component-add-'))

    try {
      const dryRun = await addLumenRegistryItem('data-table', { cwd, dryRun: true })

      expect(dryRun.item.name).toBe('DataTable')
      expect(dryRun.files).toEqual(['src/lumen/data-table.astro'])
      expect(existsSync(join(cwd, 'src/lumen/data-table.astro'))).toBe(false)

      const result = await addLumenRegistryItem('DataTable', { cwd })
      const source = await readFile(join(cwd, 'src/lumen/data-table.astro'), 'utf8')

      expect(result.added).toEqual(['src/lumen/data-table.astro'])
      expect(source).toContain('import { DataTable as LumenDataTable } from \'@santi020k/lumen-astro\'')
      expect(source).toContain('<LumenDataTable {...props}>')

      await writeFile(join(cwd, 'src/lumen/data-table.astro'), 'custom', 'utf8')

      const skipped = await addLumenRegistryItem('data-table', { cwd })

      expect(skipped.added).toEqual([])
      expect(skipped.skipped).toEqual(['src/lumen/data-table.astro'])
      await expect(readFile(join(cwd, 'src/lumen/data-table.astro'), 'utf8')).resolves.toBe('custom')
    } finally {
      await rm(cwd, { force: true, recursive: true })
    }
  })

  test('installs framework-targeted component wrappers', async () => {
    const cwd = await mkdtemp(join(tmpdir(), 'lumen-component-targets-'))

    try {
      const react = await addLumenRegistryItem('button', { cwd, target: 'react' })
      const elements = await addLumenRegistryItem('button', { cwd, target: 'elements' })
      const reactSource = await readFile(join(cwd, 'src/lumen/button.tsx'), 'utf8')
      const elementsSource = await readFile(join(cwd, 'src/lumen/button.ts'), 'utf8')

      expect(react.added).toEqual(['src/lumen/button.tsx'])
      expect(reactSource).toContain('import { Button as LumenButton } from \'@santi020k/lumen-react\'')
      expect(reactSource).toContain('export type ButtonProps = ComponentPropsWithoutRef<typeof LumenButton>')
      expect(reactSource).toContain('export const Button = (props: ButtonProps) => <LumenButton {...props} />')

      expect(elements.added).toEqual(['src/lumen/button.ts'])
      expect(elementsSource).toContain('import {\n  defineLumenElements,\n  LumenButtonElement\n} from \'@santi020k/lumen-elements\'')
      expect(elementsSource).toContain('export const buttonTagName = \'lumen-button\' as const')
      expect(elementsSource).toContain('\'lumen-button\': InstanceType<typeof LumenButtonElement>')
    } finally {
      await rm(cwd, { force: true, recursive: true })
    }
  })

  test('installs recipe starter files for each framework target', async () => {
    const cwd = await mkdtemp(join(tmpdir(), 'lumen-recipe-target-'))

    try {
      const react = await addLumenRegistryItem('scheduler', { cwd, target: 'react' })
      const elements = await addLumenRegistryItem('theme-builder', { cwd, target: 'elements' })
      const reactSource = await readFile(join(cwd, 'src/lumen/scheduler.tsx'), 'utf8')
      const elementsSource = await readFile(join(cwd, 'src/lumen/theme-builder.html'), 'utf8')

      expect(react.added).toEqual(['src/lumen/scheduler.tsx'])
      expect(reactSource).toContain('from \'@santi020k/lumen-react\'')
      expect(reactSource).toContain('export const SchedulerRecipe')
      expect(reactSource).toContain('useSchedule')
      expect(reactSource).toContain('schedule.getSlotProps(\'monday\')')
      expect(reactSource).toContain('schedule.getEventProps(\'schedule-planning\')')

      expect(elements.added).toEqual(['src/lumen/theme-builder.html'])
      expect(elementsSource).toContain('defineLumenElements()')
      expect(elementsSource).toContain('<lumen-theme-builder')
      expect(elementsSource).toContain('data-lumen-theme-builder-recipe')
    } finally {
      await rm(cwd, { force: true, recursive: true })
    }
  })

  test('installs every product template for every framework target', async () => {
    const templateNames = [
      'analytics-dashboard',
      'saas-admin',
      'commerce-dashboard',
      'project-workspace',
      'auth-onboarding'
    ] as const
    const targets = ['astro', 'react', 'elements'] as const
    const sourceMarkers = {
      'analytics-dashboard': 'Growth overview',
      'auth-onboarding': 'Create your workspace',
      'commerce-dashboard': 'Commerce command center',
      'project-workspace': 'Team workspace',
      'saas-admin': 'Good morning, Maya'
    } as const

    for (const templateName of templateNames) {
      for (const target of targets) {
        const cwd = await mkdtemp(join(tmpdir(), `lumen-${templateName}-${target}-`))

        try {
          const result = await addLumenRegistryItem(templateName, { cwd, target })
          const extensions = {
            astro: 'astro',
            elements: 'html',
            react: 'tsx'
          }
          const extension = extensions[target]
          const templatePath = join(cwd, `src/lumen/${templateName}.${extension}`)
          const stylesheetPath = join(cwd, 'src/lumen/lumen-template.css')
          const source = await readFile(templatePath, 'utf8')
          const stylesheet = await readFile(stylesheetPath, 'utf8')

          expect(result.added).toEqual([
            'src/lumen/lumen-template.css',
            `src/lumen/${templateName}.${extension}`
          ].sort())
          expect(source).toContain(sourceMarkers[templateName])
          expect(stylesheet).toContain('.lumen-template__shell')

          const frameworkMarkers = {
            astro: '@santi020k/lumen-astro',
            elements: 'defineLumenElements()',
            react: '@santi020k/lumen-react'
          }

          expect(source).toContain(frameworkMarkers[target])
        } finally {
          await rm(cwd, { force: true, recursive: true })
        }
      }
    }
  })

  test('rejects unknown install items', async () => {
    await expect(addLumenRegistryItem('missing')).rejects.toThrow('Unknown Lumen registry item')
  })

  test('loads external registry manifests', async () => {
    const cwd = await mkdtemp(join(tmpdir(), 'lumen-registry-'))
    const registryPath = join(cwd, 'registry.json')

    try {
      await writeFile(registryPath, JSON.stringify({
        description: 'Test registry',
        components: [{
          category: 'Actions',
          dependencies: ['styles'],
          description: 'Custom button wrapper.',
          files: ['packages/astro/components/Button.astro', 'packages/astro/styles/lumen.css'],
          name: 'Button',
          type: 'component'
        }],
        items: [{ name: 'custom', type: 'recipe', components: ['Button'] }],
        name: 'test',
        packages: ['@santi020k/lumen-astro'],
        version: 1
      }), 'utf8')

      const registry = await loadLumenRegistry(registryPath)

      expect(registry.name).toBe('test')
      expect(registry.items[0]?.name).toBe('custom')
      expect(registry.components?.[0]?.name).toBe('Button')
    } finally {
      await rm(cwd, { force: true, recursive: true })
    }
  })

  test('installs components from external registry manifests', async () => {
    const cwd = await mkdtemp(join(tmpdir(), 'lumen-external-component-'))

    try {
      const result = await addLumenRegistryItem('custom-card', {
        cwd,
        registry: {
          components: [{
            category: 'Layout',
            dependencies: ['styles'],
            description: 'Custom card wrapper.',
            files: ['packages/astro/components/Card.astro', 'packages/astro/styles/lumen.css'],
            name: 'CustomCard',
            type: 'component'
          }],
          description: 'Test registry',
          items: [],
          name: 'test',
          packages: ['@santi020k/lumen-astro'],
          version: 1
        }
      })

      expect(result.item.name).toBe('CustomCard')
      expect(result.added).toEqual(['src/lumen/custom-card.astro'])
      await expect(readFile(join(cwd, 'src/lumen/custom-card.astro'), 'utf8')).resolves.toContain('LumenCustomCard')
    } finally {
      await rm(cwd, { force: true, recursive: true })
    }
  })

  test('installs inline files from external registry manifests', async () => {
    const cwd = await mkdtemp(join(tmpdir(), 'lumen-external-'))
    const registryPath = join(cwd, 'registry.json')

    try {
      await writeFile(registryPath, JSON.stringify({
        description: 'Test registry',
        items: [{
          files: [{
            path: 'src/lumen/custom.astro',
            source: '<section>Custom recipe</section>\n'
          }],
          name: 'custom',
          type: 'recipe'
        }],
        name: 'test',
        packages: ['@santi020k/lumen-astro'],
        version: 1
      }), 'utf8')

      const registry = await loadLumenRegistry(registryPath)
      const result = await addLumenRegistryItem('custom', { cwd, registry })

      expect(result.added).toEqual(['src/lumen/custom.astro'])
      await expect(readFile(join(cwd, 'src/lumen/custom.astro'), 'utf8')).resolves.toContain('Custom recipe')
    } finally {
      await rm(cwd, { force: true, recursive: true })
    }
  })

  test('merges registry recipes with existing files', async () => {
    const cwd = await mkdtemp(join(tmpdir(), 'lumen-merge-'))

    try {
      const target = join(cwd, 'src/lumen/custom.astro')
      await mkdir(join(cwd, 'src/lumen'), { recursive: true })

      await writeFile(target, '<section>Existing</section>\n', 'utf8')

      const result = await addLumenRegistryItem('custom', {
        conflict: 'merge',
        cwd,
        registry: {
          description: 'Test registry',
          items: [{
            files: [{
              path: 'src/lumen/custom.astro',
              source: '<section>Incoming</section>\n'
            }],
            name: 'custom',
            type: 'recipe'
          }],
          name: 'test',
          packages: ['@santi020k/lumen-astro'],
          version: 1
        }
      })
      const source = await readFile(target, 'utf8')

      expect(result.added).toEqual([])
      expect(result.merged).toEqual(['src/lumen/custom.astro'])
      expect(source).toContain('Existing')
      expect(source).toContain('Lumen merge: src/lumen/custom.astro')
      expect(source).toContain('Incoming')
    } finally {
      await rm(cwd, { force: true, recursive: true })
    }
  })

  test('loads authenticated remote registry manifests', async () => {
    const registry = JSON.stringify({
      description: 'Private registry',
      components: [{
        category: 'Actions',
        dependencies: ['styles'],
        description: 'Private button.',
        files: ['packages/astro/components/Button.astro'],
        name: 'PrivateButton',
        type: 'component'
      }],
      items: [{ name: 'private', type: 'recipe' }],
      name: 'private',
      packages: ['@santi020k/lumen-astro'],
      version: 1
    })
    const fetch = vi.spyOn(globalThis, 'fetch').mockImplementation((_url, init) => {
      expect(_url).toBe('https://registry.example/lumen.json')
      expect(new Headers(init?.headers).get('authorization')).toBe('Bearer secret')

      return Promise.resolve(new Response(registry, {
        headers: { 'content-type': 'application/json' }
      }))
    })
    const loaded = await loadLumenRegistry('https://registry.example/lumen.json', {
      token: 'secret'
    })

    expect(fetch).toHaveBeenCalledOnce()
    expect(loaded.name).toBe('private')
    expect(loaded.components?.[0]?.name).toBe('PrivateButton')
    expect(loaded.items[0]?.name).toBe('private')
  })
})
