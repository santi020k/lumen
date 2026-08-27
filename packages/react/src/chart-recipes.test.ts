import { describe, expect, test } from 'vitest'

import { formatReactChartTableValue } from './chart-recipes.js'

describe('React chart recipes', () => {
  test('keeps non-finite values away from table formatters', () => {
    const formatValue = (value: number): string => {
      if (!Number.isFinite(value)) throw new Error('Expected only finite chart values')

      return String(value)
    }

    expect(formatReactChartTableValue(4, formatValue)).toBe('4')
    expect(formatReactChartTableValue(Number.NaN, formatValue)).toBe('Not available')
    expect(formatReactChartTableValue(Number.POSITIVE_INFINITY, formatValue)).toBe('Not available')
  })
})
