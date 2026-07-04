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

export const composeClassName = (...classes: (boolean | null | string | undefined)[]) =>
  classes.filter(Boolean).join(' ')
