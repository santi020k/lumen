import { expect, test } from 'vitest'

import { cachedLumenThemes } from './lumen-shiki-themes'

const luminance = (hex: string): number => {
  const color = Number.parseInt(hex.slice(1), 16)
  const channels = [
    [(color >> 16) & 255, 0.2126],
    [(color >> 8) & 255, 0.7152],
    [color & 255, 0.0722]
  ] as const

  return channels.reduce((result, [value, weight]) => {
    const channel = value / 255
    const linear = channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4

    return result + linear * weight
  }, 0)
}

test.each(Object.entries(cachedLumenThemes))('%s syntax colors meet AA on their theme background', (_, theme) => {
  const background = luminance(theme.colors['editor.background'])
  const colors = [theme.colors['editor.foreground'], ...theme.tokenColors.map(token => token.settings.foreground)]

  for (const color of colors) {
    const foreground = luminance(color)
    const contrast = (Math.max(foreground, background) + 0.05) / (Math.min(foreground, background) + 0.05)

    expect(contrast, `${color} on ${theme.colors['editor.background']}`).toBeGreaterThanOrEqual(4.5)
  }
})
