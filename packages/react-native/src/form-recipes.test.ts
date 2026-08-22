import { describe, expect, test } from 'vitest'

import { resolveLumenSearchFieldState } from './form-recipes.js'

describe('Lumen React Native form component recipes', () => {
  test('shows the clear action only for editable non-empty queries', () => {
    expect(resolveLumenSearchFieldState('lumen', true)).toEqual({
      opacity: 1,
      showClearAction: true
    })
    expect(resolveLumenSearchFieldState('', true).showClearAction).toBe(false)
    expect(resolveLumenSearchFieldState('lumen', false)).toEqual({
      opacity: 0.52,
      showClearAction: false
    })
  })
})
