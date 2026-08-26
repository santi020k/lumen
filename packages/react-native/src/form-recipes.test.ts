import { describe, expect, test } from 'vitest'

import {
  clampLumenDate,
  resolveLumenDateBounds,
  resolveLumenDatePickerValue,
  resolveLumenDateRangeEndChange,
  resolveLumenDateRangeStartChange,
  resolveLumenSearchFieldState
} from './form-recipes.js'

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

  test('normalizes and clamps picker dates to inclusive bounds', () => {
    const minimum = new Date(2026, 7, 10)
    const maximum = new Date(2026, 7, 20)

    expect(clampLumenDate(new Date(2026, 7, 5, 18), minimum, maximum)).toEqual(minimum)
    expect(clampLumenDate(new Date(2026, 7, 15, 18), minimum, maximum)).toEqual(new Date(2026, 7, 15))
    expect(resolveLumenDatePickerValue(null, minimum, maximum, new Date(2026, 7, 25))).toEqual(maximum)
    expect(resolveLumenDateBounds(maximum, minimum)).toEqual({
      maximumDate: maximum,
      minimumDate: maximum
    })
  })

  test('keeps a controlled date range ordered as either boundary changes', () => {
    const initial = {
      end: new Date(2026, 7, 12),
      start: new Date(2026, 7, 10)
    }
    const movedStart = resolveLumenDateRangeStartChange(initial, new Date(2026, 7, 15))

    expect(movedStart).toEqual({
      end: new Date(2026, 7, 15),
      start: new Date(2026, 7, 15)
    })
    expect(resolveLumenDateRangeEndChange(movedStart, new Date(2026, 7, 8))).toEqual(movedStart)
  })
})
