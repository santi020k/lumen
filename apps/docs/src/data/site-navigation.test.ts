import { describe, expect, test } from 'vitest'

import { getActiveSiteNavigationIndex, siteNavigationItems } from './site-navigation'

const getActiveLabel = (pathname: string): string | undefined => {
  const activeIndex = getActiveSiteNavigationIndex(pathname)

  return siteNavigationItems[activeIndex]?.label
}

describe('site navigation', () => {
  test.each([
    ['/docs', 'Docs'],
    ['/docs/components/button', 'Docs'],
    ['/changelog', 'Docs'],
    ['/guides', 'Guides'],
    ['/guides/ship-a-settings-screen', 'Guides'],
    ['/templates/analytics-dashboard', 'Templates'],
    ['/community', 'Community'],
    ['/teams', 'Community']
  ])('maps %s to %s', (pathname, label) => {
    expect(getActiveLabel(pathname)).toBe(label)
  })

  test('does not claim an unrelated route', () => {
    expect(getActiveSiteNavigationIndex('/')).toBe(-1)
    expect(getActiveSiteNavigationIndex('/documentation')).toBe(-1)
  })
})
