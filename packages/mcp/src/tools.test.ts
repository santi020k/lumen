import * as fs from 'node:fs'

import { describe, expect, test } from 'vitest'

import { loadLumenData } from './data.js'
import {
  diagnose,
  diffCatalog,
  getCatalogManifest,
  getComponent,
  getMeta,
  getRecipe,
  getRules,
  getTokens,
  listComponents,
  resolveComponent,
  resolveRecipe,
  search
} from './tools.js'

describe('lumen-mcp data snapshot', () => {
  test('bundles components, tokens, and rules', () => {
    const data = loadLumenData()

    expect(data.components.length).toBeGreaterThan(50)
    expect(data.meta.componentCount).toBe(data.components.length)
    expect(data.meta.catalogHash).toMatch(/^[a-f0-9]{64}$/)
    expect(data.meta.schemaVersion).toBeGreaterThanOrEqual(2)
    expect(data.meta.serverVersion).toMatch(/^\d+\.\d+\.\d+/)
    expect(data.tokens.semantic).toContain('brand')
    expect(data.tokens.chart.series1).toBeDefined()
    expect(data.rules.length).toBeGreaterThan(0)
  })

  test('bundles rich metadata and real framework contracts', () => {
    const data = loadLumenData()
    const dateRangePicker = resolveComponent('DateRangePicker', data)

    expect(dateRangePicker).toMatchObject({
      category: 'Forms',
      collections: ['Dates and time']
    })
    expect(dateRangePicker?.dependencies).toEqual(
      expect.arrayContaining(['DatePicker'])
    )
    expect(dateRangePicker?.description).toMatch(
      /date range|start and end date/i
    )
    expect(dateRangePicker?.apiReference).not.toHaveLength(0)
    expect(dateRangePicker?.frameworkDetails.astro.source).toContain(
      'interface Props'
    )
    expect(dateRangePicker?.frameworkDetails.react.source).toContain(
      'DateRangePickerProps'
    )
    expect(dateRangePicker?.frameworkDetails.elements).toMatchObject({
      available: true,
      registration: 'defineLumenElements()',
      tagName: 'lumen-date-range-picker'
    })
    expect(
      data.components.every(component => Object.values(component.frameworkDetails).every(
        framework => framework.available
      ))
    ).toBe(true)
  })

  test('documents wrapped code and Astro motion runtime requirements', () => {
    const data = loadLumenData()
    const accordion = resolveComponent('Accordion', data)
    const code = resolveComponent('Code', data)

    expect(accordion?.apiReference).toContainEqual(
      expect.objectContaining({
        attribute: 'variant',
        values: '"default" | "flush"'
      })
    )
    expect(accordion?.frameworkDetails.astro.props).toContainEqual(
      expect.objectContaining({
        name: 'variant',
        type: 'AccordionVariant'
      })
    )

    expect(code?.apiReference).toContainEqual(
      expect.objectContaining({
        attribute: 'wrap',
        defaultValue: 'false'
      })
    )
    expect(code?.frameworkDetails.astro.props).toContainEqual(
      expect.objectContaining({
        name: 'wrap',
        type: 'boolean'
      })
    )

    for (const name of ['AnimatedNumber', 'RevealGroup', 'ScrollReveal']) {
      expect(resolveComponent(name, data)?.dependencies).toEqual(
        expect.arrayContaining(['runtime', 'styles'])
      )
    }
  })

  test('matches package versions and contains deterministic freshness metadata', () => {
    const data = loadLumenData()
    const readFsFile = Reflect.get(fs, 'readFileSync')
    const packageJson = JSON.parse(
      readFsFile(new URL('../package.json', import.meta.url), 'utf8')
    ) as {
      version: string
    }

    expect(data.meta.serverVersion).toBe(packageJson.version)
    expect(data.meta.packageVersions['@santi020k/lumen-mcp']).toBe(
      packageJson.version
    )
    expect(data.meta).not.toHaveProperty('generatedAt')
  })

  test('bundles framework-specific examples and behavior setup', () => {
    const data = loadLumenData()
    const dialog = resolveComponent('Dialog', data)
    const dateRangePicker = resolveComponent('DateRangePicker', data)

    expect(dialog?.frameworkDetails.react.example).toContain('useDialog()')
    expect(dialog?.frameworkDetails.react.example).toContain(
      'dialog.triggerProps'
    )
    expect(dialog?.frameworkDetails.react.example).not.toContain(
      'data-ui-dialog-trigger'
    )
    expect(dialog?.frameworkDetails.react.behavior).toMatchObject({
      hook: 'useDialog',
      mode: 'hook'
    })
    expect(dialog?.frameworkDetails.elements.example).toContain(
      '<lumen-dialog'
    )
    expect(dialog?.frameworkDetails.astro.behavior?.setup).toContain(
      'UIPrimitives'
    )
    expect(dateRangePicker?.frameworkDetails.astro.behavior?.setup).toContain(
      'UIPrimitives'
    )
  })

  test('bundles conditional Astro runtime bypass metadata', () => {
    const toggle = resolveComponent('Toggle', loadLumenData())

    expect(toggle?.frameworkDetails.astro.behavior).toMatchObject({
      runtimeBypass: 'controlled'
    })
    expect(toggle?.frameworkDetails.astro.behavior?.setup).toContain(
      'Set controlled'
    )
  })

  test('bundles React hook behavior for interactive components', () => {
    const data = loadLumenData()

    for (const name of ['AlertDialog', 'Dialog', 'Drawer', 'Sheet']) {
      const react = resolveComponent(name, data)?.frameworkDetails.react

      expect(react?.behavior).toMatchObject({
        hook: 'useDialog',
        mode: 'hook'
      })
      expect(react?.example).toContain('dialog.triggerProps')
      expect(react?.example).not.toMatch(
        /data-ui-(?:alert-dialog|dialog|drawer|sheet)-trigger/
      )
    }
  })

  test('associates runtime events with their components', () => {
    expect(resolveComponent('DataTable')?.runtimeEvents).toContainEqual(
      expect.objectContaining({ name: 'ui:data-table-selection-change' })
    )
    expect(resolveComponent('DataTable')?.runtimeEvents).not.toContainEqual(
      expect.objectContaining({ name: 'ui:datatable-selection-change' })
    )
  })

  test('ships the package license', () => {
    const readFsFile = Reflect.get(fs, 'readFileSync')
    const license = readFsFile(new URL('../LICENSE', import.meta.url), 'utf8')

    expect(license).toContain('MIT License')
    expect(license).toContain('Santiago Molina')
  })
})

