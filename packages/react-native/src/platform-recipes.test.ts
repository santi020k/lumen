import { describe, expect, test } from 'vitest'

import { resolveLumenRefreshColors } from './platform-recipes.js'
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
})
