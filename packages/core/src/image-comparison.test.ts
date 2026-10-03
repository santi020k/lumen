import { expect, test } from 'vitest'

import {
  formatLumenImageComparisonValue,
  normalizeLumenImageComparisonRatio,
  normalizeLumenImageComparisonValue
} from './image-comparison.js'

test.each([
  [undefined, 50],
  [null, 50],
  ['', 50],
  ['invalid', 50],
  [NaN, 50],
  [Infinity, 50],
  [-20, 0],
  [120, 100],
  [0, 0],
  [100, 100],
  [42.6, 43],
  ['25', 25]
])('normalizes comparison value %s to %s', (value, expected) => {
  expect(normalizeLumenImageComparisonValue(value)).toBe(expected)
})

test('accepts positive finite ratios and rejects invalid frame geometry', () => {
  for (const ratio of [0, -1, NaN, Infinity, null, '', '4/3']) {
    expect(normalizeLumenImageComparisonRatio(ratio)).toBe(16 / 9)
  }
  expect(normalizeLumenImageComparisonRatio(4 / 3)).toBe(4 / 3)
  expect(normalizeLumenImageComparisonRatio('1.5')).toBe(1.5)
})

test('formats caller-provided labels and falls back for malformed locales', () => {
  expect(formatLumenImageComparisonValue(50, 'Edited', 'en')).toBe('50% Edited')
  expect(formatLumenImageComparisonValue(100, 'Edited', 'es')).toContain('Edited')
  expect(formatLumenImageComparisonValue(150, 'Edited', '_')).toBe('100% Edited')
})
