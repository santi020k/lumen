import { describe, expect, test } from 'vitest'

import { resolveLumenSelectionState } from './selection-recipes.js'

describe('resolveLumenSelectionState', () => {
  test('preserves selection and enabled state', () => {
    expect(resolveLumenSelectionState(true, false)).toEqual({
      disabled: false,
      opacity: 1,
      selected: true
    })
  })

  test('dims disabled choices without changing selection', () => {
    expect(resolveLumenSelectionState(false, true)).toEqual({
      disabled: true,
      opacity: 0.52,
      selected: false
    })
  })
})
