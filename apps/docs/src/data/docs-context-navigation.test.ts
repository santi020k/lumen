import { describe, expect, test } from 'vitest'

import {
  getDocsContextLinks,
  isDocsContextLinkCurrent,
  sharedDocumentationLinks
} from './docs-context-navigation'

describe('documentation context navigation', () => {
  test('gives every platform a focused overview and deeper navigation', () => {
    for (const platform of ['web', 'react-native', 'apple', 'android', 'foundations'] as const) {
      const links = getDocsContextLinks(platform)

      expect(links[0]?.label).toBe('Overview')
      expect(links.length).toBeGreaterThan(3)
    }
  })

  test('keeps the project overview and shared foundations visible as global documentation', () => {
    expect(sharedDocumentationLinks.slice(0, 2)).toEqual([
      { href: '/docs', label: 'Project overview' },
      { href: '/docs/foundations', label: 'Shared foundations' }
    ])

    expect(getDocsContextLinks(undefined).slice(0, 2)).toEqual([
      { href: '/docs', label: 'Project overview', match: 'exact' },
      { href: '/docs/foundations', label: 'Foundations', match: 'prefix' }
    ])
  })

  test('keeps component detail routes within their platform section', () => {
    const webComponents = getDocsContextLinks('web').find(link => link.label === 'Components')
    const appleComponents = getDocsContextLinks('apple').find(link => link.label === 'Components')

    expect(webComponents && isDocsContextLinkCurrent(webComponents, '/docs/components/button')).toBe(true)
    expect(appleComponents && isDocsContextLinkCurrent(appleComponents, '/docs/apple/components/button')).toBe(true)
  })

  test('links every platform to its dedicated playground route', () => {
    for (const platform of ['web', 'react-native', 'apple', 'android'] as const) {
      const playground = getDocsContextLinks(platform).find(link => link.label === 'Playground')

      expect(playground?.href).toBe(`/docs/${platform}/playground`)
    }
  })

  test('does not mark anchor destinations as the current page', () => {
    const install = getDocsContextLinks('react-native').find(link => link.label === 'Install')

    expect(install && isDocsContextLinkCurrent(install, '/docs/react-native')).toBe(false)
  })

  test('links React Native to its native hook reference', () => {
    const hooks = getDocsContextLinks('react-native').find(link => link.label === 'Hooks')

    expect(hooks?.href).toBe('/docs/react-native/hooks')
    expect(hooks && isDocsContextLinkCurrent(hooks, '/docs/react-native/hooks')).toBe(true)
    expect(getDocsContextLinks('apple').some(link => link.label === 'Hooks')).toBe(false)
  })
})
