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
