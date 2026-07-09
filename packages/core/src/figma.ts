import type {
  LumenColorTokenName,
  LumenGlassEffectTokenName,
  LumenThemeTokenName,
  LumenThemeTokens
} from './theme.js'
import {
  lumenColorTokenNames,
  lumenGlassEffectTokenNames
} from './theme.js'

export interface LumenFigmaColorValue {
  a: number
  b: number
  g: number
  r: number
}

export interface LumenFigmaVariable {
  cssValue: string
  description: string
  name: string
  type: 'COLOR'
  value: LumenFigmaColorValue
}

export interface LumenFigmaVariableMode {
  name: string
  variables: LumenFigmaVariable[]
}

export interface LumenFigmaVariableCollection {
  collectionName: string
  modes: LumenFigmaVariableMode[]
}

export interface LumenFigmaVariableExportOptions {
  collectionName?: string
  modeName?: string
  variablePrefix?: string
}

export type LumenDesignTokenType = 'color' | 'dimension' | 'number' | 'shadow'

export interface LumenDesignToken {
  $description: string
  $type: 'color'
  $value: string
}

export interface LumenEffectDesignToken {
  $description: string
  $type: Exclude<LumenDesignTokenType, 'color'>
  $value: number | string
}

export interface LumenDesignTokenExport {
  color: Partial<Record<LumenColorTokenName, LumenDesignToken>>
  effect?: Partial<Record<LumenGlassEffectTokenName, LumenEffectDesignToken>>
}

const lumenTokenDescriptions = {
  accent: 'Secondary action and emphasis color.',
  brand: 'Primary brand color for accents and active states.',
  'brand-soft': 'Soft brand tint for selected or decorative surfaces.',
  'brand-solid': 'Solid brand fill for high-emphasis controls.',
  canvas: 'Base app or page background.',
  danger: 'Destructive, error, or critical status color.',
  'glass-bg': 'Default translucent glass fill.',
  'glass-bg-strong': 'Stronger translucent glass fill for floating surfaces.',
  'glass-bg-subtle': 'Subtle translucent glass fill for nested surfaces.',
  'glass-blur': 'Backdrop blur amount for glass surfaces.',
  'glass-border': 'Translucent glass border color.',
  'glass-brightness': 'Backdrop brightness multiplier for glass surfaces.',
  'glass-edge': 'Specular top edge color for glass surfaces.',
  'glass-edge-soft': 'Soft inner edge color for glass surfaces.',
  'glass-highlight': 'Glass highlight overlay color.',
  'glass-refraction': 'Tint used for glass refraction glow.',
  'glass-saturate': 'Backdrop saturation multiplier for glass surfaces.',
  'glass-shade': 'Inner glass shade color.',
  'glass-shadow': 'Layered depth shadow for glass surfaces.',
  ink: 'Primary readable foreground color.',
  'ink-muted': 'Muted foreground color for secondary content.',
  'ink-soft': 'Soft foreground color for tertiary content.',
  line: 'Borders, dividers, and structural lines.',
  success: 'Positive or complete status color.',
  surface: 'Default component surface.',
  'surface-muted': 'Subtle component surface.',
  'surface-strong': 'Raised or stronger component surface.',
  warning: 'Cautionary status color.'
} as const satisfies Record<LumenThemeTokenName, string>

const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max)

const parseHslToken = (value: string) => {
  const [color = '', alpha = '1'] = value.split('/').map(part => part.trim())

  const [hue, saturation, lightness] = color
    .replaceAll('%', '')
    .split(/\s+/)
    .filter(Boolean)
    .map(Number)

  const opacity = Number(alpha)

  if (
    hue === undefined ||
    saturation === undefined ||
    lightness === undefined ||
    Number.isNaN(hue) ||
    Number.isNaN(saturation) ||
    Number.isNaN(lightness)
  ) {
    throw new Error(`Expected an HSL token value, received "${value}".`)
  }

  return {
    alpha: Number.isNaN(opacity) ? 1 : clamp(opacity, 0, 1),
    hue: ((hue % 360) + 360) % 360,
    lightness: clamp(lightness, 0, 100),
    saturation: clamp(saturation, 0, 100)
  }
}

