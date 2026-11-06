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
  onSuccess?: string
  statusText?: string
  inkActions?: boolean
  serifHeadings?: boolean
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

export const resolveStatusText = (theme: LumenTheme, tone: 'danger' | 'success' | 'warning'): string => theme.appearance?.statusText ?? theme.colors[tone]

/** A portable appearance, resolved against Lumen foundations in each scheme. */
export interface LumenThemeDefinition {
  light: Partial<LumenColorPalette>
  dark: Partial<LumenColorPalette>
  radii?: Partial<LumenTheme['radii']> | null
  inkActions?: boolean
  serifHeadings?: boolean
  chartBrand?: Record<LumenColorScheme, string> | null
  onSuccess?: Record<LumenColorScheme, string> | null
  statusText?: Partial<Record<LumenColorScheme, string>> | null
}

export interface LumenThemeOptions {
  definition?: LumenThemeDefinition
  chartColors?: Partial<LumenChartColorPalette>
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

const definitionAppearance = (
  definition: LumenThemeDefinition | undefined, scheme: LumenColorScheme
): Partial<LumenAppearance> => {
  if (!definition) return {}

  const onSuccess = definition.onSuccess?.[scheme]
  const statusText = definition.statusText?.[scheme]

  return {
    inkActions: definition.inkActions ?? false,
    serifHeadings: definition.serifHeadings ?? false,
    ...onSuccess && { onSuccess },
    ...statusText && { statusText }
  }
}

export const createLumenTheme = (scheme: LumenColorScheme, options: LumenThemeOptions = {}): LumenTheme => {
  const preset = lumenThemePresetDefinitions[options.preset ?? 'default']
  const radius = preset.radiusScale
  const spacing = preset.spacingScale
  const elevation = preset.elevationScale
  const definition = options.definition
  const colors = { ...lumenColorTokens[scheme], ...preset.colors[scheme], ...definition?.[scheme], ...options.colors }
  const chartBrand = definition?.chartBrand?.[scheme]

  const chartColors = chartBrand ?
    {
      series1: chartBrand,
      series2: colors.accent,
      divergingPositive: chartBrand,
      divergingMid: colors.surfaceStrong,
      sequentialHigh: colors.brandSolid,
      sequentialMid: chartBrand,
      sequentialLow: colors.brandSoft
    } :
    undefined

  return {
    appearance: {
      borderWidth: preset.borderWidth,
      material: preset.material,
      ...definitionAppearance(definition, scheme),
      ...options.appearance
    },
    chartColors: { ...lumenChartColorTokens[scheme], ...chartColors, ...options.chartColors },
    colors,
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
    radii: { ...lumenRadii, sm: lumenRadii.sm * radius, md: lumenRadii.md * radius, lg: lumenRadii.lg * radius, xl: lumenRadii.xl * radius, '2xl': lumenRadii['2xl'] * radius, '3xl': lumenRadii['3xl'] * radius, ...definition?.radii, ...options.radii },
    scheme,
    spacing: { ...lumenSpacing, xs: lumenSpacing.xs * spacing, sm: lumenSpacing.sm * spacing, md: lumenSpacing.md * spacing, lg: lumenSpacing.lg * spacing, xl: lumenSpacing.xl * spacing, '2xl': lumenSpacing['2xl'] * spacing, '3xl': lumenSpacing['3xl'] * spacing, ...options.spacing }
  }
}

export const lumenLightTheme = createLumenTheme('light')
export const lumenDarkTheme = createLumenTheme('dark')
