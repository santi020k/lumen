import {
  type LumenColorScheme,
  lumenColorTokens,
  lumenDurations,
  lumenElevation,
  lumenFontFamilies,
  lumenFontSizes,
  lumenFontWeights,
  lumenRadii,
  lumenSpacing } from './tokens.generated.js'

export interface LumenTheme {
  colors: typeof lumenColorTokens.light | typeof lumenColorTokens.dark
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
