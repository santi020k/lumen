export const lumenThemeAttribute = 'data-theme'
export const lumenDarkTheme = 'dark'
export const lumenLightTheme = 'light'

export const lumenColors = {
  accent: '264 95% 57%',
  brand: '264 92% 47%',
  brandSoft: '264 60% 94%',
  brandSolid: '264 92% 42%',
  canvas: '268 20% 98%',
  danger: '0 84% 60%',
  ink: '268 10% 20%',
  inkMuted: '268 6% 28%',
  inkSoft: '268 8% 36%',
  line: '268 15% 84%',
  success: '142 76% 36%',
  surface: '268 20% 100%',
  surfaceMuted: '268 20% 96%',
  surfaceStrong: '268 15% 90%',
  warning: '38 92% 50%'
} as const

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
  base: '0.625rem',
  lg: '0.75rem',
  sm: '0.375rem'
} as const

export const lumenShadow = {
  lg: '0 24px 64px hsl(222 47% 11% / 0.14)',
  md: '0 8px 24px hsl(222 47% 11% / 0.08)',
  sm: '0 1px 2px hsl(222 47% 11% / 0.06)'
} as const

export const lumenFont =
  '"Montserrat", "Avenir Next", "Segoe UI", sans-serif' as const

export const lumenMotion = {
  duration: '160ms',
  durationFast: '120ms',
  durationSlow: '300ms',
  ease: 'cubic-bezier(0.32, 0.72, 0, 1)',
  easeEmphasized: 'cubic-bezier(0.22, 1, 0.36, 1)'
} as const

export const composeClassName = (...classes: (boolean | null | string | undefined)[]) => classes.filter(Boolean).join(' ')
