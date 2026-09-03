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

  test('documents complete React Native peer installation and only working playground paths', () => {
    const guide = getPlatformGuide('react-native')
    const examples = guide.codeExamples.map(example => example.code).join('\n')
    const npmInstall = guide.codeExamples.find(example => example.value === 'npm')?.code
    const pnpmInstall = guide.codeExamples.find(example => example.value === 'pnpm')?.code

    expect(npmInstall).toContain('@santi020k/lumen-react-native react-native-svg @react-native-community/datetimepicker')
    expect(pnpmInstall).toContain('@santi020k/lumen-react-native react-native-svg @react-native-community/datetimepicker')
    expect(examples).toContain('@react-native-community/datetimepicker')
    expect(guide.playgroundLaunch).toBeUndefined()
    expect(guide.playgroundCommands?.[0]?.value).toBe('web')
    expect(guide.prerequisites).toEqual(expect.arrayContaining([
      expect.stringContaining('22.12'),
      expect.stringContaining('22.19')
    ]))
  })

  test('keeps the Wear OS artifact separate from phone and tablet Compose', () => {
    const guide = getPlatformGuide('android')
    const examples = guide.codeExamples.map(example => example.code).join('\n')

    expect(examples).toContain('com.santi020k:lumen-compose:2.1.0')
    expect(examples).toContain('com.santi020k:lumen-compose-wear:2.1.0')
    expect(guide.installNote).toContain('only to a Wear OS module')
    expect(guide.prerequisites).toContain('Android Studio with JDK 21 or newer')
  })

  test('publishes Apple store access without claiming Android approval', () => {
    expect(getPlatformGuide('apple').storeAvailability).toEqual(
      expect.objectContaining({
        href: 'https://apps.apple.com/app/id6805250815',
        status: 'available'
      })
    )
    expect(getPlatformGuide('android').storeAvailability).toEqual(
      expect.objectContaining({
        status: 'pending'
      })
    )
    expect(getPlatformGuide('android').storeAvailability?.href).toBeUndefined()
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

    expect(getPlatformGuide('react-native').components).toHaveLength(61)
    expect(getPlatformGuide('android').components).toHaveLength(67)
    expect(getPlatformGuide('apple').components).toHaveLength(72)
  })

  test('documents accurate Apple ecosystem availability and Swift products', () => {
    const appleComponents = getNativeComponentsForPlatform('apple')

    for (const component of appleComponents) {
      const implementation = component.implementations.apple
      const targetIds = implementation?.appleAvailability?.map(target => target.id) ?? []

      expect(implementation?.maturity).toBe('Supported')
      expect(implementation?.packageName).toMatch(/^Lumen(?:Widget)?UI$/)
      expect(targetIds.length).toBeGreaterThan(0)
      expect(new Set(targetIds).size).toBe(targetIds.length)
    }

    const availabilityFor = (slug: string) => (
      appleComponents
        .find(component => component.slug === slug)
        ?.implementations.apple
        ?.appleAvailability
        ?.map(target => `${target.label} · ${target.minimumVersion}`)
    )

    expect(availabilityFor('button')).toEqual([
      'iPhone · iOS 16+',
      'iPad · iPadOS 16+',
      'Mac · macOS 13+',
      'Apple TV · tvOS 16+',
      'Apple Vision · visionOS 1+',
      'Apple Watch · watchOS 9+'
    ])
    expect(availabilityFor('phone-input')).toEqual([
      'iPhone · iOS 16+',
      'iPad · iPadOS 16+',
      'Mac · macOS 13+',
      'Apple Vision · visionOS 1+'
    ])
    expect(availabilityFor('tab-accessory')).toEqual([
      'iPhone · iOS 16+',
      'iPad · iPadOS 16+'
    ])
    expect(availabilityFor('shortcut-recorder')).toEqual(['Mac · macOS 13+'])
    expect(availabilityFor('wearable-action')).toEqual(['Apple Watch · watchOS 9+'])
    expect(availabilityFor('menu')).toContain('Apple TV · tvOS 17+')

    const widgetText = appleComponents.find(component => component.slug === 'widget-text')
    expect(widgetText?.implementations.apple?.packageName).toBe('LumenWidgetUI')
    expect(availabilityFor('widget-text')).toEqual([
      'iPhone · iOS 16+',
      'iPad · iPadOS 16+',
      'Mac · macOS 13+',
      'Apple Watch · watchOS 9+'
    ])
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
