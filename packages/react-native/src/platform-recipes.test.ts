import { describe, expect, test } from 'vitest'

import {
  createLumenNavigationVisibilityState,
  resolveLumenNavigationAction,
  resolveLumenNavigationBadge,
  resolveLumenNavigationItemState,
  resolveLumenNavigationVisibility,
  resolveLumenRefreshColors
} from './platform-recipes.js'
import { lumenDarkTheme, lumenLightTheme } from './theme.js'

describe('React Native platform recipes', () => {
  test('maps refresh indicators to semantic theme colors', () => {
    expect(resolveLumenRefreshColors(lumenLightTheme.colors, 'brand')).toEqual({
      indicator: lumenLightTheme.colors.brand,
      surface: lumenLightTheme.colors.surface,
      title: lumenLightTheme.colors.inkMuted
    })
    expect(
      resolveLumenRefreshColors(lumenDarkTheme.colors, 'accent').indicator
    ).toBe(lumenDarkTheme.colors.accent)
    expect(
      resolveLumenRefreshColors(lumenDarkTheme.colors, 'neutral').indicator
    ).toBe(lumenDarkTheme.colors.inkSoft)
  })

  test('resolves selected and disabled destination states', () => {
    expect(
      resolveLumenNavigationItemState(
        lumenLightTheme.colors,
        'home',
        'home',
        false,
        false
      )
    ).toEqual({
      color: lumenLightTheme.colors.brand,
      opacity: 1,
      selected: true
    })
    expect(
      resolveLumenNavigationItemState(
        lumenDarkTheme.colors,
        'search',
        'home',
        true,
        true
      )
    ).toEqual({
      color: lumenDarkTheme.colors.inkMuted,
      opacity: 0.52,
      selected: false
    })
  })

  test('resolves dot, text, and capped count navigation badges', () => {
    expect(resolveLumenNavigationBadge(true)).toEqual({
      accessibilityLabel: 'New activity'
    })
    expect(resolveLumenNavigationBadge('Live')).toEqual({
      accessibilityLabel: 'Live',
      displayValue: 'Live'
    })
    expect(resolveLumenNavigationBadge(128)).toEqual({
      accessibilityLabel: '128 new items',
      displayValue: '99+'
    })
    expect(resolveLumenNavigationBadge(Number.NaN)).toBeUndefined()
  })

  test('distinguishes destination selection from re-selection', () => {
    expect(resolveLumenNavigationAction('home', 'search', true)).toBe('select')
    expect(resolveLumenNavigationAction('home', 'home', false)).toBe('select')
    expect(resolveLumenNavigationAction('home', 'home', true)).toBe('reselect')
  })

  test('hides and reveals navigation after deliberate directional travel', () => {
    let state = createLumenNavigationVisibilityState()

    state = resolveLumenNavigationVisibility(state, 8)
    expect(state.visible).toBe(true)
    state = resolveLumenNavigationVisibility(state, 16)
    expect(state.visible).toBe(false)

    state = resolveLumenNavigationVisibility(state, 12)
    state = resolveLumenNavigationVisibility(state, 17)
    state = resolveLumenNavigationVisibility(state, 1)
    expect(state.visible).toBe(true)
  })

  test('reveals navigation at the top and ignores invalid offsets', () => {
    const hidden = createLumenNavigationVisibilityState(false)
    const invalid = resolveLumenNavigationVisibility(hidden, Number.NaN)

    expect(invalid).toBe(hidden)
    expect(resolveLumenNavigationVisibility(hidden, -12)).toEqual({
      accumulatedDelta: 0,
      offset: 0,
      visible: true
    })
  })
})
