import { describe, expect, test } from 'vitest'

import {
  composeClassName,
  lumenColors,
  lumenComponentNames,
  lumenDarkTheme,
  lumenGlass,
  lumenLightTheme,
  lumenPackages,
  lumenThemeAttribute
} from './index.js'

describe('lumen core metadata', () => {
  test('exports a stable component catalog without duplicates', () => {
    expect(lumenComponentNames).toContain('Button')
    expect(lumenComponentNames).toContain('Tabs')
    expect(new Set(lumenComponentNames).size).toBe(lumenComponentNames.length)
  })

  test('describes all package targets', () => {
    expect(lumenPackages.map(pkg => pkg.packageName)).toEqual([
      '@santi020k/lumen',
      '@santi020k/lumen-core',
      '@santi020k/lumen-astro',
      '@santi020k/lumen-react',
      '@santi020k/lumen-elements'
    ])
  })
})

describe('lumen theme tokens', () => {
  test('keeps the public theme constants explicit', () => {
    expect(lumenThemeAttribute).toBe('data-theme')
    expect(lumenDarkTheme).toBe('dark')
    expect(lumenLightTheme).toBe('light')
    expect(lumenColors.brand).toMatch(/^\d+ \d+% \d+%$/)
    expect(lumenGlass.blur).toBe('18px')
    expect(lumenGlass.bg).toContain('/')
  })

  test('composes class names from truthy values only', () => {
    expect(composeClassName('ui-button', false, null, undefined, 'ui-button--default')).toBe(
      'ui-button ui-button--default'
    )
  })
})