const hslTokenToRgb = (value: string): [number, number, number] => {
  const { hue, lightness, saturation } = parseHslToken(value)
  const s = saturation / 100
  const l = lightness / 100
  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1))
  const m = l - c / 2
  let rgb: [number, number, number] = [c, 0, x]

  if (hue < 60) {
    rgb = [c, x, 0]
  } else if (hue < 120) {
    rgb = [x, c, 0]
  } else if (hue < 180) {
    rgb = [0, c, x]
  } else if (hue < 240) {
    rgb = [0, x, c]
  } else if (hue < 300) {
    rgb = [x, 0, c]
  }

  return rgb.map(channel => Math.round((channel + m) * 255)) as [number, number, number]
}

const channelToHex = (channel: number): string =>
  clamp(Math.round(channel), 0, 255).toString(16).padStart(2, '0')

export const hslTokenToFigmaColor = (value: string): LumenFigmaColorValue => {
  const [r, g, b] = hslTokenToRgb(value)
  const { alpha } = parseHslToken(value)

  return {
    a: alpha,
    b: b / 255,
    g: g / 255,
    r: r / 255
  }
}

export const hslTokenToHexColor = (value: string): string => {
  const [r, g, b] = hslTokenToRgb(value)
  const { alpha } = parseHslToken(value)
  const hex = `#${channelToHex(r)}${channelToHex(g)}${channelToHex(b)}`

  return alpha < 1 ? `${hex}${channelToHex(alpha * 255)}` : hex
}

export const createFigmaVariableName = (
  token: LumenColorTokenName,
  prefix = 'color'
): string => `${prefix}/${token.replaceAll('-', '/')}`

export const exportThemeFigmaVariables = (
  tokens: LumenThemeTokens,
  options: LumenFigmaVariableExportOptions = {}
): LumenFigmaVariableCollection => {
  const collectionName = options.collectionName ?? 'Lumen theme'
  const modeName = options.modeName ?? 'Light'
  const variablePrefix = options.variablePrefix ?? 'color'
  const variables: LumenFigmaVariable[] = []

  for (const token of lumenColorTokenNames) {
    const value = tokens[token]

    if (!value) continue

    variables.push({
      cssValue: `hsl(${value})`,
      description: lumenTokenDescriptions[token],
      name: createFigmaVariableName(token, variablePrefix),
      type: 'COLOR' as const,
      value: hslTokenToFigmaColor(value)
    })
  }

  return {
    collectionName,
    modes: [{ name: modeName, variables }]
  }
}

const getEffectDesignTokenType = (
  token: LumenGlassEffectTokenName
): Exclude<LumenDesignTokenType, 'color'> => {
  if (token === 'glass-blur') return 'dimension'

  if (token === 'glass-shadow') return 'shadow'

  return 'number'
}

const getEffectDesignTokenValue = (
  token: LumenGlassEffectTokenName,
  value: string
): number | string => {
  if (token === 'glass-saturate' || token === 'glass-brightness') {
    const number = Number(value)

    return Number.isFinite(number) ? number : value
  }

  return value
}

export const exportThemeDesignTokens = (
  tokens: LumenThemeTokens
): LumenDesignTokenExport => ({
  color: Object.fromEntries(
    lumenColorTokenNames
      .filter(token => tokens[token])
      .map(token => [
        token,
        {
          $description: lumenTokenDescriptions[token],
          $type: 'color',
          $value: hslTokenToHexColor(tokens[token] ?? '')
        }
      ])
  ),
  effect: Object.fromEntries(
    lumenGlassEffectTokenNames
      .filter(token => tokens[token])
      .map(token => {
        const value = tokens[token] ?? ''

        return [
          token,
          {
            $description: lumenTokenDescriptions[token],
            $type: getEffectDesignTokenType(token),
            $value: getEffectDesignTokenValue(token, value)
          }
        ]
      })
  )
})
