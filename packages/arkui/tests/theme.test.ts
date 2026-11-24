import { describe, expect, test } from 'vitest'

import {
  LumenColorSchemePreference,
  lumenThemeValues,
  resolveLumenIsDark
} from '../src/main/ets/theme/ThemeValues'
import { LumenColors } from '../src/main/ets/tokens/Tokens.generated'

describe('resolveLumenIsDark', () => {
  test('follows the system only for the system preference', () => {
    expect(resolveLumenIsDark(LumenColorSchemePreference.System, true)).toBe(true)
    expect(resolveLumenIsDark(LumenColorSchemePreference.System, false)).toBe(false)
    expect(resolveLumenIsDark(LumenColorSchemePreference.Light, true)).toBe(false)
    expect(resolveLumenIsDark(LumenColorSchemePreference.Dark, false)).toBe(true)
  })
})

describe('lumenThemeValues', () => {
  test('selects the canonical palette for each scheme', () => {
    expect(lumenThemeValues(false)).toMatchObject({ colors: LumenColors.light, isDark: false })
    expect(lumenThemeValues(true)).toMatchObject({ colors: LumenColors.dark, isDark: true })
  })

  test('accepts replacement palettes', () => {
    const light = { ...LumenColors.light, brand: '#123456' }
    const dark = { ...LumenColors.dark, brand: '#654321' }

    expect(lumenThemeValues(false, light, dark).colors.brand).toBe('#123456')
    expect(lumenThemeValues(true, light, dark).colors.brand).toBe('#654321')
  })
})

describe('generated tokens', () => {
  test('keeps light and dark palettes aligned and opaque', () => {
    expect(Object.keys(LumenColors.dark)).toEqual(Object.keys(LumenColors.light))

    const palettes: Record<string, string>[] = [{ ...LumenColors.light }, { ...LumenColors.dark }]

    for (const color of palettes.flatMap(palette => Object.values(palette))) {
      expect(color).toMatch(/^#[0-9A-F]{6}$/)
    }
  })
})
