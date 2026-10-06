import { expect, test } from 'vitest'

import {
  createLumenWorldMapSelectDetail,
  findLumenWorldMapCountry,
  LUMEN_WORLD_MAP_LATITUDE_BOUNDS,
  LUMEN_WORLD_MAP_VIEW_BOX,
  type LumenWorldMapCountryGeometry,
  normalizeLumenWorldMapCountries,
  normalizeLumenWorldMapHighlightedCountries,
  normalizeLumenWorldMapMarkers,
  projectLumenWorldMapCoordinate,
  resolveLumenWorldMapCountryLabel
} from './world-map.js'

const colombia: LumenWorldMapCountryGeometry = { id: 'CO', labelX: 300, labelY: 220, name: 'Colombia', path: 'M0 0Z' }
const japan: LumenWorldMapCountryGeometry = { id: 'JP', labelX: 820, labelY: 140, name: 'Japan', path: 'M1 1Z' }
const countries: LumenWorldMapCountryGeometry[] = [colombia, japan]

test('projects the origin and known bounds to the shared viewBox', () => {
  expect(projectLumenWorldMapCoordinate(-180, LUMEN_WORLD_MAP_LATITUDE_BOUNDS.max)).toEqual({ x: 0, y: 0 })

  expect(projectLumenWorldMapCoordinate(180, LUMEN_WORLD_MAP_LATITUDE_BOUNDS.min)).toEqual({
    x: LUMEN_WORLD_MAP_VIEW_BOX.width,
    y: LUMEN_WORLD_MAP_VIEW_BOX.height
  })

  expect(projectLumenWorldMapCoordinate(0, 0).x).toBeCloseTo(LUMEN_WORLD_MAP_VIEW_BOX.width / 2)
})

test.each([
  [NaN, 0],
  [0, NaN],
  [Infinity, 0],
  [0, -Infinity],
  [181, 0],
  [-181, 0],
  [0, 91],
  [0, -91]
])('rejects non-finite coordinates [%s, %s]', (longitude, latitude) => {
  expect(() => projectLumenWorldMapCoordinate(longitude, latitude)).toThrow(RangeError)
})

test('normalizes highlighted countries: trims, upper-cases, dedupes, and drops unknown ids', () => {
  expect(normalizeLumenWorldMapHighlightedCountries([' co ', 'jp', 'co', 'ZZ', '', 42], countries))
    .toEqual(['CO', 'JP'])

  expect(normalizeLumenWorldMapHighlightedCountries(undefined, countries)).toEqual([])

  expect(normalizeLumenWorldMapHighlightedCountries(null, countries)).toEqual([])

  expect(normalizeLumenWorldMapHighlightedCountries([], countries)).toEqual([])
})

test('normalizes markers: requires id/label and finite in-range coordinates, dedupes by id', () => {
  const markers = normalizeLumenWorldMapMarkers([
    { id: 'bogota', label: 'Bogotá', latitude: 4.711, longitude: -74.072 },
    { id: 'bogota', label: 'Duplicate', latitude: 0, longitude: 0 },
    { id: '', label: 'No id', latitude: 0, longitude: 0 },
    { id: 'no-label', label: '', latitude: 0, longitude: 0 },
    { id: 'bad-lat', label: 'Out of range', latitude: 95, longitude: 0 },
    { id: 'nan-lon', label: 'Not finite', latitude: 0, longitude: NaN }
  ])

  expect(markers).toEqual([{ id: 'bogota', label: 'Bogotá', latitude: 4.711, longitude: -74.072 }])

  expect(normalizeLumenWorldMapMarkers(undefined)).toEqual([])

  expect(normalizeLumenWorldMapMarkers(null)).toEqual([])
})

test('finds a country case-insensitively and returns undefined for unknown/invalid ids', () => {
  expect(findLumenWorldMapCountry(countries, 'co')).toBe(countries[0])

  expect(findLumenWorldMapCountry(countries, 'ZZ')).toBeUndefined()

  expect(findLumenWorldMapCountry(countries, '')).toBeUndefined()

  expect(findLumenWorldMapCountry(countries, undefined)).toBeUndefined()
})

test('resolves country labels with optional overrides, falling back to the dataset name', () => {
  expect(resolveLumenWorldMapCountryLabel(colombia)).toBe('Colombia')

  expect(resolveLumenWorldMapCountryLabel(colombia, { CO: 'Home base' })).toBe('Home base')

  expect(resolveLumenWorldMapCountryLabel(colombia, { CO: '   ' })).toBe('Colombia')
})

test('builds a select detail that separates selection from highlighted status', () => {
  const highlighted = new Set(['CO'])

  expect(createLumenWorldMapSelectDetail(colombia, highlighted)).toEqual({
    countryId: 'CO',
    highlighted: true,
    label: 'Colombia'
  })

  expect(createLumenWorldMapSelectDetail(japan, highlighted)).toEqual({
    countryId: 'JP',
    highlighted: false,
    label: 'Japan'
  })

  expect(createLumenWorldMapSelectDetail(colombia, highlighted, { CO: 'Home' }).label).toBe('Home')
})

test.each([undefined, null, {}, 42, 'CO'])('rejects non-array highlight and marker payloads: %s', payload => {
  expect(normalizeLumenWorldMapHighlightedCountries(payload, countries)).toEqual([])
  expect(normalizeLumenWorldMapMarkers(payload)).toEqual([])
})

test('drops malformed and out-of-frame markers without throwing', () => {
  expect(normalizeLumenWorldMapMarkers([
    null,
    1,
    'bad',
    { id: 'wrong-coordinate-type', label: 'Invalid', latitude: '0', longitude: 0 },
    { id: 'north-pole', label: 'Outside the view', latitude: 90, longitude: 0 },
    { id: 'south-pole', label: 'Outside the view', latitude: -90, longitude: 0 }
  ])).toEqual([])
})

test('normalizes untrusted geometry and drops incomplete or duplicated records', () => {
  expect(normalizeLumenWorldMapCountries(undefined)).toEqual([])
  expect(normalizeLumenWorldMapCountries([null,
    {},
    { ...colombia, id: ' co ' },
    colombia,
    { ...japan, labelX: NaN }])).toEqual([colombia])
})