describe('resolveComponent', () => {
  test('resolves PascalCase and kebab-case aliases', () => {
    expect(resolveComponent('Button')?.name).toBe('Button')
    expect(resolveComponent('data-table')?.name).toBe('DataTable')
  })

  test('returns undefined for unknown names', () => {
    expect(resolveComponent('NotAComponent')).toBeUndefined()
  })
})

describe('listComponents', () => {
  test('lists all components by default', () => {
    const result = listComponents()

    expect(result.isError).toBeFalsy()
    expect(result.text).toContain('Button')
    expect(result.data.count).toBe(result.data.components.length)
    expect(result.data.components[0]).toHaveProperty('description')
  })

  test('filters by framework', () => {
    const result = listComponents({ framework: 'astro' })

    expect(result.text).toContain('component(s)')
  })

  test('filters by query', () => {
    const result = listComponents({ query: 'button' })

    expect(result.text.toLowerCase()).toContain('button')
  })

  test('filters by recipe membership', () => {
    const result = listComponents({ recipe: 'scheduler' })

    expect(result.text).toContain('Calendar')
    expect(result.text).not.toContain('Button (button)')
  })

  test('normalizes friendly recipe filters', () => {
    expect(listComponents({ recipe: 'Advanced Fields' }).data.count).toBe(
      listComponents({ recipe: 'advanced-fields' }).data.count
    )
  })

  test('returns a clear empty result', () => {
    expect(listComponents({ query: 'definitely-not-a-component' }).text).toBe(
      'No components matched the given filters.'
    )
  })
})

