import { readFile } from 'node:fs/promises'

import { describe, expect, test, vi } from 'vitest'

import { lumenIconNames } from './icons.generated.js'
import {
  createLumenTheme,
  lumenDarkTheme,
  lumenLightTheme,
  type LumenTheme
} from './theme.js'
import { lumenChartColorTokens, lumenColorTokens } from './tokens.generated.js'

vi.mock('react-native-svg', () => ({
  Circle: () => null,
  Ellipse: () => null,
  Line: () => null,
  Path: () => null,
  Polygon: () => null,
  Polyline: () => null,
  Rect: () => null,
  Svg: () => null
}))

describe('Lumen React Native foundations', () => {
  test('keeps the optional datetime integration outside the root entrypoint', async () => {
    const [rootSource, datetimeSource, packageManifest] = await Promise.all([
      readFile(new URL('./index.ts', import.meta.url), 'utf8'),
      readFile(new URL('./datetime.ts', import.meta.url), 'utf8'),
      readFile(new URL('../package.json', import.meta.url), 'utf8').then(source => JSON.parse(source) as {
        exports: Record<string, unknown>
        peerDependenciesMeta: Record<string, { optional?: boolean }>
      })
    ])

    expect(rootSource).not.toContain('LumenDateField')
    expect(rootSource).not.toContain('@react-native-community/datetimepicker')
    expect(datetimeSource).toContain('LumenDateField')
    expect(packageManifest.exports).toHaveProperty('./datetime')
    expect(packageManifest.peerDependenciesMeta['@react-native-community/datetimepicker']?.optional).toBe(true)
  })

  test('provides matching semantic roles for light and dark themes', () => {
    expect(Object.keys(lumenColorTokens.light)).toEqual(
      Object.keys(lumenColorTokens.dark)
    )
    expect(lumenLightTheme.colors.brand).toBe('#0369A0')
    expect(lumenDarkTheme.colors.brand).toBe('#29B4F5')
    expect(Object.keys(lumenChartColorTokens.light)).toEqual(
      Object.keys(lumenChartColorTokens.dark)
    )
    expect(lumenLightTheme.chartColors.series1).toBe('#0369A0')
    expect(lumenDarkTheme.chartColors.series1).toBe('#29B4F5')
  })

  test('creates a complete theme for the requested scheme', () => {
    const theme = createLumenTheme('dark')

    expect(theme.scheme).toBe('dark')
    expect(theme.spacing.lg).toBe(16)
    expect(theme.radii.md).toBe(10)
    expect(theme.durations.standard).toBe(160)
  })

  test('accepts application-defined semantic color palettes', () => {
    const baseTheme = createLumenTheme('light')
    const productTheme: LumenTheme = {
      ...baseTheme,
      chartColors: {
        ...baseTheme.chartColors,
        series1: '#5709CE'
      },
      colors: {
        ...baseTheme.colors,
        brand: '#0369A0',
        brandSolid: '#035C8C'
      }
    }

    expect(productTheme.chartColors.series1).toBe('#5709CE')
    expect(productTheme.colors.brand).toBe('#0369A0')
    expect(productTheme.colors.brandSolid).toBe('#035C8C')
    expect(baseTheme.chartColors.series1).toBe(lumenChartColorTokens.light.series1)
    expect(baseTheme.colors.brand).toBe(lumenColorTokens.light.brand)
  })

  test('exposes the complete unique interface and brand icon catalog', () => {
    expect(lumenIconNames).toHaveLength(2_363)
    expect(new Set(lumenIconNames).size).toBe(2_363)
    expect(lumenIconNames.filter(name => name.startsWith('brand:'))).toHaveLength(573)
    expect(lumenIconNames).toContain('search')
    expect(lumenIconNames).toContain('brand:github')
  })
})
