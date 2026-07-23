import { readFileSync } from 'node:fs'

import { describe, expect, test } from 'vitest'

import { loadLumenData } from './data.js'
import { getComponent, getRules, getTokens, listComponents, resolveComponent, search } from './tools.js'

describe('lumen-mcp data snapshot', () => {
  test('bundles components, tokens, and rules', () => {
    const data = loadLumenData()

    expect(data.components.length).toBeGreaterThan(50)
    expect(data.meta.componentCount).toBe(data.components.length)
    expect(data.meta.serverVersion).toMatch(/^\d+\.\d+\.\d+/)
    expect(data.tokens.semantic).toContain('brand')
    expect(data.rules.length).toBeGreaterThan(0)
  })

  test('matches the package version and contains no volatile build timestamp', () => {
    const data = loadLumenData()
    const packageJson = JSON.parse(
      readFileSync(new URL('../package.json', import.meta.url), 'utf8')
    ) as { version: string }

    expect(data.meta.serverVersion).toBe(packageJson.version)
    expect(data.meta).not.toHaveProperty('generatedAt')
  })

  test('ships the package license', () => {
    const license = readFileSync(new URL('../LICENSE', import.meta.url), 'utf8')

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
  test('returns props and Astro source for a known component', () => {
    const result = getComponent({ name: 'Button' })

    expect(result.isError).toBeFalsy()
    expect(result.text).toContain('# Button')
    expect(result.text).toContain('```astro')
  })

  test('can omit the source', () => {
    const result = getComponent({ includeSource: false, name: 'Button' })

    expect(result.text).not.toContain('```astro')
  })

  test('errors on unknown component', () => {
    const result = getComponent({ name: 'Nope' })

    expect(result.isError).toBe(true)
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

    expect(firstResult).toContain('component: Button (button)')
  })

  test('finds relevant components from a natural-language use case', () => {
    const result = search({ query: 'date input' })

    expect(result.text).toContain('DatePicker')
    expect(result.text).toContain('DateRangePicker')
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
})

describe('getTokens and getRules', () => {
  test('returns tokens', () => {
    expect(getTokens().text).toContain('Semantic token names')
  })

  test('returns rules', () => {
    expect(getRules().text.length).toBeGreaterThan(0)
  })
})