describe('getComponent', () => {
  test('returns framework-specific usage by default', () => {
    const result = getComponent({ framework: 'astro', name: 'Button' })

    expect(result.isError).toBeFalsy()
    expect(result.text).toContain('# Button')
    expect(result.text).toContain('@santi020k/lumen-astro')
    expect(result.text).not.toContain('reference source')
    expect(result.data.found).toBe(true)
  })

  test('returns React props, imports, examples, and source', () => {
    const result = getComponent({
      detail: 'source',
      framework: 'react',
      name: 'Button'
    })

    expect(result.text).toContain('@santi020k/lumen-react')
    expect(result.text).toContain('ButtonProps')
    expect(result.text).toContain('react reference source')
    expect(result.data.component).toHaveProperty('framework.source')
  })

  test('returns framework behavior setup with usage detail', () => {
    const react = getComponent({ framework: 'react', name: 'Dialog' })
    const astro = getComponent({ framework: 'astro', name: 'Dialog' })

    expect(react.text).toContain('## Framework behavior')
    expect(react.text).toContain('Hook: useDialog')
    expect(react.text).toContain('dialog.triggerProps')
    expect(astro.text).toContain('Mount UIPrimitives once')
  })

  test('returns Web Component registration, attributes, and tag usage', () => {
    const result = getComponent({
      framework: 'elements',
      name: 'DateRangePicker'
    })

    expect(result.text).toContain('<lumen-date-range-picker>')
    expect(result.data.component).toMatchObject({
      framework: {
        registration: 'defineLumenElements()',
        tagName: 'lumen-date-range-picker'
      }
    })
  })

  test('supports a compact summary detail', () => {
    const result = getComponent({ detail: 'summary', name: 'Button' })

    expect(result.text).not.toContain('## Example')
    expect(result.data.component).not.toHaveProperty('apiReference')
  })

  test('errors on unknown component', () => {
    const result = getComponent({ name: 'Nope' })

    expect(result.isError).toBe(true)
  })
})

describe('getRecipe', () => {
  test('resolves and returns framework-specific recipe installation', () => {
    expect(resolveRecipe('advanced_fields')?.name).toBe('advanced-fields')

    const result = getRecipe({ framework: 'react', name: 'advanced-fields' })

    expect(result.isError).toBeFalsy()
    expect(result.text).toContain('lumen add advanced-fields --target react')
    expect(result.text).toContain('DateRangePicker')
    expect(result.data.recipe?.categories).toContain('Forms')
  })

  test('returns a structured domain error for unknown recipes', () => {
    const result = getRecipe({ name: 'missing-recipe' })

    expect(result.isError).toBe(true)
    expect(result.data).toMatchObject({ found: false })
  })
})

