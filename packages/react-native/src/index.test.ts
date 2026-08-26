import { describe, expect, test, vi } from 'vitest'

import { lumenIconNames } from './icons.generated.js'
import {
  createLumenTheme,
  lumenDarkTheme,
  lumenLightTheme
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
  test('provides matching semantic roles for light and dark themes', () => {
    expect(Object.keys(lumenColorTokens.light)).toEqual(
      Object.keys(lumenColorTokens.dark)
    )
    expect(lumenLightTheme.colors.brand).toBe('#2463EB')
    expect(lumenDarkTheme.colors.brand).toBe('#29B4F5')
    expect(Object.keys(lumenChartColorTokens.light)).toEqual(
      Object.keys(lumenChartColorTokens.dark)
    )
    expect(lumenLightTheme.chartColors.series1).toBe('#2463EB')
    expect(lumenDarkTheme.chartColors.series1).toBe('#29B4F5')
  })

  test('creates a complete theme for the requested scheme', () => {
    const theme = createLumenTheme('dark')

    expect(theme.scheme).toBe('dark')
    expect(theme.spacing.lg).toBe(16)
    expect(theme.radii.md).toBe(10)
    expect(theme.durations.standard).toBe(160)
  })

  test('exposes the complete unique interface and brand icon catalog', () => {
    expect(lumenIconNames).toHaveLength(2_350)
    expect(new Set(lumenIconNames).size).toBe(2_350)
    expect(lumenIconNames.filter(name => name.startsWith('brand:'))).toHaveLength(573)
    expect(lumenIconNames).toContain('search')
    expect(lumenIconNames).toContain('brand:github')
  })
})
