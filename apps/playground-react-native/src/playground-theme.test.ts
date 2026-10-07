import { describe, expect, test, vi } from 'vitest'

import { createPlaygroundTheme, isThemePreset, themePresetOptions } from './playground-theme'

// Exercise the real theme implementation without loading native UI modules in Node.
vi.mock('@santi020k/lumen-react-native', async () => {
  const { createLumenTheme } = await import('../../../packages/react-native/src/theme')

  return { createLumenTheme }
})

describe('playground appearance', () => {
  test('offers all shared appearances and preserves the brand theme', () => {
    expect(themePresetOptions.map(option => option.label)).toEqual(['Normal', 'Studio', 'Glass', 'santi020k'])
    for (const option of themePresetOptions) expect(isThemePreset(option.value)).toBe(true)
    expect(isThemePreset('unknown')).toBe(false)
    expect(isThemePreset(undefined)).toBe(false)
  })

  test.each(['light', 'dark'] as const)('applies Studio and Glass dimensions in %s', scheme => {
    const normal = createPlaygroundTheme('lumen', scheme)
    const studio = createPlaygroundTheme('studio', scheme)
    const glass = createPlaygroundTheme('glass', scheme)
    expect(studio.scheme).toBe(scheme)
    expect(glass.scheme).toBe(scheme)
    expect(studio.colors.brandSolid).toBe(scheme === 'light' ? '#171717' : '#F5F5F5')
    expect(studio.radii.md).toBeLessThan(normal.radii.md)
    expect(studio.elevation.resting).toBe(0)
    expect(glass.radii.md).toBeGreaterThan(normal.radii.md)
    expect(glass.appearance?.material).toBe('glass')
    expect(studio.colors.danger).toBe(normal.colors.danger)
    expect(glass.colors.danger).toBe(normal.colors.danger)
    expect(createPlaygroundTheme('santi020k', scheme).colors.brandSolid).toBe(scheme === 'light' ? '#5709CE' : '#6F16F3')
  })
})
