/**
 * Maintainer-only tool: rebuilds maps/world-map.source.json from an official Natural Earth
 * "Admin 0 Countries" GeoJSON release. This is a one-time/occasional import step, separate
 * from `generate:world-map-data`, which regenerates core's SVG path data from the checked-in
 * canonical source below without needing the original Natural Earth download.
 *
 * Usage:
 *   node scripts/import-natural-earth-world-map.mjs --source /path/to/ne_50m_admin_0_countries.geojson
 *
 * Read the source with fs.readFileSync + JSON.parse: `require(...)` on a `.geojson` file
 * mistakenly tries to execute it as a CommonJS module.
 */
import { createHash } from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const outputPath = join(repoRoot, 'maps/world-map.source.json')
const SOURCE_URL = 'https://www.naturalearthdata.com/downloads/50m-cultural-vectors/50m-admin-0-countries/'
const LICENSE_URL = 'https://www.naturalearthdata.com/about/terms-of-use/'

/** Natural Earth admin0 features with no ISO 3166-1 code that are not kept as countries. */
const EXCLUDED_ADM0_A3 = new Map([
  ['ATA', 'Excluded for a familiar world-map extent that omits the polar cap; see maps/README.md.'],
  ['KAS', "Natural Earth 'Indeterminate' border-filler region (Siachen Glacier), not an administered country or territory."]
])

/** Natural Earth admin0 features with no ISO 3166-1 code, kept under a documented stable id. */
const NON_ISO_IDS = new Map([
  ['SOL', 'Somaliland has no ISO 3166-1 code; Natural Earth models it as a de facto territory distinct from Somalia.'],
  ['CYN', 'Northern Cyprus has no ISO 3166-1 code; Natural Earth models it as a de facto territory distinct from Cyprus.']
])

const parseArgs = argv => {
  const sourceFlagIndex = argv.indexOf('--source')

  if (sourceFlagIndex === -1 || !argv[sourceFlagIndex + 1]) {
    throw new Error('Usage: node scripts/import-natural-earth-world-map.mjs --source <path-to-geojson>')
  }

  return { sourcePath: resolve(argv[sourceFlagIndex + 1]) }
}

const resolveFeatureId = properties => {
  const { ADM0_A3: adm0A3, ISO_A2_EH: isoA2Eh } = properties

  if (EXCLUDED_ADM0_A3.has(adm0A3)) return { excludedReason: EXCLUDED_ADM0_A3.get(adm0A3), id: undefined }

  if (typeof isoA2Eh === 'string' && /^[A-Z]{2}$/.test(isoA2Eh)) return { id: isoA2Eh }

  if (NON_ISO_IDS.has(adm0A3)) return { id: adm0A3 }

  return { excludedReason: `No ISO 3166-1 code and no documented non-ISO id for ADM0_A3 "${adm0A3}".`, id: undefined }
}

const toPolygons = geometry => (geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates)
const roundCoordinate = value => Math.round(value * 1e5) / 1e5
const roundRing = ring => ring.map(([lon, lat]) => [roundCoordinate(lon), roundCoordinate(lat)])

const main = async () => {
  const { sourcePath } = parseArgs(process.argv.slice(2))
  const raw = await readFile(sourcePath, 'utf8')
  const sourceChecksumSha256 = createHash('sha256').update(raw).digest('hex')
  const geojson = JSON.parse(raw)

  if (geojson.type !== 'FeatureCollection' || !Array.isArray(geojson.features)) {
    throw new TypeError('Expected a GeoJSON FeatureCollection of admin-0 country features.')
  }

  const countriesById = new Map()
  const excluded = []
  const mergedIds = new Set()

  for (const feature of geojson.features) {
    const { properties } = feature
    const { excludedReason, id } = resolveFeatureId(properties)

    if (!id) {
      excluded.push({ id: properties.ADM0_A3, name: properties.NAME_LONG ?? properties.NAME, reason: excludedReason })

      continue
    }

    const polygons = toPolygons(feature.geometry).map(polygon => polygon.map(roundRing))
    const existing = countriesById.get(id)

    if (existing) {
      mergedIds.add(id)

      existing.polygons.push(...polygons)

      continue
    }

    countriesById.set(id, {
      id,
      label: [roundCoordinate(properties.LABEL_X), roundCoordinate(properties.LABEL_Y)],
      name: properties.NAME_LONG ?? properties.NAME,
      polygons
    })
  }

  const countries = [...countriesById.values()].sort((left, right) => left.id.localeCompare(right.id))

  const document = {
    countries,
    provenance: {
      excluded: excluded.sort((left, right) => left.id.localeCompare(right.id)),
      license: 'Public domain (no attribution required)',
      licenseUrl: LICENSE_URL,
      mergedIds: [...mergedIds].sort(),
      nonIsoIds: [...NON_ISO_IDS].map(([id, reason]) => ({ id, reason })),
      projection: 'equirectangular',
      retrievedAt: new Date().toISOString().slice(0, 10),
      source: 'Natural Earth 1:50m Cultural Vectors — Admin 0 Countries',
      sourceChecksumSha256,
      sourceUrl: SOURCE_URL
    }
  }

  await writeFile(outputPath, `${JSON.stringify(document)}\n`, 'utf8')

  process.stdout.write(
    `lumen-world-map-import: wrote ${countries.length} countries (${excluded.length} excluded) to ${outputPath.slice(repoRoot.length + 1)}\n`
  )
}

await main()
