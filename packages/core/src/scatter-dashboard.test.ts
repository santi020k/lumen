import { describe, expect, test } from 'vitest'

import { createLumenScatterGeometry, createLumenScatterReferences, getLumenScatterXTicks } from './charts.js'

const series = [{ id: 'reach', label: 'Reach', data: [{ x: 1, y: 0 }, { x: 10, y: 5 }, { x: 100, y: 10 }, { x: 0, y: 2 }, { x: -1, y: 4 }, { x: 3, y: null }] }]

describe('scatter dashboard geometry', () => {
  test('plots logarithmic reach without changing the underlying data or missing values', () => {
    const geometry = createLumenScatterGeometry(series, { xScale: 'log', xDomain: { min: 1, max: 100 }, domain: { min: 0, max: 10 } })

    expect(geometry.points).toHaveLength(3)
    expect(geometry.points.map(point => point.x)).toEqual([1, 10, 100])
    expect(geometry.points.map(point => point.xCoordinate)).toEqual([44, 320, 596])
    expect(getLumenScatterXTicks(geometry.xDomain, 'log')).toEqual([1, Math.sqrt(10), 10, 10 ** 1.5, 100])
  })
  test('rejects impossible domains and keeps empty log charts finite', () => {
    expect(() => createLumenScatterGeometry(series, { xScale: 'log', xDomain: { min: 0 } })).toThrow(RangeError)
    expect(() => createLumenScatterGeometry(series, { xDomain: { min: 10, max: 1 } })).toThrow(RangeError)
    expect(createLumenScatterGeometry([], { xScale: 'log' }).xDomain).toEqual({ min: 1, max: 10 })
    expect(createLumenScatterGeometry([]).xDomain).toEqual({ min: 0, max: 1 })
    expect(() => createLumenScatterGeometry(series, { domain: { min: 5, max: 1 } })).toThrow(RangeError)
  })
  test('projects lines and regions in the same domain as the plotted points', () => {
    const geometry = createLumenScatterGeometry(series, { xScale: 'log', xDomain: { min: 1, max: 100 }, domain: { min: 0, max: 10 } })
    const references = createLumenScatterReferences([
      { id: 'reach', label: 'Reach threshold', x: 10 },
      { id: 'target', label: 'Target region', x: 10, xEnd: 100, y: 5, yEnd: 10 },
      { id: 'invalid', label: 'Invalid log reference', x: 0 }
    ], geometry, 'log')

    expect(references).toHaveLength(2)
    expect(references[0]).toMatchObject({ x1: 320, x2: 320, region: false })
    expect(references[1]).toMatchObject({ x1: 320, x2: 596, y1: 160, y2: 44, region: true })
  })
})
