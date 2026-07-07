export type LumenThemeTokens = Record<string, string>

export interface LumenContrastScore {
  ratio: number
  wcagAA: boolean
  wcagAAA: boolean
}

export interface LumenThemeContrastSuggestion {
  background: string
  foreground: string
  ratio: number
}

export const lumenTokenNames = [
  'canvas',
  'surface',
  'surface-muted',
  'surface-strong',
  'line',
  'ink',
  'ink-soft',
  'ink-muted',
  'brand',
  'brand-solid',
  'brand-soft',
  'accent',
  'success',
  'warning',
  'danger'
] as const

export type LumenThemeTokenName = typeof lumenTokenNames[number]

export const exportThemeCss = (
  tokens: LumenThemeTokens,
  selector = ':root'
): string => {
  const lines = lumenTokenNames
    .filter(token => tokens[token])
    .map(token => {
      const value = tokens[token] ?? ''

      return `  --${token}: ${value};`
    })

  return `${selector} {\n${lines.join('\n')}\n}`
}

export const parseThemeCss = (css: string): LumenThemeTokens => {
  const tokens: LumenThemeTokens = {}

  for (const token of lumenTokenNames) {
    const match = new RegExp(`--${token}:\\s*([^;]+);`).exec(css)

    if (match?.[1]) {
      tokens[token] = match[1].trim()
    }
  }

  return tokens
}

export const createThemePalette = (
  brand: string,
  accent = brand
): LumenThemeTokens => ({
  accent,
  brand,
  'brand-soft': brand.replace(/(\d+)%$/, '96%'),
  'brand-solid': brand,
  canvas: '0 0% 100%',
  danger: '0 84% 60%',
  ink: '222 47% 11%',
  'ink-muted': '215 12% 48%',
  'ink-soft': '215 16% 32%',
  line: '220 13% 86%',
  success: '142 71% 36%',
  surface: '0 0% 100%',
  'surface-muted': '220 14% 96%',
  'surface-strong': '220 13% 91%',
  warning: '38 92% 50%'
})

export interface LumenThemeFromHueOptions {
  accentHue?: number
  scheme?: 'dark' | 'light'
}

const normalizeHue = (hue: number): number => ((Math.round(hue) % 360) + 360) % 360

/**
 * Derives a complete token set from a single brand hue.
 * Neutral surfaces pick up a faint tint of the hue; the accent sits 150deg
 * away on the wheel. Status colors stay fixed for recognizability.
 * Mirrored by the ThemeBuilder runtime enhancement in lumen-astro.
 */
export const createThemeFromHue = (
  hue: number,
  options: LumenThemeFromHueOptions = {}
): LumenThemeTokens => {
  const h = normalizeHue(hue)
  const accentHue = normalizeHue(options.accentHue ?? h + 150)

  if (options.scheme === 'dark') {
    return {
      accent: `${accentHue} 70% 48%`,
      brand: `${h} 88% 60%`,
      'brand-soft': `${h} 80% 16%`,
      'brand-solid': `${h} 88% 46%`,
      canvas: `${h} 24% 8%`,
      danger: '0 84% 65%',
      ink: `${h} 20% 96%`,
      'ink-muted': `${h} 10% 62%`,
      'ink-soft': `${h} 14% 77%`,
      line: `${h} 14% 26%`,
      success: '142 69% 45%',
      surface: `${h} 18% 11%`,
      'surface-muted': `${h} 16% 15%`,
      'surface-strong': `${h} 14% 22%`,
      warning: '38 92% 55%'
    }
  }

  return {
    accent: `${accentHue} 70% 40%`,
    brand: `${h} 85% 53%`,
    'brand-soft': `${h} 90% 96%`,
    'brand-solid': `${h} 85% 45%`,
    canvas: `${h} 20% 99%`,
    danger: '0 84% 60%',
    ink: `${h} 40% 11%`,
    'ink-muted': `${h} 10% 48%`,
    'ink-soft': `${h} 14% 32%`,
    line: `${h} 14% 86%`,
    success: '142 71% 36%',
    surface: `${h} 20% 100%`,
    'surface-muted': `${h} 16% 96%`,
    'surface-strong': `${h} 14% 91%`,
    warning: '38 92% 50%'
  }
}

const hslToRgb = (value: string): [number, number, number] => {
  const [hue = 0, saturation = 0, lightness = 0] = value
    .replaceAll('%', '')
    .split(/\s+/)
    .map(Number)

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

  const [r, g, b] = rgb

  return [
    Math.round((r + m) * 255),
    Math.round((g + m) * 255),
    Math.round((b + m) * 255)
  ]
}

const getRelativeLuminance = ([r, g, b]: [number, number, number]): number => {
  const [red, green, blue] = [r, g, b].map(channel => {
    const value = channel / 255

    return value <= 0.03928
      ? value / 12.92
      : ((value + 0.055) / 1.055) ** 2.4
  })

  return 0.2126 * (red ?? 0) + 0.7152 * (green ?? 0) + 0.0722 * (blue ?? 0)
}

export const getContrastRatio = (
  foreground: string,
  background: string
): number => {
  const foregroundLuminance = getRelativeLuminance(hslToRgb(foreground))
  const backgroundLuminance = getRelativeLuminance(hslToRgb(background))
  const lighter = Math.max(foregroundLuminance, backgroundLuminance)
  const darker = Math.min(foregroundLuminance, backgroundLuminance)

  return Number(((lighter + 0.05) / (darker + 0.05)).toFixed(2))
}

export const scoreThemeContrast = (
  tokens: LumenThemeTokens,
  foreground = 'ink',
  background = 'canvas'
): LumenContrastScore => {
  const ratio = getContrastRatio(tokens[foreground] ?? '0 0% 0%', tokens[background] ?? '0 0% 100%')

  return {
    ratio,
    wcagAA: ratio >= 4.5,
    wcagAAA: ratio >= 7
  }
}

export const mergeThemeTokens = (
  tokens: LumenThemeTokens,
  overrides: Partial<LumenThemeTokens>
): LumenThemeTokens => ({
  ...tokens,
  ...Object.fromEntries(
    Object.entries(overrides).filter((entry): entry is [string, string] => Boolean(entry[1]))
  )
})

export const suggestReadableInk = (
  background: string
): LumenThemeContrastSuggestion => {
  const darkForeground = '0 0% 0%'
  const lightForeground = '0 0% 100%'
  const darkRatio = getContrastRatio(darkForeground, background)
  const lightRatio = getContrastRatio(lightForeground, background)

  return darkRatio >= lightRatio
    ? { background, foreground: darkForeground, ratio: darkRatio }
    : { background, foreground: lightForeground, ratio: lightRatio }
}

export const tuneThemeContrast = (
  tokens: LumenThemeTokens,
  foreground = 'ink',
  background = 'canvas'
): LumenThemeTokens => {
  const current = scoreThemeContrast(tokens, foreground, background)

  if (current.wcagAA) return { ...tokens }

  const suggestion = suggestReadableInk(tokens[background] ?? '0 0% 100%')

  return {
    ...tokens,
    [foreground]: suggestion.foreground
  }
}