describe('search', () => {
  test('finds components by keyword', () => {
    const result = search({ query: 'button' })

    expect(result.text.toLowerCase()).toContain('button')
  })

  test('ranks an exact component name first', () => {
    const result = search({ query: 'button' })
    const firstResult = result.text
      .split('\n')
      .find(line => line.startsWith('component:'))

    expect(firstResult).toContain('component: Button')
    expect(result.data.results[0]).toMatchObject({
      kind: 'component',
      matchedTerms: ['button'],
      name: 'Button'
    })
  })

  test('finds relevant components from a natural-language use case', () => {
    const result = search({ query: 'date input' })

    expect(result.text).toContain('DatePicker')
    expect(result.text).toContain('DateRangePicker')
    expect(
      result.data.results.find(item => item.name === 'DateRangePicker')
        ?.matchedTerms
    ).toEqual(['date', 'input'])
  })

  test.each([
    ['admin dashboard', ['DataTable', 'Sidebar']],
    ['booking calendar', ['Calendar', 'Schedule']],
    ['sortable table pagination', ['DataTable', 'Pagination']],
    ['dark mode theme', ['ThemeBuilder', 'ThemeToggle']]
  ])('returns useful partial matches for %s', (query, expectedNames) => {
    const names = search({ query }).data.results.map(result => result.name)

    expect(names).toEqual(expect.arrayContaining(expectedNames))
  })

  test('filters component contracts by framework', () => {
    const result = search({ framework: 'react', query: 'dialog hook' })

    expect(result.data.results[0]).toMatchObject({
      name: 'Dialog'
    })
    expect(result.data.results[0]?.frameworks).toContain('react')
  })

  test('honors the result limit', () => {
    const result = search({ limit: 1, query: 'input' })
    const resultLines = result.text
      .split('\n')
      .filter(line => line.startsWith('component:'))

    expect(result.text).toContain('(showing 1)')
    expect(resultLines).toHaveLength(1)
  })

  test('errors on empty query', () => {
    expect(search({ query: '  ' }).isError).toBe(true)
  })

  test('returns a clear response when nothing matches', () => {
    expect(search({ query: 'definitely-not-in-lumen' }).text).toBe(
      'No matches for "definitely-not-in-lumen".'
    )
  })
})

describe('getTokens and getRules', () => {
  test('returns deterministic snapshot metadata', () => {
    const result = getMeta()

    expect(result.text).toContain('Catalog hash:')
    expect(result.data.meta.catalogHash).toMatch(/^[a-f0-9]{64}$/)
  })

  test('returns tokens', () => {
    const result = getTokens()

    expect(result.text).toContain('Semantic token names')
    expect(result.data.tokens.semantic).toContain('brand')
    expect(result.data.tokens.chart.series1).toBeDefined()
    expect(result.text).toContain('Data visualization tokens')
  })

  test('returns rules', () => {
    const result = getRules()

    expect(result.text.length).toBeGreaterThan(0)
    expect(result.data.rules).toContain('# Lumen UI')
  })

  test('errors when a custom snapshot has no bundled rules', () => {
    expect(getRules({ ...loadLumenData(), rules: '' }).isError).toBe(true)
  })
})

describe('catalog freshness and diagnostics', () => {
  test('returns stable fingerprints for every component and recipe', () => {
    const data = loadLumenData()
    const result = getCatalogManifest()

    expect(Object.keys(result.data.manifest.components)).toHaveLength(
      data.components.length
    )
    expect(Object.values(result.data.manifest.components)).toEqual(
      expect.arrayContaining([expect.stringMatching(/^[a-f0-9]{64}$/)])
    )
    expect(Object.keys(result.data.manifest.recipes)).toHaveLength(
      data.recipes.length
    )
  })

  test('reports unchanged and changed client manifests', () => {
    const current = getCatalogManifest().data
    const unchanged = diffCatalog({
      baseline: current.manifest,
      baselineCatalogHash: current.catalogHash
    })
    const changed = diffCatalog({
      baseline: {
        components: {
          ...current.manifest.components,
          Button: '0'.repeat(64),
          RemovedComponent: '1'.repeat(64)
        },
        recipes: current.manifest.recipes
      }
    })

    expect(unchanged.data.unchanged).toBe(true)
    expect(changed.data.components.changed).toContain('Button')
    expect(changed.data.components.removed).toContain('RemovedComponent')
  })

  test('reports a healthy bundled snapshot and detects corruption', () => {
    const data = loadLumenData()

    expect(diagnose().data.status).toBe('healthy')
    expect(
      diagnose({
        ...data,
        meta: { ...data.meta, componentCount: 0 }
      }).data.status
    ).toBe('issues')
  })
})
