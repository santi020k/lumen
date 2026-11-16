import { describe, expect, test } from 'vitest'

import { createThemeBuilderTokens } from './theme-builder.js'

describe('theme builder typography and elevation', () => {
  test('exports selected typography and flat shadows together', () => {
    const { tokens } = createThemeBuilderTokens({ fontFamily: 'serif', elevation: 'flat' })
    expect(tokens['ui-font']).toBe('ui-serif, Georgia, serif')
    expect(tokens['ui-shadow-sm']).toBe('none')
    expect(tokens['ui-shadow-md']).toBe('none')
    expect(tokens['ui-shadow-lg']).toBe('none')
  })
  test('ignores unrecognized font input and preserves preset defaults', () => {
    const baseline = createThemeBuilderTokens().tokens
    expect(createThemeBuilderTokens({ fontFamily: 'url(https://example.com)', elevation: 'unknown' }).tokens).toEqual(baseline)
    expect(createThemeBuilderTokens({ fontFamily: 'toString' }).tokens).toEqual(baseline)
  })
})
