import { describe, expect, test } from 'vitest'

import {
  LumenButtonIntent,
  lumenButtonPalette,
  lumenCardPalette,
  LumenCardVariant,
  lumenColorWithAlpha,
  lumenControlMetrics,
  LumenControlSize,
  lumenFieldDescription,
  lumenSurfaceColor,
  LumenSurfacePadding,
  lumenSurfacePadding,
  LumenSurfaceRadius,
  lumenSurfaceRadius,
  LumenSurfaceTone,
  lumenTextColor,
  lumenTextStyle,
  LumenTextTone,
  LumenTextVariant,
  resolveLumenFieldError
} from '../src/main/ets/components/Styles'
import { LumenColors, LumenRadius, LumenSpacing, LumenTypography } from '../src/main/ets/tokens/Tokens.generated'

const colors = LumenColors.light

const contrastRatio = (foreground: string, background: string): number => {
  const luminances = [foreground, background].map(color => {
    const rgb = Number.parseInt(color.slice(1), 16)
    const channels = [(rgb >> 16) & 255, (rgb >> 8) & 255, rgb & 255]
    const weights = [0.2126, 0.7152, 0.0722]

    return channels.reduce((sum, byte, index) => {
      const normalized = byte / 255
      const linear = normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4

      return sum + linear * (weights[index] ?? 0)
    }, 0)
  })

  return (Math.max(...luminances) + 0.05) / (Math.min(...luminances) + 0.05)
}

describe('lumenColorWithAlpha', () => {
  test('prefixes the alpha channel in ArkUI order', () => {
    expect(lumenColorWithAlpha('#22624D', 0.06)).toBe('#0F22624D')
    expect(lumenColorWithAlpha('#22624d', 0.24)).toBe('#3D22624d')
    expect(lumenColorWithAlpha('#000000', 0)).toBe('#00000000')
    expect(lumenColorWithAlpha('#FFFFFF', 1)).toBe('#FFFFFFFF')
  })

  test('bounds alpha values outside the unit range', () => {
    expect(lumenColorWithAlpha('#112233', -1)).toBe('#00112233')
    expect(lumenColorWithAlpha('#112233', 4)).toBe('#FF112233')
    expect(lumenColorWithAlpha('#112233', Number.NaN)).toBe('#FF112233')
    expect(lumenColorWithAlpha('#112233', Number.POSITIVE_INFINITY)).toBe('#FF112233')
  })

  test('returns other notations unchanged', () => {
    for (const color of ['', '#123', '#11223344', 'rgb(1, 2, 3)', '112233F', '#11223G', '#1122 3']) {
      expect(lumenColorWithAlpha(color, 0.5)).toBe(color)
    }
  })

  test('handles adversarially long input in linear time', () => {
    const color = `#${'F'.repeat(1_000_000)}`

    expect(lumenColorWithAlpha(color, 0.5)).toBe(color)
  })
})

describe('text', () => {
  test('maps each variant to canonical typography tokens', () => {
    expect(lumenTextStyle(LumenTextVariant.Body)).toEqual({
      fontSize: LumenTypography.mdSize,
      fontWeight: LumenTypography.regularWeight
    })

    expect(lumenTextStyle(LumenTextVariant.Caption)).toEqual({
      fontSize: LumenTypography.xsSize,
      fontWeight: LumenTypography.regularWeight
    })

    expect(lumenTextStyle(LumenTextVariant.Label)).toEqual({
      fontSize: LumenTypography.smSize,
      fontWeight: LumenTypography.semiboldWeight
    })

    expect(lumenTextStyle(LumenTextVariant.Title)).toEqual({
      fontSize: LumenTypography.size2xlSize,
      fontWeight: LumenTypography.boldWeight
    })
  })

  test('maps each tone to a semantic color', () => {
    expect(lumenTextColor(colors, LumenTextTone.Default)).toBe(colors.ink)
    expect(lumenTextColor(colors, LumenTextTone.Muted)).toBe(colors.inkMuted)
    expect(lumenTextColor(colors, LumenTextTone.Soft)).toBe(colors.inkSoft)
    expect(lumenTextColor(colors, LumenTextTone.Danger)).toBe(colors.danger)
    expect(lumenTextColor(colors, LumenTextTone.Success)).toBe(colors.success)
    expect(lumenTextColor(colors, LumenTextTone.Warning)).toBe(colors.warning)
  })
})

describe('surface', () => {
  test('maps tones, padding, and radius to tokens', () => {
    expect(lumenSurfaceColor(colors, LumenSurfaceTone.Surface)).toBe(colors.surface)
    expect(lumenSurfaceColor(colors, LumenSurfaceTone.Canvas)).toBe(colors.canvas)
    expect(lumenSurfaceColor(colors, LumenSurfaceTone.Muted)).toBe(colors.surfaceMuted)
    expect(lumenSurfaceColor(colors, LumenSurfaceTone.Strong)).toBe(colors.surfaceStrong)

    expect([
      LumenSurfacePadding.None,
      LumenSurfacePadding.Sm,
      LumenSurfacePadding.Md,
      LumenSurfacePadding.Lg,
      LumenSurfacePadding.Xl
    ].map(lumenSurfacePadding)).toEqual([0, LumenSpacing.sm, LumenSpacing.md, LumenSpacing.lg, LumenSpacing.xl])

    expect([
      LumenSurfaceRadius.None,
      LumenSurfaceRadius.Sm,
      LumenSurfaceRadius.Md,
      LumenSurfaceRadius.Lg,
      LumenSurfaceRadius.Xl,
      LumenSurfaceRadius.Size2xl,
      LumenSurfaceRadius.Size3xl
    ].map(lumenSurfaceRadius)).toEqual([
      0,
      LumenRadius.sm,
      LumenRadius.md,
      LumenRadius.lg,
      LumenRadius.xl,
      LumenRadius.size2xl,
      LumenRadius.size3xl
    ])
  })
})

