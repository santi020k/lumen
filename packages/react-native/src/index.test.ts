import { describe, expect, test } from 'vitest'

import {
  createLumenTheme,
  lumenDarkTheme,
  lumenLightTheme
} from './theme.js'
import { lumenColorTokens } from './tokens.generated.js'

describe('Lumen React Native foundations', () => {
  test('provides matching semantic roles for light and dark themes', () => {
    expect(Object.keys(lumenColorTokens.light)).toEqual(
      Object.keys(lumenColorTokens.dark)
    )
    expect(lumenLightTheme.colors.brand).toBe('#2463EB')
    expect(lumenDarkTheme.colors.brand).toBe('#29B4F5')
  })

  test('creates a complete theme for the requested scheme', () => {
    const theme = createLumenTheme('dark')

    expect(theme.scheme).toBe('dark')
    expect(theme.spacing.lg).toBe(16)
    expect(theme.radii.md).toBe(10)
    expect(theme.durations.standard).toBe(160)
  })
})
