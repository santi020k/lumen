import assert from 'node:assert/strict'
import test from 'node:test'

import { normalizeCoreSvgPathData } from './core-svg-path.mjs'

test('separates compact SVG arc flags for CoreSVG', () => {
  assert.equal(
    normalizeCoreSvgPathData(
      'M16.997 21a2 2 0 001.68-.92 15.25 15.25 0 000-16.16 2 2 0 00-1.68-.92z'
    ),
    'M16.997 21a2 2 0 0 0 1.68-.92 15.25 15.25 0 0 0 0-16.16 2 2 0 0 0 -1.68-.92z'
  )
})

test('preserves ordinary path formatting', () => {
  const pathData = 'M10 3a41 41 0 0 0 0 18h4.5L20 6z'

  assert.equal(normalizeCoreSvgPathData(pathData), pathData)
})

test('supports exponent notation without confusing it for a command', () => {
  const pathData = 'M1e-3 2E+2L4 5'

  assert.equal(normalizeCoreSvgPathData(pathData), pathData)
})

test('rejects malformed arc flags', () => {
  assert.throws(
    () => normalizeCoreSvgPathData('M0 0A1 1 0 2 0 3 3'),
    /Invalid SVG arc flag/
  )
})
