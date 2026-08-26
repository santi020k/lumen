import { describe, expect, test } from 'vitest'

import {
  getNativeComponentsForPlatform,
  type NativePlatformId
} from './native-components'
import {
  getDocsPlatform,
  getPlatformGuide,
  platformGuides,
  productPlatformGuides
} from './platforms'

describe('platform documentation', () => {
  test('publishes one unique guide for every supported surface and shared foundations', () => {
    expect(platformGuides.map(guide => guide.id)).toEqual([
      'web',
      'react-native',
      'apple',
      'android',
      'foundations'
    ])
    expect(new Set(platformGuides.map(guide => guide.href)).size).toBe(
      platformGuides.length
    )
    expect(productPlatformGuides).toHaveLength(4)
  })

  test('keeps each guide useful as a standalone documentation entry point', () => {
    for (const guide of platformGuides) {
      expect(guide.codeExamples.length).toBeGreaterThan(0)
      expect(guide.components.length).toBeGreaterThan(0)
      expect(guide.principles).toHaveLength(3)
      expect(guide.relatedLinks.length).toBeGreaterThan(0)
    }
  })

  test('documents theme selection for every native platform guide', () => {
    for (const guide of productPlatformGuides.filter(
      candidate => candidate.id !== 'web'
    )) {
      expect(guide.theme?.examples.length).toBeGreaterThan(0)
      expect(guide.theme?.verification).toHaveLength(3)
    }
  })

  test('links every native guide to both searchable icon-name catalogs', () => {
    for (const guide of productPlatformGuides.filter(
      candidate => candidate.id !== 'web'
    )) {
      expect(guide.relatedLinks).toEqual(expect.arrayContaining([
        { href: '/docs/icons#icon-catalog', label: 'Interface icon names' },
        { href: '/docs/brand-icons#brand-icon-catalog', label: 'Brand icon names' }
      ]))
    }
  })

  test('documents shared icon names and native escape hatches per platform', () => {
    const expectedExamples: Record<NativePlatformId, string[]> = {
      android: ['LumenIconName.Search', 'LumenIconName.BrandGithub'],
      apple: ['name: .search', 'name: .brandGithub'],
      'react-native': ['name="search"', 'name="brand:github"']
    }

    for (const platform of Object.keys(expectedExamples) as NativePlatformId[]) {
      const icon = getNativeComponentsForPlatform(platform).find(
        component => component.slug === 'icon'
      )

      expect(icon).toBeDefined()
      expect(icon?.guidance).toContain('platform')
      expect(icon?.implementations[platform]?.api[0]?.name).toMatch(
        /name or (icon|imageVector|systemName)/
      )

      for (const example of expectedExamples[platform]) {
        expect(icon?.implementations[platform]?.example).toContain(example)
      }
    }
  })

  test('lists every documented component available to each native platform', () => {
    for (const platform of [
      'react-native',
      'apple',
      'android'
    ] satisfies NativePlatformId[]) {
      expect(getPlatformGuide(platform).components).toEqual(
        getNativeComponentsForPlatform(platform).map(
          component => component.name
        )
      )
    }

    expect(getPlatformGuide('react-native').components).toHaveLength(45)
    expect(getPlatformGuide('android').components).toHaveLength(54)
    expect(getPlatformGuide('apple').components).toHaveLength(56)
  })

  test('maps new and legacy web routes to the correct contextual navigation', () => {
    expect(getDocsPlatform('/docs/web')).toBe('web')
    expect(getDocsPlatform('/docs/components/button')).toBe('web')
    expect(getDocsPlatform('/docs/frameworks/react')).toBe('web')
    expect(getDocsPlatform('/docs/react-native')).toBe('react-native')
    expect(getDocsPlatform('/docs/apple')).toBe('apple')
    expect(getDocsPlatform('/docs/android')).toBe('android')
    expect(getDocsPlatform('/docs/foundations')).toBe('foundations')
    expect(getDocsPlatform('/docs')).toBeUndefined()
    expect(getDocsPlatform('/docs/appleton')).toBeUndefined()
    expect(getDocsPlatform('/docs/components-library')).toBeUndefined()
  })

  test('resolves every published guide by id', () => {
    for (const guide of platformGuides) {
      expect(getPlatformGuide(guide.id)).toBe(guide)
    }
  })
})
