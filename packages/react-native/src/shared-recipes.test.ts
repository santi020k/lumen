import { describe, expect, test } from 'vitest'

import {
  resolveLumenAlertColors,
  resolveLumenAvatarSize,
  resolveLumenCardColor,
  resolveLumenProgressValue
} from './shared-recipes.js'
import { lumenDarkTheme, lumenLightTheme } from './theme.js'

describe('Lumen React Native shared component recipes', () => {
  test('maps alert and card variants to semantic colors', () => {
    expect(resolveLumenAlertColors(lumenLightTheme.colors, 'destructive').color).toBe(
      lumenLightTheme.colors.danger
    )
    expect(resolveLumenAlertColors(lumenDarkTheme.colors, 'success').color).toBe(
      lumenDarkTheme.colors.success
    )
    expect(resolveLumenCardColor(lumenDarkTheme.colors, 'muted')).toBe(
      lumenDarkTheme.colors.surfaceMuted
    )
  })

  test('normalizes invalid and out-of-range progress values', () => {
    expect(resolveLumenProgressValue(120, 100)).toEqual({
      max: 100,
      percentage: 100,
      value: 100
    })
    expect(resolveLumenProgressValue(-10, 0)).toEqual({
      max: 100,
      percentage: 0,
      value: 0
    })
    expect(resolveLumenProgressValue(Number.NaN, Number.NaN)).toEqual({
      max: 100,
      percentage: 0,
      value: 0
    })
  })

  test('keeps avatar dimensions consistent', () => {
    expect(resolveLumenAvatarSize('sm')).toBe(32)
    expect(resolveLumenAvatarSize('md')).toBe(40)
    expect(resolveLumenAvatarSize('lg')).toBe(56)
  })
})
