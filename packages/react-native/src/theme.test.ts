import { describe, expect, test } from 'vitest'

import { fieldTheme } from './themes/field.js'
import { paperTheme } from './themes/paper.js'
import { santi020kTheme } from './themes/santi020k.js'
import { resolveLumenButtonColors, resolveLumenTextStyle } from './recipes.js'
import { createLumenTheme } from './theme.js'
import { lumenChartColorTokens, lumenColorTokens, lumenRadii, lumenSpacing } from './tokens.generated.js'

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

describe('optional theme definitions', () => {
  test.each(['light', 'dark'] as const)('applies named colors and component treatments in %s', scheme => {
    const theme = createLumenTheme(scheme, { definition: santi020kTheme })
    const primary = resolveLumenButtonColors(theme.colors, 'primary', theme.appearance)
    const danger = resolveLumenButtonColors(theme.colors, 'danger', theme.appearance)

    expect(theme.colors).toEqual(santi020kTheme[scheme])
    expect(primary).toEqual({
      backgroundColor: theme.colors.ink, borderColor: theme.colors.ink, color: theme.colors.surface
    })
    expect(resolveLumenButtonColors(theme.colors, 'success', theme.appearance)).toEqual({
      backgroundColor: theme.colors.success, borderColor: theme.colors.success, color: santi020kTheme.onSuccess[scheme]
    })
    expect(danger.color).toBe(theme.colors.onDanger)
    expect(danger.backgroundColor).toBe(theme.colors.danger)
    expect(theme.chartColors.series1).toBe(santi020kTheme.chartBrand[scheme])
    expect(theme.chartColors.series2).toBe(theme.colors.accent)
    expect(theme.chartColors.series3).toBe(lumenChartColorTokens[scheme].series3)
    expect(createLumenTheme(scheme, { definition: paperTheme }).radii.md).toBe(paperTheme.radii.md)
    expect(createLumenTheme(scheme, { definition: fieldTheme }).radii.sm).toBe(fieldTheme.radii.sm)
  })

  test('merges an application definition before explicit color, appearance and dimension overrides', () => {
    const theme = createLumenTheme('dark', {
      definition: { light: {}, dark: { accent: '#9966FF' }, radii: { md: 12 }, inkActions: true },
      colors: { accent: '#CCAAFF' },
      appearance: { inkActions: false },
      radii: { md: 18 }
    })

    expect(theme.colors.accent).toBe('#CCAAFF')
    expect(theme.colors.surface).toBe(lumenColorTokens.dark.surface)
    expect(theme.radii.md).toBe(18)
    expect(theme.appearance?.inkActions).toBe(false)
    expect(theme.chartColors).toEqual(lumenChartColorTokens.dark)
  })
})
