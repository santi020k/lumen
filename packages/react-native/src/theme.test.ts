import { describe, expect, test } from 'vitest'

import { resolveLumenTextStyle } from './recipes.js'
import { createLumenTheme } from './theme.js'
import { lumenColorTokens, lumenRadii, lumenSpacing } from './tokens.generated.js'

describe('native appearance presets', () => {
  test.each(['light', 'dark'] as const)('retains default foundations in %s', scheme => {
    const theme = createLumenTheme(scheme)

    expect(theme.colors).toEqual(lumenColorTokens[scheme])
    expect(theme.radii).toEqual(lumenRadii)
    expect(theme.spacing).toEqual(lumenSpacing)
  })

  test.each(['light', 'dark'] as const)('uses studio foundations without changing status colors in %s', scheme => {
    const theme = createLumenTheme(scheme, { preset: 'studio' })

    expect(theme.colors.danger).toBe(lumenColorTokens[scheme].danger)
    expect(theme.colors.brandSolid).toBe(theme.colors.ink)
    expect(theme.radii.md).toBe(6)
    expect(theme.elevation.raised).toBe(0)
  })

  test('customizes precise numeric scales and typography after selecting a preset', () => {
    const theme = createLumenTheme('light', {
      preset: 'studio',
      colors: { brand: '#663399' },
      radii: { md: 14 },
      spacing: { lg: 20 },
      fontSizes: { md: 18 },
      appearance: { borderWidth: 2 }
    })

    expect(theme.colors.brand).toBe('#663399')
    expect(theme.radii.md).toBe(14)
    expect(theme.spacing.lg).toBe(20)
    expect(resolveLumenTextStyle(theme, 'body').fontSize).toBe(18)
    expect(resolveLumenTextStyle(theme, 'body').lineHeight).toBe(27)
    expect(theme.appearance?.borderWidth).toBe(2)
    expect(createLumenTheme('light', { preset: 'studio' }).radii.md).toBe(6)
  })
})
