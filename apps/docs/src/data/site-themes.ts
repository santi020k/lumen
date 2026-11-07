export const themeStorageKey = 'lumen-theme'

export const siteThemeFamilies = [
  { label: 'Lumen', value: 'lumen', preset: null },
  { label: 'Santi020k', value: 'santi020k', preset: null },
  { label: 'Studio', value: 'studio', preset: 'studio' },
  { label: 'Paper', value: 'paper', preset: 'paper' },
  { label: 'Field', value: 'field', preset: 'field' },
  { label: 'Glass', value: 'glass', preset: 'glass' },
  { label: 'Harbor', value: 'harbor', preset: 'example-harbor' }
] as const

type ThemeMode = 'light' | 'dark'

type ThemeFamily = typeof siteThemeFamilies[number]

export const siteTheme = (family: ThemeFamily, mode: ThemeMode) => ({
  family,
  key: `${family.value}-${mode}`,
  mode,
  rootTheme: `${family.value === 'santi020k' ? 'santi020k' : 'lumen'}-${mode}`
})

export type SiteTheme = ReturnType<typeof siteTheme>

export const defaultThemeFamily = siteThemeFamilies[0]

// Older docs versions saved just the mode. Those preferences select the Lumen family.
export const siteThemePreferences: Record<string, SiteTheme> = {
  light: siteTheme(defaultThemeFamily, 'light'),
  dark: siteTheme(defaultThemeFamily, 'dark'),
  ...Object.fromEntries(siteThemeFamilies.flatMap(family => (['light', 'dark'] as const).map(mode => {
    const theme = siteTheme(family, mode)

    return [theme.key, theme]
  })))
}
