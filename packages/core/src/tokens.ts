import {
  lumenChartCssColorTokens,
  lumenCssColorTokens,
  lumenDurations,
  lumenEasings,
  lumenFontFamilies,
  lumenRadii
} from './foundations.generated.js'

export {
  type LumenChartColor,
  lumenChartColorTokens,
  lumenChartCssColorTokens,
  lumenChartOpacities,
  lumenChartStrokeWidths,
  type LumenColorScheme,
  lumenColorTokens,
  lumenCssColorTokens,
  lumenDurations,
  lumenEasings,
  lumenElevation,
  lumenFontFamilies,
  lumenFontSizes,
  lumenFontWeights,
  lumenGraphicFrameSizes,
  lumenGraphicOpacities,
  lumenGraphicStrokeWidths,
  lumenIllustrationSizes,
  lumenRadii,
  type LumenSemanticColor,
  lumenSpacing } from './foundations.generated.js'

export const lumenThemeAttribute = 'data-theme'
export const lumenDarkTheme = 'dark'
export const lumenLightTheme = 'light'

export const lumenColors = lumenCssColorTokens.light
export const lumenDarkColors = lumenCssColorTokens.dark

export const lumenChart = lumenChartCssColorTokens.light
export const lumenDarkChart = lumenChartCssColorTokens.dark

export const lumenGlass = {
  bg: '0 0% 100% / 0.55',
  bgStrong: '0 0% 100% / 0.72',
  bgSubtle: '0 0% 100% / 0.38',
  blur: '22px',
  border: '220 30% 100% / 0.55',
  brightness: '1.05',
  edge: '0 0% 100% / 0.9',
  edgeSoft: '0 0% 100% / 0.34',
  highlight: '0 0% 100% / 0.85',
  refraction: '201 96% 32% / 0.08',
  saturate: '1.7',
  shade: '222 47% 11% / 0.07',
  shadow: '0 1px 2px hsl(222 47% 11% / 0.08), 0 12px 32px hsl(222 47% 11% / 0.12), 0 32px 80px hsl(222 47% 11% / 0.14)'
} as const

export const lumenRadius = {
  base: `${lumenRadii.md / 16}rem`,
  lg: `${lumenRadii.lg / 16}rem`,
  sm: `${lumenRadii.sm / 16}rem`
} as const

export const lumenShadow = {
  lg: '0 24px 64px hsl(222 47% 11% / 0.14)',
  md: '0 8px 24px hsl(222 47% 11% / 0.08)',
  sm: '0 1px 2px hsl(222 47% 11% / 0.06)'
} as const

export const lumenFont = lumenFontFamilies.sans
  .map(family => family === 'sans-serif' ? family : `"${family}"`)
  .join(', ')

export const lumenMotion = {
  duration: `${lumenDurations.standard}ms`,
  durationFast: `${lumenDurations.fast}ms`,
  durationSlow: `${lumenDurations.slow}ms`,
  ease: `cubic-bezier(${lumenEasings.standard.join(', ')})`,
  easeEmphasized: `cubic-bezier(${lumenEasings.emphasized.join(', ')})`
} as const

export const composeClassName = (...classes: (boolean | null | string | undefined)[]) => classes.filter(Boolean).join(' ')
