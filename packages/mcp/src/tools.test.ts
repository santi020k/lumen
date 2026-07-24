import { readFileSync as readFsFile } from 'node:fs'

import { describe, expect, test } from 'vitest'

import { loadLumenData } from './data.js'
import {
  getComponent,
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
    expect(data.meta.serverVersion).toMatch(/^\d+\.\d+\.\d+/)
    expect(data.tokens.semantic).toContain('brand')
    expect(data.rules.length).toBeGreaterThan(0)
  })

  test('bundles rich metadata and real framework contracts', () => {
    const data = loadLumenData()
    const dateRangePicker = resolveComponent('DateRangePicker', data)

    expect(dateRangePicker).toMatchObject({
      category: 'Forms',
      collections: ['Dates and time'],
      dependencies: expect.arrayContaining(['DatePicker']),
      description: expect.stringMatching(/date range|start and end date/i)
    })
    expect(dateRangePicker?.apiReference).not.toHaveLength(0)
    expect(dateRangePicker?.frameworkDetails.astro.source).toContain('interface Props')
    expect(dateRangePicker?.frameworkDetails.react.source).toContain('DateRangePickerProps')
    expect(dateRangePicker?.frameworkDetails.elements).toMatchObject({
      available: true,
      registration: 'defineLumenElements()',
      tagName: 'lumen-date-range-picker'
    })
    expect(data.components.every((component) =>
      Object.values(component.frameworkDetails).every((framework) => framework.available)
    )).toBe(true)
  })

  test('matches the package version and contains no volatile build timestamp', () => {
    const data = loadLumenData()
    const packageJson = JSON.parse(
      readFsFile(new URL('../package.json', import.meta.url), 'utf8')
    ) as { version: string }

    expect(data.meta.serverVersion).toBe(packageJson.version)
    expect(data.meta).not.toHaveProperty('generatedAt')
  })

  test('ships the package license', () => {
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

  test('returns a clear empty result', () => {
    expect(listComponents({ query: 'definitely-not-a-component' }).text)
      .toBe('No components matched the given filters.')
  })
})

describe('getComponent', () => {
  test('returns framework-specific usage by default', () => {
    const result = getComponent({ framework: 'astro', name: 'Button' })

    expect(result.isError).toBeFalsy()
    expect(result.text).toContain('# Button')
    expect(result.text).toContain("@santi020k/lumen-astro")
    expect(result.text).not.toContain('reference source')
    expect(result.data.found).toBe(true)
  })

  test('returns React props, imports, examples, and source', () => {
    const result = getComponent({ detail: 'source', framework: 'react', name: 'Button' })

    expect(result.text).toContain("@santi020k/lumen-react")
    expect(result.text).toContain('ButtonProps')
    expect(result.text).toContain('react reference source')
    expect(result.data.component).toHaveProperty('framework.source')
  })

  test('returns Web Component registration, attributes, and tag usage', () => {
    const result = getComponent({ framework: 'elements', name: 'DateRangePicker' })

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
    const firstResult = result.text.split('\n').find((line) => line.startsWith('component:'))

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
    expect(result.data.results.find((item) => item.name === 'DateRangePicker')?.matchedTerms)
      .toEqual(['date', 'input'])
  })

  test('honors the result limit', () => {
    const result = search({ limit: 1, query: 'input' })
    const resultLines = result.text.split('\n').filter((line) => line.startsWith('component:'))

    expect(result.text).toContain('(showing 1)')
    expect(resultLines).toHaveLength(1)
  })

  test('errors on empty query', () => {
    expect(search({ query: '  ' }).isError).toBe(true)
  })

  test('returns a clear response when nothing matches', () => {
    expect(search({ query: 'definitely-not-in-lumen' }).text)
      .toBe('No matches for "definitely-not-in-lumen".')
  })
})

describe('getTokens and getRules', () => {
  test('returns tokens', () => {
    const result = getTokens()

    expect(result.text).toContain('Semantic token names')
    expect(result.data.tokens.semantic).toContain('brand')
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
