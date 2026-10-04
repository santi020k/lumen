import { exportThemeDesignTokens, exportThemeFigmaVariables } from './figma.js'
import {
  createThemeFromHue,
  createThemePreset,
  exportThemeCss,
  type LumenThemePreset,
  type LumenThemeTokens } from './theme.js'

export type LumenThemeBuilderExportFormat = 'css' | 'figma' | 'tokens'

export type LumenThemeBuilderMode = 'generated' | 'manual'

export type LumenThemeBuilderScheme = 'dark' | 'light'

export interface LumenThemeBuilderOptions {
  radiusScale?: number | string | null
  spacingScale?: number | string | null
  borderWidth?: number | string | null
  preset?: string | null
  accentHue?: number | string | null
  hue?: number | string | null
  mode?: string | null
  primaryColor?: string | null
  scheme?: string | null
  secondaryColor?: string | null
}

const appearanceNumber = (value: number | string | null | undefined, fallback: number): number => {
  if (value === undefined || value === null || value === '') return fallback

  const number = Number(value)

  return Number.isFinite(number) && number >= 0 ? number : fallback
}

const scaleAppearanceDimensions = (
  tokens: LumenThemeTokens, names: readonly string[], requested: number | string | null | undefined
): void => {
  const scale = appearanceNumber(requested, 1)
  const dimensions = names.map(name => ({ name, value: Number.parseFloat(tokens[name] ?? '0') }))
  const safeScale = dimensions.every(({ value }) => Number.isFinite(value * scale)) ? scale : 1

  for (const { name, value } of dimensions) {
    tokens[name] = `${value * safeScale}rem`
  }
}

const customizeAppearance = (tokens: LumenThemeTokens, options: LumenThemeBuilderOptions): void => {
  scaleAppearanceDimensions(tokens, ['ui-radius-sm', 'ui-radius', 'ui-radius-lg'], options.radiusScale)

  scaleAppearanceDimensions(tokens, ['zero', 'xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl'].map(name => `ui-space-${name}`), options.spacingScale)

  tokens['ui-border-width'] = `${appearanceNumber(options.borderWidth, 1)}px`
}

export interface LumenThemeBuilderResult {
  preset?: LumenThemePreset
  accentHue: number
  hue: number
  mode: LumenThemeBuilderMode
  scheme: LumenThemeBuilderScheme
  tokens: LumenThemeTokens
}

export const coerceThemePreset = (value?: string | null): LumenThemePreset => value === 'studio' || value === 'glass' ? value : 'default'

export const coerceThemeBuilderExportFormat = (
  value?: string | null
): LumenThemeBuilderExportFormat => {
  if (value === 'figma' || value === 'tokens') return value

  return 'css'
}

export const coerceThemeBuilderMode = (
  value?: string | null
): LumenThemeBuilderMode => (value === 'manual' ? 'manual' : 'generated')

export const coerceThemeBuilderScheme = (
  value?: string | null
): LumenThemeBuilderScheme => (value === 'dark' ? 'dark' : 'light')

export const normalizeThemeBuilderHue = (
  value: number | string | null | undefined,
  fallback = 0
): number => {
  const parsed = Number(value)

  if (!Number.isFinite(parsed)) return fallback

  return ((Math.round(parsed) % 360) + 360) % 360
}

