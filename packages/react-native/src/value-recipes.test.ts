import { describe, expect, test } from 'vitest'

import {
  resolveLumenSliderPosition,
  resolveLumenSliderValue,
  stepLumenSliderValue
} from './value-recipes.js'

describe('Lumen React Native value recipes', () => {
  test('clamps and snaps slider values to a finite range', () => {
    expect(resolveLumenSliderValue(48, 0, 100, 10)).toEqual({
      max: 100,
      min: 0,
      percentage: 50,
      step: 10,
      value: 50
    })
    expect(resolveLumenSliderValue(Number.POSITIVE_INFINITY, 20, 10)).toMatchObject({
      max: 120,
      min: 20,
      value: 20
    })
  })

  test('maps pointer positions through the same step contract', () => {
    const value = resolveLumenSliderValue(0, 0, 100, 25)

    expect(resolveLumenSliderPosition(74, 100, value)).toBe(75)
    expect(resolveLumenSliderPosition(-20, 100, value)).toBe(0)
    expect(resolveLumenSliderPosition(140, 100, value)).toBe(100)
  })

  test('supports bounded assistive-technology increments', () => {
    const value = resolveLumenSliderValue(90, 0, 100, 10)

    expect(stepLumenSliderValue(value, 'increment')).toBe(100)
    expect(stepLumenSliderValue(value, 'decrement')).toBe(80)
    expect(stepLumenSliderValue(resolveLumenSliderValue(100, 0, 100, 10), 'increment')).toBe(100)
  })
})
