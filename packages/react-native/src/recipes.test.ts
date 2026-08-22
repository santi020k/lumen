import { describe, expect, test } from 'vitest'

import {
  resolveLumenButtonColors,
  resolveLumenButtonOpacity,
  resolveLumenButtonSize,
  resolveLumenControlMinHeight,
  resolveLumenIconButtonSize,
  resolveLumenIconSize,
  resolveLumenSurfaceColor,
  resolveLumenTextColor
} from './recipes.js'
import {
  lumenDarkTheme,
  lumenLightTheme
} from './theme.js'

describe('Lumen React Native primitive recipes', () => {
  test('maps shared button intents to semantic theme roles', () => {
    expect(resolveLumenButtonColors(lumenLightTheme.colors, 'primary')).toEqual({
      backgroundColor: lumenLightTheme.colors.brandSolid,
      borderColor: lumenLightTheme.colors.brandSolid,
      color: lumenLightTheme.colors.onBrand
    })
    expect(resolveLumenButtonColors(lumenDarkTheme.colors, 'danger').color).toBe(
      lumenDarkTheme.colors.onDanger
    )
  })

  test('keeps touch targets and disabled feedback predictable', () => {
    expect(resolveLumenButtonSize(lumenLightTheme, 'md').container.minHeight).toBe(44)
    expect(resolveLumenControlMinHeight('lg')).toBe(52)
    expect(resolveLumenButtonOpacity(true, false)).toBe(0.52)
    expect(resolveLumenButtonOpacity(false, true)).toBe(0.84)
    expect(resolveLumenIconSize('sm')).toBe(16)
    expect(resolveLumenIconSize('md')).toBe(20)
    expect(resolveLumenIconSize('lg')).toBe(24)
    expect(resolveLumenIconButtonSize('sm')).toEqual({ iconSize: 'sm', touchTarget: 44 })
    expect(resolveLumenIconButtonSize('lg')).toEqual({ iconSize: 'lg', touchTarget: 52 })
  })

  test('maps content and surfaces without platform-specific color literals', () => {
    expect(resolveLumenTextColor(lumenDarkTheme.colors, 'muted')).toBe(
      lumenDarkTheme.colors.inkMuted
    )
    expect(resolveLumenSurfaceColor(lumenDarkTheme, 'strong')).toBe(
      lumenDarkTheme.colors.surfaceStrong
    )
  })
})
