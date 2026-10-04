import { describe, expect, test } from 'vitest'

import {
  resolveLumenRangeValue,
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

describe('native numeric intervals', () => {
  test('normalizes unordered, out-of-range and nonfinite endpoints without mutating input', () => {
    const input = [80, 20] as const
    expect(resolveLumenRangeValue(input, 0, 100, 10)).toEqual([20, 80])
    expect(input).toEqual([80, 20])
    expect(resolveLumenRangeValue([-20, 120], 0, 100)).toEqual([0, 100])
    expect(resolveLumenRangeValue([Number.NaN, Number.POSITIVE_INFINITY], 0, 100)).toEqual([0, 100])
    expect(resolveLumenRangeValue([30, 30], 0, 100, 10)).toEqual([30, 30])
  })

  test('retains the domain step grid and nonzero origin', () => {
    expect(resolveLumenRangeValue([24, 76], 0, 100, 10)).toEqual([20, 80])
    expect(resolveLumenRangeValue([25, 96], 5, 96, 10)).toEqual([25, 95])
    expect(resolveLumenRangeValue([0.2, 0.8], 0, 1, 10)).toEqual([0, 1])
  })

  test('rejects unusable domains and steps before rendering', () => {
    const domains = [
      [1, 1],
      [2, 1],
      [Number.NaN, 1],
      [0, Number.POSITIVE_INFINITY],
      [-Number.MAX_VALUE, Number.MAX_VALUE],
      [0, Number.MIN_VALUE]
    ]

    for (const [min, max] of domains) {
      if (min === undefined || max === undefined) throw new Error('Missing bounds fixture')
      expect(() => resolveLumenRangeValue([0, 1], min, max)).toThrow(RangeError)
    }
    for (const step of [0, -1, Number.NaN, Number.POSITIVE_INFINITY, Number.MIN_VALUE]) {
      expect(() => resolveLumenRangeValue([0, 100], 0, 100, step)).toThrow(RangeError)
    }
  })
})