describe('button', () => {
  test('resolves a palette for every intent', () => {
    expect(lumenButtonPalette(colors, LumenButtonIntent.Primary)).toEqual({
      background: colors.brandSolid,
      border: colors.brandSolid,
      foreground: colors.onBrand
    })

    expect(lumenButtonPalette(colors, LumenButtonIntent.Secondary)).toEqual({
      background: colors.surfaceMuted,
      border: colors.line,
      foreground: colors.ink
    })

    expect(lumenButtonPalette(colors, LumenButtonIntent.Danger)).toEqual({
      background: colors.danger,
      border: colors.danger,
      foreground: colors.onDanger
    })

    expect(lumenButtonPalette(colors, LumenButtonIntent.Success)).toEqual({
      background: colors.success,
      border: colors.success,
      foreground: '#000000'
    })

    expect(lumenButtonPalette(colors, LumenButtonIntent.Quiet)).toEqual({
      background: '#00000000',
      border: '#00000000',
      foreground: colors.inkSoft
    })
  })

  test.each([LumenColors.light, LumenColors.dark])('keeps success labels above normal-text AA in each built-in palette', palette => {
    const result = lumenButtonPalette(palette, LumenButtonIntent.Success)

    expect(result.background).toBe(palette.success)
    expect(result.border).toBe(palette.success)
    expect(result.foreground).toBe('#000000')
    expect(contrastRatio(result.foreground, result.background)).toBeGreaterThanOrEqual(4.5)
  })

  test.each([
    ['#004400', '#FFFFFF', '#FFFFFF'],
    ['#004400', '#000000', '#FFFFFF'],
    ['#FFFFFF', '#FFFFFF', '#000000'],
    ['#000000', '#000000', '#FFFFFF'],
    ['#757575', '#757575', '#FFFFFF'],
    ['#767676', '#767676', '#000000'],
    ['#ffffff', '#182325', '#182325'],
    ['#ffffff', 'invalid', '#000000']
  ])('resolves readable custom success %s with foreground %s', (success, onBrand, foreground) => {
    for (const palette of [LumenColors.light, LumenColors.dark]) {
      const result = lumenButtonPalette({ ...palette, success, onBrand }, LumenButtonIntent.Success)

      expect(contrastRatio(result.foreground, result.background)).toBeGreaterThanOrEqual(4.5)
      expect(result).toEqual({
        background: success,
        border: success,
        foreground
      })
    }
  })

  test('preserves custom foreground for success notation that cannot be measured', () => {
    for (const success of ['#123', '#00112233', 'green', '#11223G', `#${'F'.repeat(1_000_000)}`]) {
      expect(lumenButtonPalette({ ...colors, success }, LumenButtonIntent.Success).foreground).toBe(colors.onBrand)
    }
  })

  test('keeps every control size at or above a 36vp target', () => {
    expect(lumenControlMetrics(LumenControlSize.Sm)).toEqual({ horizontalPadding: LumenSpacing.md, minHeight: 36 })
    expect(lumenControlMetrics(LumenControlSize.Md)).toEqual({ horizontalPadding: LumenSpacing.lg, minHeight: 44 })
    expect(lumenControlMetrics(LumenControlSize.Lg)).toEqual({ horizontalPadding: LumenSpacing.xl, minHeight: 52 })
  })
})

describe('card', () => {
  test('uses opaque surfaces for neutral variants', () => {
    expect(lumenCardPalette(colors, LumenCardVariant.Default)).toEqual({
      background: colors.surface,
      border: colors.line
    })

    expect(lumenCardPalette(colors, LumenCardVariant.Muted)).toEqual({
      background: colors.surfaceMuted,
      border: colors.line
    })
  })

  test('tints semantic variants from their status color', () => {
    const variants: [LumenCardVariant, string][] = [
      [LumenCardVariant.Accent, colors.accent],
      [LumenCardVariant.Destructive, colors.danger],
      [LumenCardVariant.Success, colors.success],
      [LumenCardVariant.Warning, colors.warning]
    ]

    for (const [variant, accent] of variants) {
      expect(lumenCardPalette(colors, variant)).toEqual({
        background: `#0F${accent.slice(1)}`,
        border: `#3D${accent.slice(1)}`
      })
    }
  })
})

describe('resolveLumenFieldError', () => {
  test('treats a flag or a message as invalid', () => {
    expect(resolveLumenFieldError(false, '')).toBe(false)
    expect(resolveLumenFieldError(true, '')).toBe(true)
    expect(resolveLumenFieldError(false, 'Enter an email address')).toBe(true)
  })
})

describe('lumenFieldDescription', () => {
  test('joins the label and error message that are present', () => {
    expect(lumenFieldDescription('', '')).toBe('')
    expect(lumenFieldDescription('Email', '')).toBe('Email')
    expect(lumenFieldDescription('', 'Enter an email address')).toBe('Enter an email address')
    expect(lumenFieldDescription('Email', 'Enter an email address')).toBe('Email. Enter an email address')
  })
})
