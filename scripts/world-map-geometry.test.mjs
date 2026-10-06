import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import {
  projectLonLat,
  projectRing,
  quantize,
  ringsToPathData,
  simplifyPoints,
  WORLD_MAP_LAT_BOUNDS,
  WORLD_MAP_VIEW_BOX
} from './lib/world-map-geometry.mjs'

test('projects known bounds to the shared viewBox corners', () => {
  assert.deepEqual(projectLonLat(-180, WORLD_MAP_LAT_BOUNDS.max), { x: 0, y: 0 })

  assert.deepEqual(projectLonLat(180, WORLD_MAP_LAT_BOUNDS.min), {
    x: WORLD_MAP_VIEW_BOX.width,
    y: WORLD_MAP_VIEW_BOX.height
  })
})

test('rejects non-finite longitude/latitude', () => {
  assert.throws(() => projectLonLat(NaN, 0), TypeError)

  assert.throws(() => projectLonLat(0, Infinity), TypeError)
})

test('quantizes to the requested decimal precision', () => {
  assert.equal(quantize(1.23456, 2), 1.23)

  assert.equal(quantize(-1.005, 2), -1)
})

test('Douglas-Peucker simplification keeps endpoints and collapses a near-straight line', () => {
  const points = [{ x: 0, y: 0 }, { x: 1, y: 0.01 }, { x: 2, y: -0.01 }, { x: 10, y: 0 }]
  const simplified = simplifyPoints(points, 1)

  assert.deepEqual(simplified, [points[0], points.at(-1)])
})

test('simplification preserves a genuine corner above tolerance', () => {
  const points = [{ x: 0, y: 0 }, { x: 5, y: 5 }, { x: 10, y: 0 }]

  assert.equal(simplifyPoints(points, 0.1).length, 3)
})

test('projectRing scales tolerance to a tiny ring so a small island keeps a visible outline', () => {
  const tinyIslandRing = [
    [-61.8, 17.2], [-61.79, 17.21], [-61.78, 17.2], [-61.79, 17.18], [-61.8, 17.19], [-61.8, 17.2]
  ]

  const projected = projectRing(tinyIslandRing, { decimals: 1, tolerance: 0.75 })

  assert.ok(projected.length >= 3, 'expected the tiny ring to keep at least 3 points')
})

test('builds a single-ring path and a multi-ring path with holes', () => {
  const ring = [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 10 }]

  assert.equal(ringsToPathData([ring]), 'M0 0L10 0L10 10Z')

  const hole = [{ x: 2, y: 2 }, { x: 8, y: 2 }, { x: 8, y: 8 }]

  assert.equal(ringsToPathData([ring, hole]), 'M0 0L10 0L10 10ZM2 2L8 2L8 8Z')

  assert.equal(ringsToPathData([[{ x: 0, y: 0 }, { x: 1, y: 1 }]]), '')
})

const polygonArea = points => Math.abs(points.reduce((sum, point, index) => {
  const next = points[(index + 1) % points.length]

  return sum + point.x * next.y - next.x * point.y
}, 0) / 2)

test('every packaged country retains a nonzero outline after simplification and rounding', async () => {
  const source = JSON.parse(await readFile(new URL('../maps/world-map.source.json', import.meta.url), 'utf8'))

  for (const country of source.countries) {
    const hasOutline = country.polygons.some(polygon => polygonArea(projectRing(polygon[0], {
      decimals: 1,
      tolerance: 0.75
    })) > 0)

    assert.ok(hasOutline, `${country.id} must remain visible, including small island countries`)
  }
})
