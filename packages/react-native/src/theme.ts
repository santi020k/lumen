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

export type LumenChartColorPalette = {
  [Name in keyof typeof lumenChartColorTokens.light]: string
}

export type LumenColorPalette = {
  [Name in keyof typeof lumenColorTokens.light]: string
}

export interface LumenTheme {
  chartColors: LumenChartColorPalette
  colors: LumenColorPalette
  durations: typeof lumenDurations
  elevation: typeof lumenElevation
  fontFamilies: typeof lumenFontFamilies
  fontSizes: typeof lumenFontSizes
  fontWeights: typeof lumenFontWeights
  radii: typeof lumenRadii
  scheme: LumenColorScheme
  spacing: typeof lumenSpacing
}

export const createLumenTheme = (scheme: LumenColorScheme): LumenTheme => ({
  chartColors: lumenChartColorTokens[scheme],
  colors: lumenColorTokens[scheme],
  durations: lumenDurations,
  elevation: lumenElevation,
  fontFamilies: lumenFontFamilies,
  fontSizes: lumenFontSizes,
  fontWeights: lumenFontWeights,
  radii: lumenRadii,
  scheme,
  spacing: lumenSpacing
})

export const lumenLightTheme = createLumenTheme('light')
export const lumenDarkTheme = createLumenTheme('dark')
