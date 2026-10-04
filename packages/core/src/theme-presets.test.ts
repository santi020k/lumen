import { describe, expect, test } from 'vitest'

import { exportThemeDesignTokens } from './figma.js'
import { lumenCssColorTokens } from './foundations.generated.js'
import { createThemeFromHue, createThemePreset, exportThemeCss, parseThemeCss, scoreThemeContrast } from './theme.js'
import { createThemeBuilderTokens } from './theme-builder.js'

describe('appearance presets', () => {
  test.each(['light', 'dark'] as const)('preserves default semantic colors in %s', scheme => {
    const tokens = createThemePreset('default', { scheme })

    expect(tokens.brand).toBe(lumenCssColorTokens[scheme].brand)
    expect(tokens.canvas).toBe(lumenCssColorTokens[scheme].canvas)
    expect(tokens['ui-radius']).toBe('0.625rem')
  })

  test.each(['light', 'dark'] as const)('keeps studio text and action foregrounds readable in %s', scheme => {
    const tokens = createThemePreset('studio', { scheme })

    expect(scoreThemeContrast(tokens).wcagAA).toBe(true)
    expect(scoreThemeContrast(tokens, 'on-brand', 'brand-solid').wcagAA).toBe(true)
    expect(scoreThemeContrast(tokens, 'ink-muted', 'canvas').wcagAA).toBe(true)
    expect(tokens.danger).toBe(lumenCssColorTokens[scheme].danger)
    expect(tokens['ui-shadow-md']).toBe('none')
    expect(tokens['ui-font']).toContain('system-ui')
  })

  test('allows independent scoped overrides and retains them through CSS export', () => {
    const tokens = createThemePreset('studio', {
      overrides: { brand: '260 80% 40%', 'ui-radius': '1rem', 'ui-border-width': '2px', 'ui-space-lg': '1.25rem' }
    })
    const css = exportThemeCss(tokens, '[data-product-theme]')
    const imported = parseThemeCss(css)

    expect(css).toContain('[data-product-theme]')
    expect(imported).toEqual(tokens)
    expect(createThemePreset('studio').brand).toBe('0 0% 9%')
    expect(exportThemeDesignTokens(tokens).structure?.['ui-border-width']?.$type).toBe('dimension')
    expect(exportThemeDesignTokens(tokens).structure?.['ui-space-lg']?.$value).toBe('1.25rem')
  })

  test('retains legacy generated themes and permits manual branding on a preset', () => {
    expect(createThemeBuilderTokens({ hue: 260 }).tokens).toEqual(createThemeFromHue(260))
    const studio = createThemeBuilderTokens({ preset: 'studio', scheme: 'dark', mode: 'manual', primaryColor: '#ff0000' })

    expect(studio.preset).toBe('studio')
    expect(studio.tokens['brand-solid']).toBe('0 100% 50%')
    expect(studio.tokens.canvas).toBe('0 0% 7%')
    expect(studio.tokens['ui-shadow-sm']).toBe('none')
  })

  test('glass preserves opaque semantic surfaces while exposing effect tokens', () => {
    const glass = createThemePreset('glass')

    expect(glass.surface).toBe(createThemePreset('default').surface)
    expect(glass.surface).not.toContain('/')
    expect(glass['glass-blur']).toBe('22px')
  })

  test('validates appearance values and exports each adjusted dimension', () => {
    const result = createThemeBuilderTokens({ preset: 'studio', radiusScale: 2, spacingScale: 1.5, borderWidth: 0 })

    expect(result.tokens['ui-radius']).toBe('0.75rem')
    expect(result.tokens['ui-space-lg']).toBe('1.5rem')
    expect(result.tokens['ui-border-width']).toBe('0px')
    expect(createThemeBuilderTokens({ preset: 'studio', radiusScale: -1, spacingScale: Infinity }).tokens['ui-radius']).toBe('0.375rem')
  })
  test.each(['default', 'studio', 'glass'] as const)('rejects overflowing spacing scales for %s', preset => {
    const baseline = createThemeBuilderTokens({ preset }).tokens
    const tokens = createThemeBuilderTokens({
      preset,
      spacingScale: Number.MAX_VALUE,
      radiusScale: Number.MAX_VALUE
    }).tokens
    for (const name of ['zero', 'xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl']) {
      expect(tokens[`ui-space-${name}`]).toBe(baseline[`ui-space-${name}`])
    }
    for (const name of ['ui-radius-sm', 'ui-radius', 'ui-radius-lg']) {
      expect(Number.isFinite(Number.parseFloat(tokens[name] ?? ''))).toBe(true)
    }
    expect(Object.values(tokens).some(value => value.includes('Infinity') || value.includes('NaN'))).toBe(false)
  })
})
