/**
 * Dependency-free geometry helpers shared by the world map import and generate scripts.
 *
 * Projection: simple equirectangular, cropped to a fixed latitude band that excludes
 * Antarctica (see maps/README.md for the documented extent). This is the same formula
 * documented in packages/core/src/world-map.ts; keep both in sync if either changes.
 */

export const WORLD_MAP_VIEW_BOX = Object.freeze({ height: 400, width: 1000 })

export const WORLD_MAP_LAT_BOUNDS = Object.freeze({ max: 84, min: -60 })

export const projectLonLat = (lon, lat) => {
  if (!Number.isFinite(lon) || !Number.isFinite(lat)) {
    throw new TypeError(`Expected finite [lon, lat], received [${lon}, ${lat}].`)
  }

  const { max: latMax, min: latMin } = WORLD_MAP_LAT_BOUNDS
  const { height, width } = WORLD_MAP_VIEW_BOX
  const x = ((lon + 180) / 360) * width
  const y = ((latMax - lat) / (latMax - latMin)) * height

  return { x, y }
}

export const quantize = (value, decimals) => {
  const factor = 10 ** decimals

  return Math.round(value * factor) / factor
}

const pointLineDistance = (point, start, end) => {
  const dx = end.x - start.x
  const dy = end.y - start.y

  if (dx === 0 && dy === 0) return Math.hypot(point.x - start.x, point.y - start.y)

  const t = ((point.x - start.x) * dx + (point.y - start.y) * dy) / (dx * dx + dy * dy)
  const clampedT = Math.min(1, Math.max(0, t))
  const projectedX = start.x + clampedT * dx
  const projectedY = start.y + clampedT * dy

  return Math.hypot(point.x - projectedX, point.y - projectedY)
}

/** Iterative Douglas-Peucker simplification; avoids recursion depth limits on long rings. */
export const simplifyPoints = (points, tolerance) => {
  if (points.length <= 2 || tolerance <= 0) return points

  const keep = new Uint8Array(points.length)

  keep[0] = 1

  keep[points.length - 1] = 1

  const stack = [[0, points.length - 1]]

  while (stack.length > 0) {
    const [startIndex, endIndex] = stack.pop()

    if (endIndex - startIndex < 2) continue

    let maxDistance = -1
    let maxIndex = -1

    for (let index = startIndex + 1; index < endIndex; index += 1) {
      const distance = pointLineDistance(points[index], points[startIndex], points[endIndex])

      if (distance > maxDistance) {
        maxDistance = distance

        maxIndex = index
      }
    }

    if (maxDistance > tolerance) {
      keep[maxIndex] = 1

      stack.push([startIndex, maxIndex], [maxIndex, endIndex])
    }
  }

  return points.filter((_, index) => keep[index] === 1)
}

const ringExtent = points => {
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity

  for (const point of points) {
    if (point.x < minX) minX = point.x

    if (point.x > maxX) maxX = point.x

    if (point.y < minY) minY = point.y

    if (point.y > maxY) maxY = point.y
  }

  return Math.max(maxX - minX, maxY - minY)
}

/**
 * Scales the simplification tolerance down for small shapes (reefs, tiny islands) so a ring
 * never collapses below a visible outline just because it is physically small on
 * the shared 1000x400 viewBox.
 */
const effectiveTolerance = (points, tolerance) => Math.min(tolerance, ringExtent(points) / 10)

export const projectRing = (ring, { decimals = 2, tolerance = 0 } = {}) => {
  const projected = ring.map(([lon, lat]) => projectLonLat(lon, lat))

  const simplified = tolerance > 0 ?
    simplifyPoints(projected, effectiveTolerance(projected, tolerance)) :
    projected

  // A fixed tenth-unit grid erases atolls such as Tuvalu. Preserve their actual
  // outline with finer coordinates rather than replacing it with a made-up shape.
  const precision = ringExtent(projected) < 1 ? Math.max(decimals, 4) : decimals

  return simplified.map(point => ({
    x: quantize(point.x, precision),
    y: quantize(point.y, precision)
  }))
}

/** Builds an SVG path `d` string for one or more polygon rings (exterior + holes). */
export const ringsToPathData = rings => rings
  .filter(ring => ring.length >= 3)
  .map(ring => {
    const [first, ...rest] = ring

    return `M${first.x} ${first.y}${rest.map(point => `L${point.x} ${point.y}`).join('')}Z`
  })
  .join('')
