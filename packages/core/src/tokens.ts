import {
  lumenCssColorTokens,
  lumenDurations,
  lumenEasings,
  lumenFontFamilies,
  lumenRadii
} from './foundations.generated.js'

export {
  type LumenColorScheme,
  lumenColorTokens,
  lumenCssColorTokens,
  lumenDurations,
  lumenEasings,
  lumenElevation,
  lumenFontFamilies,
  lumenFontSizes,
  lumenFontWeights,
  lumenRadii,
  type LumenSemanticColor,
  lumenSpacing } from './foundations.generated.js'

export const lumenThemeAttribute = 'data-theme'
export const lumenDarkTheme = 'dark'
export const lumenLightTheme = 'light'

export const lumenColors = lumenCssColorTokens.light
export const lumenDarkColors = lumenCssColorTokens.dark

export const lumenChart = {
  axis: 'var(--ink-muted)',
  divergingMid: '220 13% 91%',
  divergingNegative: '0 84% 60%',
  divergingPositive: '221 83% 53%',
  grid: 'var(--line)',
  sequentialHigh: '221 83% 40%',
  sequentialLow: '218 100% 97%',
  sequentialMid: '221 83% 67%',
  series1: '221 83% 53%',
  series2: '168 76% 36%',
  series3: '280 72% 56%',
  series4: '25 95% 53%',
  series5: '340 82% 55%',
  series6: '190 82% 42%',
  series7: '52 92% 45%',
  series8: '215 16% 47%'
} as const

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
  refraction: '221 83% 53% / 0.08',
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
