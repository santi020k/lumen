import { describe, expect, test } from 'vitest'

import {
  resolveLumenBannerColors,
  resolveLumenMetricColor
} from './structured-recipes.js'
import { lumenDarkTheme, lumenLightTheme } from './theme.js'

describe('Lumen React Native structured component recipes', () => {
  test('maps metric tones to semantic colors', () => {
    expect(resolveLumenMetricColor(lumenLightTheme.colors, 'accent')).toBe(
      lumenLightTheme.colors.accent
    )
    expect(resolveLumenMetricColor(lumenDarkTheme.colors, 'neutral')).toBe(
      lumenDarkTheme.colors.inkMuted
    )
  })

  test('uses restrained semantic banner surfaces', () => {
    expect(resolveLumenBannerColors(lumenLightTheme.colors, 'default')).toEqual({
      accentColor: lumenLightTheme.colors.brand,
      backgroundColor: lumenLightTheme.colors.surface,
      borderColor: lumenLightTheme.colors.line
    })
    expect(resolveLumenBannerColors(lumenDarkTheme.colors, 'success')).toEqual({
      accentColor: lumenDarkTheme.colors.success,
      backgroundColor: `${lumenDarkTheme.colors.success}14`,
      borderColor: `${lumenDarkTheme.colors.success}52`
    })
    expect(resolveLumenBannerColors(lumenLightTheme.colors, 'destructive')).toEqual({
      accentColor: lumenLightTheme.colors.danger,
      backgroundColor: `${lumenLightTheme.colors.danger}14`,
      borderColor: `${lumenLightTheme.colors.danger}52`
    })
  })
})
