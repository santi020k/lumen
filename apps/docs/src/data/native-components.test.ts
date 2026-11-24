import { describe, expect, test } from 'vitest'

import registry from '../../../../registry/native-components.json'

import { getNativeComponentsForPlatform } from './native-components'

const documentedAdapters = [
  ['react-native', 'reactNative'],
  ['apple', 'swiftUI'],
  ['android', 'compose']
] as const

// HarmonyOS (ArkUI) is a pilot that covers part of the catalog and has no documentation routes.
const adapters = [...documentedAdapters, ['harmonyos', 'arkUI']] as const

const arkUIPilotSlugs = ['button', 'card', 'surface', 'text', 'text-field', 'theme']

const advancedSlugs = ['time-field', 'autocomplete', 'number-field', 'password-field', 'input-otp', 'image-comparison']

describe('native component documentation coverage', () => {
  test('documents every shared and platform-specific registry contract on its actual adapter', () => {
    for (const [platform, adapter] of adapters) {
      const docs = getNativeComponentsForPlatform(platform)
      const expected = [
        ...registry.components.filter(component => adapter in component.symbols).map(component => component.id),
        ...registry.platformComponents.filter(component => component.adapter === adapter).map(component => component.id)
      ]

      expect(new Set(docs.map(component => component.slug)).size).toBe(docs.length)
      expect(docs.map(component => component.slug).sort()).toEqual(expected.sort())

      for (const component of docs) {
        const implementation = component.implementations[platform]
        expect(implementation?.example.trim().length).toBeGreaterThan(0)
        expect(implementation?.api.length).toBeGreaterThan(0)
        expect(component.guidance.trim().length).toBeGreaterThan(0)
        expect(component.accessibility.trim().length).toBeGreaterThan(0)
      }
    }
  })

  test('limits the ArkUI pilot to its six components with ArkTS usage', () => {
    const docs = getNativeComponentsForPlatform('harmonyos')

    expect(docs.map(component => component.slug).sort()).toEqual(arkUIPilotSlugs)

    for (const component of docs) {
      const implementation = component.implementations.harmonyos

      if (!implementation) throw new Error(`Missing harmonyos implementation for ${component.slug}`)

      const api = implementation.api.map(row => `${row.name} ${row.values} ${row.defaultValue}`).join('\n')

      expect(implementation).toMatchObject({ language: 'arkts', maturity: 'Pilot', platform: 'harmonyos' })
      expect(implementation.example).toContain('LumenTheme(')
      expect(implementation.example).toContain(`${implementation.exportName}(`)
      expect(implementation.example).not.toMatch(/<Lumen|\bpadding\b|\bsize\b|\bonClick\b/)
      expect(api).not.toMatch(/Modifier|@Composable|ReactNode|-> Unit|—/)
    }
  })

  test('keeps the documented platforms on supported or experimental maturity', () => {
    for (const [platform] of documentedAdapters) {
      for (const component of getNativeComponentsForPlatform(platform)) {
        expect(component.implementations[platform]?.maturity, `${platform}/${component.slug}`).not.toBe('Pilot')
      }
    }
  })

  test('gives advanced controls platform-specific usage and API types', () => {
    for (const [platform] of documentedAdapters) {
      const docs = getNativeComponentsForPlatform(platform)
      for (const slug of advancedSlugs) {
        const component = docs.find(candidate => candidate.slug === slug)
        const implementation = component?.implementations[platform]
        expect(implementation, `${platform}/${slug}`).toBeDefined()
        expect(implementation?.example).toContain(implementation?.exportName)
      }
    }
  })

  test('uses native types and the optional datetime import', () => {
    for (const platform of ['react-native', 'apple'] as const) {
      const controls = getNativeComponentsForPlatform(platform)
        .filter(candidate => advancedSlugs.includes(candidate.slug))
      for (const component of controls) {
        const api = component.implementations[platform]?.api.map(row => `${row.name} ${row.values}`).join('\n')
        expect(api).not.toMatch(/BigDecimal|Modifier|Painter|-> Unit/)
      }
    }
    const time = getNativeComponentsForPlatform('react-native').find(component => component.slug === 'time-field')
    expect(time?.implementations['react-native']?.example).toContain('@santi020k/lumen-react-native/datetime')
  })

  test('restricts advanced SwiftUI controls to supported Apple targets', () => {
    for (const slug of advancedSlugs) {
      const component = getNativeComponentsForPlatform('apple').find(candidate => candidate.slug === slug)
      const targets = component?.implementations.apple?.appleAvailability?.map(target => target.id)
      expect(targets).toEqual(['ios', 'ipad', 'macos', 'visionos'])
    }
  })
})
