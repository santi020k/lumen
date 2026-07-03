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

export const composeClassName = (...classes: (boolean | null | string | undefined)[]) =>
  classes.filter(Boolean).join(' ')