export const normalizeThemeBuilderHex = (value: string): string | null => {
  const hex = value.trim().replace(/^#/, '')

  if (/^[\da-f]{3}$/i.test(hex)) {
    const expanded = [
      hex.charAt(0),
      hex.charAt(1),
      hex.charAt(2)
    ].map(character => character.repeat(2)).join('')

    return `#${expanded}`.toLowerCase()
  }

  return /^[\da-f]{6}$/i.test(hex) ? `#${hex.toLowerCase()}` : null
}

export const themeBuilderHexToHsl = (
  value: string
): { hue: number, value: string } | null => {
  const normalized = normalizeThemeBuilderHex(value)

  if (!normalized) return null

  const red = Number.parseInt(normalized.slice(1, 3), 16) / 255
  const green = Number.parseInt(normalized.slice(3, 5), 16) / 255
  const blue = Number.parseInt(normalized.slice(5, 7), 16) / 255
  const max = Math.max(red, green, blue)
  const min = Math.min(red, green, blue)
  const lightness = (max + min) / 2
  const delta = max - min
  let hue = 0
  let saturation = 0

  if (delta !== 0) {
    saturation = delta / (1 - Math.abs(2 * lightness - 1))

    if (max === red) {
      hue = 60 * (((green - blue) / delta) % 6)
    } else if (max === green) {
      hue = 60 * ((blue - red) / delta + 2)
    } else {
      hue = 60 * ((red - green) / delta + 4)
    }
  }

  const normalizedHue = normalizeThemeBuilderHue(hue)

  return {
    hue: normalizedHue,
    value: `${normalizedHue} ${Math.round(saturation * 100)}% ${Math.round(lightness * 100)}%`
  }
}

const getManualColors = (options: LumenThemeBuilderOptions) => ({
  primary: options.primaryColor ? themeBuilderHexToHsl(options.primaryColor) : null,
  secondary: options.secondaryColor ? themeBuilderHexToHsl(options.secondaryColor) : null
})

const applyManualColors = (
  tokens: LumenThemeTokens,
  { primary, secondary }: ReturnType<typeof getManualColors>
): void => {
  if (primary) {
    tokens.brand = primary.value

    tokens['brand-solid'] = primary.value
  }

  if (secondary) tokens.accent = secondary.value
}

export const createThemeBuilderTokens = (
  options: LumenThemeBuilderOptions = {}
): LumenThemeBuilderResult => {
  const hue = normalizeThemeBuilderHue(options.hue)

  const accentHue = normalizeThemeBuilderHue(
    options.accentHue, normalizeThemeBuilderHue(hue + 150)
  )

  const mode = coerceThemeBuilderMode(options.mode)
  const scheme = coerceThemeBuilderScheme(options.scheme)
  const colors = getManualColors(mode === 'manual' ? options : {})
  const baseHue = colors.primary?.hue ?? hue
  const baseAccentHue = colors.secondary?.hue ?? accentHue

  const tokens = options.preset ?
    createThemePreset(coerceThemePreset(options.preset), { scheme }) :
    createThemeFromHue(baseHue, {
      accentHue: baseAccentHue,
      scheme
    })

  applyManualColors(tokens, colors)

  customizeAppearance(tokens, options)

  return {
    ...(options.preset ? { preset: coerceThemePreset(options.preset) } : {}),
    accentHue: baseAccentHue,
    hue: baseHue,
    mode,
    scheme,
    tokens
  }
}

export const exportThemeBuilderCss = (
  tokens: LumenThemeTokens,
  scheme: LumenThemeBuilderScheme
): string => {
  const css = exportThemeCss(tokens)
  const firstLineEnd = css.indexOf('\n')

  if (firstLineEnd === -1) return css

  return `${css.slice(0, firstLineEnd + 1)}  color-scheme: ${scheme};\n${css.slice(firstLineEnd + 1)}`
}

export const exportThemeBuilderValue = (
  tokens: LumenThemeTokens,
  scheme: LumenThemeBuilderScheme,
  format: LumenThemeBuilderExportFormat
): string => {
  if (format === 'figma') {
    return JSON.stringify(
      exportThemeFigmaVariables(tokens, {
        collectionName: 'Lumen',
        modeName: scheme === 'dark' ? 'Dark' : 'Light'
      }), null, 2
    )
  }

  if (format === 'tokens') {
    return JSON.stringify(exportThemeDesignTokens(tokens), null, 2)
  }

  return exportThemeBuilderCss(tokens, scheme)
}
