import { createLumenTheme, type LumenTheme, type LumenThemeDefinition } from '@santi020k/lumen-react-native'
import { fieldTheme } from '@santi020k/lumen-react-native/themes/field'
import { paperTheme } from '@santi020k/lumen-react-native/themes/paper'
import { santi020kTheme } from '@santi020k/lumen-react-native/themes/santi020k'

export type ThemePreset = typeof themePresetOptions[number]['value']

export const themePresetOptions = [
  { label: 'Normal', value: 'lumen' },
  { label: 'Studio', value: 'studio' },
  { label: 'Glass', value: 'glass' },
  { label: 'santi020k', value: 'santi020k' },
  { label: 'Paper', value: 'paper' },
  { label: 'Field', value: 'field' }
] as const

export const isThemePreset = (value: string | undefined): value is ThemePreset => (
  themePresetOptions.some(option => option.value === value)
)

const namedThemes = { field: fieldTheme, paper: paperTheme, santi020k: santi020kTheme }

export const createPlaygroundTheme = (preset: ThemePreset, scheme: 'dark' | 'light'): LumenTheme => {
  if (preset === 'lumen') return createLumenTheme(scheme)

  if (preset === 'studio' || preset === 'glass') return createLumenTheme(scheme, { preset })

  return createLumenTheme(scheme, { definition: namedThemes[preset] })
}

// A local example of a theme that shares the application's foundation and owns its actions.
export const harborTheme = {
  light: { brand: '#0D6769', brandSolid: '#0D6769', brandSoft: '#D7EFEE', onBrand: '#FFFFFF' },
  dark: { brand: '#80DBD3', brandSolid: '#80DBD3', brandSoft: '#204646', onBrand: '#0D2326' },
  radii: { sm: 6, md: 12, lg: 16 }
} satisfies LumenThemeDefinition
