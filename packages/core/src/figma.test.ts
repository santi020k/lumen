import { expect, test } from 'vitest'

import { hslTokenToFigmaColor, hslTokenToHexColor } from './figma.js'

test.each([
  'Infinity 50% 50%',
  '-Infinity 50% 50%',
  '220 Infinity 50%',
  '220 50% -Infinity',
  '1e309 50% 50%',
  '220 50% 50% / Infinity',
  '220 50% 50% / -Infinity',
  '220 50% 50% / NaN',
  '220 50% 50% / invalid',
  '220 50% 50% / ',
  '220 50% 50% / 0.5 / 1',
  '220 50% 50% / 0.5 /',
  '220 50% 50% extra',
  '220 50%',
  '220 5%0 50%',
  '220 50%% 50%',
  '220% 50% 50%',
  '0xff 50% 50%',
  ''
])('rejects malformed HSL export input %j with its parsing error', value => {
  const error = new Error(`Expected an HSL token value, received "${value}".`)

  expect(() => hslTokenToHexColor(value)).toThrow(error)
  expect(() => hslTokenToFigmaColor(value)).toThrow(error)
})

test('rejects adversarial-length malformed numeric channels', () => {
  const value = `${'1'.repeat(100_000)}x 50% 50%`

  expect(() => hslTokenToHexColor(value)).toThrow('Expected an HSL token value')
  expect(() => hslTokenToFigmaColor(value)).toThrow('Expected an HSL token value')
})

test.each([
  ['0 0% 100% / 0.55', '#ffffff8c', 0.55],
  ['  -120 100% 50% / .5  ', '#0000ff80', 0.5],
  ['480 100 50', '#00ff00', 1],
  ['0 150% 50% / 2', '#ff0000', 1],
  ['0 -50% 150% / -1', '#ffffff00', 0],
  ['0 100% -50%', '#000000', 1],
  ['+1.2e2 1e2% 5e1% / 5e-1', '#00ff0080', 0.5]
] as const)('preserves valid HSL wrapping, clamping and opacity for %j', (value, hex, alpha) => {
  expect(hslTokenToHexColor(value)).toBe(hex)
  const color = hslTokenToFigmaColor(value)

  expect(color.a).toBe(alpha)
  for (const channel of [color.r, color.g, color.b]) {
    expect(Number.isFinite(channel)).toBe(true)
    expect(channel).toBeGreaterThanOrEqual(0)
    expect(channel).toBeLessThanOrEqual(1)
  }
})
