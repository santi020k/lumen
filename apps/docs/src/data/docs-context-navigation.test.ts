import { describe, expect, test } from 'vitest'

import {
  getCurrentDocsContextLink,
  getDocsContextLinks,
  isDocsContextLinkCurrent,
  sharedDocumentationLinks
} from './docs-context-navigation'

describe('documentation context navigation', () => {
  test('marks the migration collection current on every version guide', () => {
    const links = getDocsContextLinks(undefined)

    const routes = [
      '/docs/migrations', '/docs/migrations/v1-to-v2', '/docs/migrations/v2-to-v3', '/docs/migrations/v3-to-v4'
    ]

    for (const route of routes) {
      expect(getCurrentDocsContextLink(links, route)?.label).toBe('Migration guides')
    }
  })

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

describe('current documentation destination', () => {
  test.each([
    ['', 'Overview'],
    ['#tokens-in-use', 'Color roles'],
    ['#composition-in-use', 'Composition'],
    ['#installation', 'Use the tokens'],
    ['#components', 'Coverage'],
    ['#component%73', 'Coverage'],
    ['#principles', 'Principles'],
    ['#unknown', 'Overview'],
    ['#%', 'Overview']
  ])('selects exactly one foundations destination for %s', (hash, label) => {
    expect(getCurrentDocsContextLink(getDocsContextLinks('foundations'), '/docs/foundations/', hash)?.label).toBe(label)
  })

  test('selects dedicated native guides without leaking their state into component pages', () => {
    const links = getDocsContextLinks('apple')

    expect(getCurrentDocsContextLink(links, '/docs/apple/installation')?.label).toBe('Install')
    expect(getCurrentDocsContextLink(links, '/docs/apple/theming')?.label).toBe('Theme')
    expect(getCurrentDocsContextLink(links, '/docs/apple/components/button', '#theme')?.label).toBe('Components')
  })

  test('preserves prefix sections for child routes and rejects partial path matches', () => {
    const links = getDocsContextLinks('web')

    expect(getCurrentDocsContextLink(links, '/docs/components/button', '#api')?.label).toBe('Components')
    expect(getCurrentDocsContextLink(links, '/docs/components-extra', '#api')).toBeUndefined()
  })
})
