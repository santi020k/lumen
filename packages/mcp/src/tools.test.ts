import { describe, expect, test } from 'vitest'

import { loadLumenData } from './data.js'
import { getComponent, getRules, getTokens, listComponents, resolveComponent, search } from './tools.js'

describe('lumen-mcp data snapshot', () => {
  test('bundles components, tokens, and rules', () => {
    const data = loadLumenData()

    expect(data.components.length).toBeGreaterThan(50)
    expect(data.tokens.semantic).toContain('brand')
    expect(data.rules.length).toBeGreaterThan(0)
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
