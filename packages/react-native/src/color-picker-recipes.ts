export interface LumenRGBA { red: number, green: number, blue: number, alpha: number }
export interface LumenHSVA { hue: number, saturation: number, value: number, alpha: number }
export interface LumenColorSwatch { id: string, label: string, value: string, disabled?: boolean }

const channelValid = (value: number): boolean => Number.isInteger(value) && value >= 0 && value <= 255
const unitValid = (value: number): boolean => Number.isFinite(value) && value >= 0 && value <= 1

const rgbaValid = (color: LumenRGBA): boolean => (
  channelValid(color.red) && channelValid(color.green) && channelValid(color.blue) && unitValid(color.alpha)
)

const decimal = (text: string): number | null => {
  if (!text.length) return null

  let dots = 0
  let digits = 0

  for (const character of text) {
    if (character === '.') dots++
    else if (character >= '0' && character <= '9') digits++
    else return null
  }

  return dots <= 1 && digits > 0 ? Number(text) : null
}

const hexDigit = (character: string): boolean => (
  (character >= '0' && character <= '9') || (character >= 'a' && character <= 'f')
)

const parseHex = (hex: string): LumenRGBA | null => {
  if (![3, 4, 6, 8].includes(hex.length)) return null

  let full = ''

  for (const character of hex) {
    if (!hexDigit(character)) return null

    full += hex.length < 5 ? character + character : character
  }

  return {
    red: Number.parseInt(full.slice(0, 2), 16),
    green: Number.parseInt(full.slice(2, 4), 16),
    blue: Number.parseInt(full.slice(4, 6), 16),
    alpha: full.length === 8 ? Number.parseInt(full.slice(6, 8), 16) / 255 : 1
  }
}

const parseRGBA = (value: string): LumenRGBA | null => {
  if (!value.startsWith('rgba(') || !value.endsWith(')')) return null

  const parts = value.slice(5, -1).split(',').map(part => decimal(part.trim()))
  const [red, green, blue, alpha] = parts

  if (parts.length !== 4 || red == null || green == null || blue == null || alpha == null) return null

  const color = { red, green, blue, alpha }

  return rgbaValid(color) ? color : null
}

/** Bounded, dependency-free sRGB parsing: hex and numeric rgba() only. */
export const parseLumenColor = (input: unknown): LumenRGBA | null => {
  if (typeof input !== 'string' || input.length > 64) return null

  const value = input.trim().toLowerCase()

  return value.startsWith('#') ? parseHex(value.slice(1)) : parseRGBA(value)
}

export const formatLumenColor = (color: LumenRGBA, allowAlpha = false): string | null => {
  if (!rgbaValid(color) || (!allowAlpha && color.alpha !== 1)) return null

  const bytes = [color.red, color.green, color.blue, ...(allowAlpha ? [Math.round(color.alpha * 255)] : [])]

  return '#' + bytes.map(byte => byte.toString(16).padStart(2, '0')).join('')
}

export const lumenRGBAToHSVA = (color: LumenRGBA): LumenHSVA | null => {
  if (!rgbaValid(color)) return null

  const red = color.red / 255
  const green = color.green / 255
  const blue = color.blue / 255
  const max = Math.max(red, green, blue)
  const min = Math.min(red, green, blue)
  const delta = max - min
  let hue = 0

  if (delta) {
    if (max === red) hue = ((green - blue) / delta) % 6
    else if (max === green) hue = (blue - red) / delta + 2
    else hue = (red - green) / delta + 4

    hue = (hue * 60 + 360) % 360
  }

  return { hue, saturation: max === 0 ? 0 : delta / max, value: max, alpha: color.alpha }
}

const hsvaValid = (color: LumenHSVA): boolean => (
  Number.isFinite(color.hue) && color.hue >= 0 && color.hue <= 360 &&
  unitValid(color.saturation) && unitValid(color.value) && unitValid(color.alpha)
)

export const lumenHSVAToRGBA = (color: LumenHSVA): LumenRGBA | null => {
  if (!hsvaValid(color)) return null

  const hue = color.hue % 360 / 60
  const chroma = color.value * color.saturation
  const secondary = chroma * (1 - Math.abs(hue % 2 - 1))
  const offset = color.value - chroma

  const sectors: readonly (readonly [number, number, number])[] = [
    [chroma, secondary, 0],
    [secondary, chroma, 0],
    [0, chroma, secondary],
    [0, secondary, chroma],
    [secondary, 0, chroma],
    [chroma, 0, secondary]
  ]

  const sector = sectors[Math.floor(hue)]

  if (!sector) return null

  const red = sector[0]
  const green = sector[1]
  const blue = sector[2]

  return {
    red: Math.round((red + offset) * 255),
    green: Math.round((green + offset) * 255),
    blue: Math.round((blue + offset) * 255),
    alpha: color.alpha
  }
}
