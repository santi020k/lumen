import { describe, expect, test } from 'vitest'

import {
  resolveLumenAlertColors,
  resolveLumenAvatarSize,
  resolveLumenCardColor,
  resolveLumenCardColors,
  resolveLumenProgressValue,
  resolveLumenSurfacePadding,
  resolveLumenSurfaceRadius
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
    expect(resolveLumenCardColors(lumenLightTheme.colors, 'warning')).toEqual({
      backgroundColor: `${lumenLightTheme.colors.warning}0F`,
      borderColor: `${lumenLightTheme.colors.warning}3D`
    })
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

  test('maps card padding and radius options to canonical theme tokens', () => {
    expect(resolveLumenSurfacePadding(lumenLightTheme, 'none')).toBe(0)
    expect(resolveLumenSurfacePadding(lumenLightTheme, 'sm')).toBe(lumenLightTheme.spacing.sm)
    expect(resolveLumenSurfacePadding(lumenLightTheme, 'md')).toBe(lumenLightTheme.spacing.md)
    expect(resolveLumenSurfacePadding(lumenLightTheme, 'lg')).toBe(lumenLightTheme.spacing.lg)
    expect(resolveLumenSurfacePadding(lumenLightTheme, 'xl')).toBe(lumenLightTheme.spacing.xl)

    expect(resolveLumenSurfaceRadius(lumenLightTheme, 'none')).toBe(0)
    expect(resolveLumenSurfaceRadius(lumenLightTheme, 'sm')).toBe(lumenLightTheme.radii.sm)
    expect(resolveLumenSurfaceRadius(lumenLightTheme, 'md')).toBe(lumenLightTheme.radii.md)
    expect(resolveLumenSurfaceRadius(lumenLightTheme, 'lg')).toBe(lumenLightTheme.radii.lg)
    expect(resolveLumenSurfaceRadius(lumenLightTheme, 'xl')).toBe(lumenLightTheme.radii.xl)
    expect(resolveLumenSurfaceRadius(lumenLightTheme, '2xl')).toBe(lumenLightTheme.radii['2xl'])
    expect(resolveLumenSurfaceRadius(lumenLightTheme, '3xl')).toBe(lumenLightTheme.radii['3xl'])
  })
})
