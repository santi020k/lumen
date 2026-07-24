import { describe, expect, test } from 'vitest'

import { docsSearchIndex } from '../data/search'

import type { DocsSearchItem } from './docs-search'
import { getMatchedSearchItems, normalizeSearchText } from './docs-search'

const item = (
  title: string,
  type: DocsSearchItem['type'],
  keywords = title
): DocsSearchItem => ({
  category: 'Forms',
  description: `${title} documentation`,
  href: `/docs/${title.toLowerCase()}`,
  keywords: keywords.toLowerCase(),
  title,
  type
})

describe('docs search ranking', () => {
  test('puts components first for a broad task search in the docs index', () => {
    const [firstResult] = getMatchedSearchItems(docsSearchIndex, 'filter')

    expect(firstResult?.type).toBe('Component')
  })

  test('prioritizes components over supporting results with similar matches', () => {
    const results = getMatchedSearchItems([
      item('Filtering records', 'Recipe', 'filter records'),
      item('DataTable', 'Component', 'data table filter records')
    ], 'filter')

    expect(results.map(result => result.title)).toEqual(['DataTable', 'Filtering records'])
  })

  test('keeps an exact non-component match ahead of a related component', () => {
    const results = getMatchedSearchItems([
      item('ThemeBuilder', 'Component', 'theme playground builder'),
      item('Theme playground', 'Recipe')
    ], normalizeSearchText('Theme playground'))

    expect(results.map(result => result.title)).toEqual(['Theme playground', 'ThemeBuilder'])
  })

  test('allows a specific prop query to win when the component does not match every token', () => {
    const results = getMatchedSearchItems([
      item('Button', 'Component', 'button action control'),
      item('Button: size', 'Prop', 'button size sm md lg')
    ], 'button size')

    expect(results.map(result => result.title)).toEqual(['Button: size'])
  })
})
