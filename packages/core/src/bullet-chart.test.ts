import { expect, test } from 'vitest'

import { createLumenBulletGeometry } from './bullet-chart.js'

test('bullet charts align actual values, targets, and ordered ranges on one scale', () => {
  const ranges = [{ end: 100, label: 'Strong' }, { end: 60, label: 'Developing' }, { end: 80, label: 'Steady' }]
  const model = createLumenBulletGeometry(72, 85, { ranges })

  expect(model.valid).toBe(true)
  expect(model.domain).toEqual({ min: 0, max: 100 })
  expect(model.valueWidthRatio).toBe(0.72)
  expect(model.targetRatio).toBe(0.85)
  expect(model.ranges.map(range => [range.start, range.end])).toEqual([[0, 60], [60, 80], [80, 100]])
  expect(ranges[0]?.end).toBe(100)
})

test('bullet charts distinguish missing values from zero and keep signed baselines', () => {
  const missing = createLumenBulletGeometry(null, 80)
  const zero = createLumenBulletGeometry(0, 80)
  const signed = createLumenBulletGeometry(-20, 40, { domain: { min: -40, max: 60 } })

  expect(missing.valid).toBe(true)
  expect(missing.value).toBeNull()
  expect(zero.value).toBe(0)
  expect(zero.valueWidthRatio).toBe(0)
  expect(signed.valid).toBe(true)
  expect(signed.valueStartRatio).toBe(0.2)
  expect(signed.valueWidthRatio).toBe(0.2)
  expect(signed.targetRatio).toBe(0.8)
})

test('bullet charts reject invalid measurements, truncated baselines, and ambiguous ranges', () => {
  const models = [
    createLumenBulletGeometry(NaN, 80),
    createLumenBulletGeometry(20, Infinity),
    createLumenBulletGeometry(120, 80, { domain: { min: 0, max: 100 } }),
    createLumenBulletGeometry(70, 80, { domain: { min: 50, max: 100 } }),
    createLumenBulletGeometry(70, 80, { domain: { min: 100, max: 0 } }),
    createLumenBulletGeometry(70, 80, { ranges: [{ end: 60, label: 'A' }, { end: 60, label: 'B' }] }),
    createLumenBulletGeometry(70, 80, { ranges: [{ end: 60, label: ' ' }] })
  ]

  for (const model of models) {
    expect(model.valid).toBe(false)
    expect(model.ranges).toEqual([])
    expect(model.ticks).toEqual([])
  }
})

test('bullet charts retain finite positions at numeric extremes and an all-zero scale', () => {
  const extreme = createLumenBulletGeometry(-Number.MAX_VALUE, Number.MAX_VALUE)

  expect(extreme.valid).toBe(true)
  expect(extreme.valueStartRatio).toBe(0)
  expect(extreme.valueWidthRatio).toBe(0.5)
  expect(extreme.targetRatio).toBe(1)
  expect(extreme.ticks.map(tick => tick.position)).toEqual([0, 0.5, 1])
  expect(createLumenBulletGeometry(0, 0).domain).toEqual({ min: 0, max: 1 })
})
