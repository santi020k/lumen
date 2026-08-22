import { describe, expect, test } from 'vitest'

import { getDocsContextLinks, isDocsContextLinkCurrent } from './docs-context-navigation'

describe('documentation context navigation', () => {
  test('gives every platform a focused overview and deeper navigation', () => {
    for (const platform of ['web', 'react-native', 'apple', 'android', 'foundations'] as const) {
      const links = getDocsContextLinks(platform)

      expect(links[0]?.label).toBe('Overview')
      expect(links.length).toBeGreaterThan(3)
    }
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
})
