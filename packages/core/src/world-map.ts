/**
 * Shared, framework-agnostic contract for the WorldMap primitive: variant and marker types,
 * the equirectangular projection, and validation/normalization helpers used by every adapter.
 *
 * Country path geometry (the generated SVG data) is intentionally NOT exported from this module;
 * it lives in the explicit `@santi020k/lumen-core/world-map-data` subpath so consumers who do not
 * render a world map never pull the geometry payload into their bundle.
 */

export type LumenWorldMapVariant = 'dotted' | 'solid'

/** One resolved country's projected SVG path and label anchor. Produced by `generate:world-map-data`. */
export interface LumenWorldMapCountryGeometry {
  readonly id: string
  readonly labelX: number
  readonly labelY: number
  readonly name: string
  readonly path: string
}

/** A consumer-supplied point of interest, placed with the same projection as country paths. */
export interface LumenWorldMapMarker {
  readonly id: string
  readonly label: string
  readonly latitude: number
  readonly longitude: number
}

export interface LumenWorldMapSelectDetail {
  readonly countryId: string
  readonly highlighted: boolean
  readonly label: string
}

export interface LumenWorldMapViewBox {
  readonly height: number
  readonly width: number
}

export interface LumenWorldMapPoint {
  readonly x: number
  readonly y: number
}

/** Fixed SVG viewBox shared by every projected country path and marker. */
export const LUMEN_WORLD_MAP_VIEW_BOX: LumenWorldMapViewBox = Object.freeze({ height: 400, width: 1000 })

/**
 * Latitude band kept by the equirectangular projection. Antarctica is excluded from the dataset
 * for a familiar world-map extent; see maps/README.md for the documented rationale.
 */
export const LUMEN_WORLD_MAP_LATITUDE_BOUNDS = Object.freeze({ max: 84, min: -60 })

/**
 * Projects a [longitude, latitude] pair to the shared SVG viewBox using a simple equirectangular
 * projection. This is the single documented projection used to build country paths
 * (`generate:world-map-data`) and to place markers at render time; keep both in sync with
 * scripts/lib/world-map-geometry.mjs if either changes.
 */
export const projectLumenWorldMapCoordinate = (
  longitude: number,
  latitude: number
): LumenWorldMapPoint => {
  if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) {
    throw new RangeError(`Expected a finite [longitude, latitude] pair, received [${longitude}, ${latitude}].`)
  }

  if (longitude < -180 || longitude > 180 || latitude < -90 || latitude > 90) {
    throw new RangeError('Longitude must be between -180 and 180 and latitude between -90 and 90.')
  }

  const { max: latitudeMax, min: latitudeMin } = LUMEN_WORLD_MAP_LATITUDE_BOUNDS
  const { height, width } = LUMEN_WORLD_MAP_VIEW_BOX

  return {
    x: ((longitude + 180) / 360) * width,
    y: ((latitudeMax - latitude) / (latitudeMax - latitudeMin)) * height
  }
}

const isPlainString = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0
const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value)
const finiteNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value)

const parseCountry = (value: unknown): LumenWorldMapCountryGeometry | undefined => {
  if (!isRecord(value)) return undefined

  const { id, labelX, labelY, name, path } = value

  if (typeof id !== 'string' || typeof name !== 'string') return undefined

  if (!isPlainString(path)) return undefined

  if (!finiteNumber(labelX) || !finiteNumber(labelY)) return undefined

  if (!id.trim() || !name.trim()) return undefined

  return { id: id.trim().toUpperCase(), labelX, labelY, name, path }
}

export const normalizeLumenWorldMapCountries = (value: unknown): LumenWorldMapCountryGeometry[] => {
  if (!Array.isArray(value)) return []

  const candidates: readonly unknown[] = value
  const result: LumenWorldMapCountryGeometry[] = []
  const ids = new Set<string>()

  for (const candidate of candidates) {
    const country = parseCountry(candidate)

    if (!country || ids.has(country.id)) continue

    ids.add(country.id)

    result.push(country)
  }

  return result
}

/**
 * Trims, upper-cases, deduplicates, and drops highlighted country ids that are not present in
 * `countries`. Invalid entries (wrong type, blank, unknown, duplicate) are silently dropped so a
 * typo in application data degrades gracefully instead of breaking the map.
 */
export const normalizeLumenWorldMapHighlightedCountries = (
  highlighted: unknown,
  countries: readonly LumenWorldMapCountryGeometry[]
): string[] => {
  if (!Array.isArray(highlighted)) return []

  const candidates: readonly unknown[] = highlighted
  const knownIds = new Set(countries.map(country => country.id))
  const seen = new Set<string>()
  const result: string[] = []

  for (const raw of candidates) {
    if (!isPlainString(raw)) continue

    const id = raw.trim().toUpperCase()

    if (seen.has(id) || !knownIds.has(id)) continue

    seen.add(id)

    result.push(id)
  }

  return result
}

const isValidLatitude = (latitude: number): boolean => {
  const { max, min } = LUMEN_WORLD_MAP_LATITUDE_BOUNDS

  return latitude >= min && latitude <= max
}

const isValidLongitude = (longitude: number): boolean => longitude >= -180 && longitude <= 180

/** Parses one candidate marker, or returns undefined if it fails any validation rule. */
const parseLumenWorldMapMarker = (
  marker: unknown
): LumenWorldMapMarker | undefined => {
  if (!isRecord(marker) || !isPlainString(marker.id) || !isPlainString(marker.label)) return undefined

  const { latitude, longitude } = marker

  if (typeof latitude !== 'number' || typeof longitude !== 'number') return undefined

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return undefined

  if (!isValidLatitude(latitude) || !isValidLongitude(longitude)) return undefined

  return { id: marker.id.trim(), label: marker.label.trim(), latitude, longitude }
}

/**
 * Validates consumer-supplied markers: requires a non-blank id/label, finite latitude/longitude
 * within the visible latitude band, and drops duplicate ids. Invalid markers are dropped rather than throwing.
 */
export const normalizeLumenWorldMapMarkers = (
  markers: unknown
): LumenWorldMapMarker[] => {
  if (!Array.isArray(markers)) return []

  const candidates: readonly unknown[] = markers
  const seen = new Set<string>()
  const result: LumenWorldMapMarker[] = []

  for (const candidate of candidates) {
    const marker = parseLumenWorldMapMarker(candidate)

    if (!marker || seen.has(marker.id)) continue

    seen.add(marker.id)

    result.push(marker)
  }

  return result
}

export const findLumenWorldMapCountry = (
  countries: readonly LumenWorldMapCountryGeometry[],
  countryId: string | null | undefined
): LumenWorldMapCountryGeometry | undefined => {
  if (!isPlainString(countryId)) return undefined

  const id = countryId.trim().toUpperCase()

  return countries.find(country => country.id === id)
}

/** Resolves a country's display label, honoring a consumer-supplied override keyed by country id. */
export const resolveLumenWorldMapCountryLabel = (
  country: LumenWorldMapCountryGeometry,
  labelOverrides?: Readonly<Record<string, string>> | null
): string => {
  const override = labelOverrides?.[country.id]

  return isPlainString(override) ? override.trim() : country.name
}

export const createLumenWorldMapSelectDetail = (
  country: LumenWorldMapCountryGeometry,
  highlightedIds: ReadonlySet<string>,
  labelOverrides?: Readonly<Record<string, string>> | null
): LumenWorldMapSelectDetail => ({
  countryId: country.id,
  highlighted: highlightedIds.has(country.id),
  label: resolveLumenWorldMapCountryLabel(country, labelOverrides)
})
