import { type LumenSurfaceMaterial, type LumenThemePreset, lumenThemePresetDefinitions } from './theme-presets.generated.js'
import {
  lumenChartColorTokens,
  type LumenColorScheme,
  lumenColorTokens,
  lumenDurations,
  lumenElevation,
  lumenFontFamilies,
  lumenFontSizes,
  lumenFontWeights,
  lumenRadii,
  lumenSpacing } from './tokens.generated.js'

export { type LumenSurfaceMaterial, type LumenThemePreset } from './theme-presets.generated.js'

type NumberTokens<T> = { [Name in keyof T]: number }

export interface LumenAppearance {
  borderWidth: number
  material: LumenSurfaceMaterial
}

export type LumenChartColorPalette = {
  [Name in keyof typeof lumenChartColorTokens.light]: string
}

export type LumenColorPalette = {
  [Name in keyof typeof lumenColorTokens.light]: string
}

export interface LumenTheme {
  appearance?: LumenAppearance
  chartColors: LumenChartColorPalette
  colors: LumenColorPalette
  durations: typeof lumenDurations
  elevation: NumberTokens<typeof lumenElevation>
  fontFamilies: { [Name in keyof typeof lumenFontFamilies]: readonly string[] }
  fontSizes: NumberTokens<typeof lumenFontSizes>
  fontWeights: NumberTokens<typeof lumenFontWeights>
  radii: NumberTokens<typeof lumenRadii>
  scheme: LumenColorScheme
  spacing: NumberTokens<typeof lumenSpacing>
}

export interface LumenThemeOptions {
  preset?: LumenThemePreset
  colors?: Partial<LumenColorPalette>
  radii?: Partial<LumenTheme['radii']>
  spacing?: Partial<LumenTheme['spacing']>
  elevation?: Partial<LumenTheme['elevation']>
  fontFamilies?: Partial<LumenTheme['fontFamilies']>
  fontSizes?: Partial<LumenTheme['fontSizes']>
  fontWeights?: Partial<LumenTheme['fontWeights']>
  appearance?: Partial<LumenAppearance>
}

export const createLumenTheme = (scheme: LumenColorScheme, options: LumenThemeOptions = {}): LumenTheme => {
  const preset = lumenThemePresetDefinitions[options.preset ?? 'default']
  const radius = preset.radiusScale
  const spacing = preset.spacingScale
  const elevation = preset.elevationScale

  return {
    appearance: { borderWidth: preset.borderWidth, material: preset.material, ...options.appearance },
    chartColors: lumenChartColorTokens[scheme],
    colors: { ...lumenColorTokens[scheme], ...preset.colors[scheme], ...options.colors },
    durations: lumenDurations,
    elevation: {
      resting: lumenElevation.resting * elevation,
      raised: lumenElevation.raised * elevation,
      overlay: lumenElevation.overlay * elevation,
      ...options.elevation
    },
    fontFamilies: { ...lumenFontFamilies, ...options.fontFamilies },
    fontSizes: { ...lumenFontSizes, ...options.fontSizes },
    fontWeights: { ...lumenFontWeights, ...options.fontWeights },
    radii: { ...lumenRadii, sm: lumenRadii.sm * radius, md: lumenRadii.md * radius, lg: lumenRadii.lg * radius, xl: lumenRadii.xl * radius, '2xl': lumenRadii['2xl'] * radius, '3xl': lumenRadii['3xl'] * radius, ...options.radii },
    scheme,
    spacing: { ...lumenSpacing, xs: lumenSpacing.xs * spacing, sm: lumenSpacing.sm * spacing, md: lumenSpacing.md * spacing, lg: lumenSpacing.lg * spacing, xl: lumenSpacing.xl * spacing, '2xl': lumenSpacing['2xl'] * spacing, '3xl': lumenSpacing['3xl'] * spacing, ...options.spacing }
  }
}

export const lumenLightTheme = createLumenTheme('light')
export const lumenDarkTheme = createLumenTheme('dark')
