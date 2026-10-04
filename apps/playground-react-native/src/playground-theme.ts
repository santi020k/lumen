import { createLumenTheme, type LumenTheme } from '@santi020k/lumen-react-native'

export type ThemePreset = 'glass' | 'lumen' | 'santi020k' | 'studio'

export const themePresetOptions = [
  { label: 'Normal', value: 'lumen' },
  { label: 'Studio', value: 'studio' },
  { label: 'Glass', value: 'glass' },
  { label: 'santi020k', value: 'santi020k' }
] as const

export const isThemePreset = (value: string | undefined): value is ThemePreset => (
  themePresetOptions.some(option => option.value === value)
)

const santi020kColorPalettes: Record<'dark' | 'light', LumenTheme['colors']> = {
  light: {
    canvas: '#FAF9FB',
    surface: '#FFFFFF',
    surfaceMuted: '#F5F3F7',
    surfaceStrong: '#E5E2E9',
    line: '#D6D0DC',
    ink: '#332E38',
    inkSoft: '#5B5463',
    inkMuted: '#47434C',
    brand: '#620AE6',
    brandSolid: '#5709CE',
    brandSoft: '#EEE7F9',
    onBrand: '#FFFFFF',
    accent: '#7D29FA',
    success: '#16A249',
    warning: '#F59F0A',
    danger: '#EF4343',
    onDanger: '#000000'
  },
  dark: {
    canvas: '#110C1D',
    surface: '#1C1528',
    surfaceMuted: '#231D30',
    surfaceStrong: '#322B40',
    line: '#494158',
    ink: '#DFDDE3',
    inkSoft: '#B6B2BD',
    inkMuted: '#8D8896',
    brand: '#A56EF7',
    brandSolid: '#6F16F3',
    brandSoft: '#2A1943',
    onBrand: '#FFFFFF',
    accent: '#9F64F7',
    success: '#21C45D',
    warning: '#F6A823',
    danger: '#F15B5B',
    onDanger: '#110C1D'
  }
}

export const createPlaygroundTheme = (preset: ThemePreset, scheme: 'dark' | 'light'): LumenTheme => {
  const theme = createLumenTheme(scheme, { preset: preset === 'lumen' || preset === 'santi020k' ? 'default' : preset })

  if (preset !== 'santi020k') return theme

  return {
    ...theme,
    colors: santi020kColorPalettes[scheme]
  }
}
