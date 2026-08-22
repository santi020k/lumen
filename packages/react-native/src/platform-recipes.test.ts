import { describe, expect, test } from 'vitest'

import {
  resolveLumenNavigationItemState,
  resolveLumenRefreshColors
} from './platform-recipes.js'
import { lumenDarkTheme, lumenLightTheme } from './theme.js'

describe('React Native platform recipes', () => {
  test('maps refresh indicators to semantic theme colors', () => {
    expect(resolveLumenRefreshColors(lumenLightTheme.colors, 'brand')).toEqual({
      indicator: lumenLightTheme.colors.brand,
      surface: lumenLightTheme.colors.surface,
      title: lumenLightTheme.colors.inkMuted
    })
    expect(resolveLumenRefreshColors(lumenDarkTheme.colors, 'accent').indicator).toBe(
      lumenDarkTheme.colors.accent
    )
    expect(resolveLumenRefreshColors(lumenDarkTheme.colors, 'neutral').indicator).toBe(
      lumenDarkTheme.colors.inkSoft
    )
  })

  test('resolves selected and disabled destination states', () => {
    expect(resolveLumenNavigationItemState(
      lumenLightTheme.colors,
      'home',
      'home',
      false,
      false
    )).toEqual({
      color: lumenLightTheme.colors.brand,
      opacity: 1,
      selected: true
    })
    expect(resolveLumenNavigationItemState(
      lumenDarkTheme.colors,
      'search',
      'home',
      true,
      true
    )).toEqual({
      color: lumenDarkTheme.colors.inkMuted,
      opacity: 0.52,
      selected: false
    })
  })
})
