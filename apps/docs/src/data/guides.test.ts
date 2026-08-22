import { describe, expect, test } from 'vitest'

import { getGuide, guideDestinations, publishedGuides } from './guides'

describe('Guides publishing metadata', () => {
  test('keeps published guide routes unique and fully described', () => {
    expect(new Set(publishedGuides.map(guide => guide.href)).size).toBe(publishedGuides.length)

    for (const guide of publishedGuides) {
      expect(guide.href.startsWith('/guides/')).toBe(true)
      expect(guide.author.length).toBeGreaterThan(0)
      expect(guide.description.length).toBeGreaterThan(40)
      expect(Number.isNaN(Date.parse(guide.publishedAt))).toBe(false)
    }
  })

  test('resolves every published guide for page and feed metadata', () => {
    for (const guide of publishedGuides) expect(getGuide(guide.href)).toBe(guide)
  })

  test('keeps every destination in the Guides landing page unique', () => {
    expect(new Set(guideDestinations.map(guide => guide.href)).size).toBe(guideDestinations.length)
  })
})
