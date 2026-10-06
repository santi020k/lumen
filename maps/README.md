# World map data

Canonical, checked-in geography source for the Lumen `WorldMap` primitive. This directory holds
the compact country dataset; the generated SVG path data consumed at runtime lives in
[`packages/core/src/world-map-data.generated.ts`](../packages/core/src/world-map-data.generated.ts),
built from `world-map.source.json` by `pnpm run generate:world-map-data`.

## Files

- `world-map.source.json` — one checked-in JSON document: per-country id, English name, a
  representative label coordinate (`[longitude, latitude]`), and full-precision polygon rings
  (`[longitude, latitude]` pairs, rounded to 5 decimal places), plus a `provenance` block
  recording the exact source used to build it. Metadata unrelated to geometry, identity, or
  labeling (population, GDP, map colors, per-locale name variants, etc.) is stripped.
- `world-map.source.json` is regenerated only by re-running the import step below against a fresh
  Natural Earth release; it is not hand-edited.

## Provenance

| Field | Value |
| --- | --- |
| Source | Natural Earth 1:50m Cultural Vectors — Admin 0 Countries |
| Source URL | <https://www.naturalearthdata.com/downloads/50m-cultural-vectors/50m-admin-0-countries/> |
| Exact GeoJSON revision | [`ca96624a56bd078437bca8184e78163e5039ad19`](https://raw.githubusercontent.com/nvkelso/natural-earth-vector/ca96624a56bd078437bca8184e78163e5039ad19/geojson/ne_50m_admin_0_countries.geojson) |
| License | Public domain — no attribution required ([terms of use](https://www.naturalearthdata.com/about/terms-of-use/)) |
| Retrieved | 2026-10-06 |
| Source file SHA-256 | `3e458fc036ad0a66411f2c1e6cac49c5d7bfb81cb1123bc513b22511a2b7fdeb` |
| Countries retained | 238 |

The checksum is recorded so a future re-import can confirm whether the upstream release actually
changed before regenerating this dataset.

### Reproducing `world-map.source.json`

1. Download the pinned GeoJSON above to reproduce this dataset. For an intentional data update,
   select a newer official Natural Earth GeoJSON revision and record its URL and checksum here.
2. Run the importer against the downloaded GeoJSON:

   ```bash
   node scripts/import-natural-earth-world-map.mjs --source /path/to/ne_50m_admin_0_countries.geojson
   ```

   The importer reads the file with `fs.readFileSync` + `JSON.parse` — `require(...)` on a
   `.geojson` file mistakenly tries to execute it as CommonJS.
3. Review the diff. Commit `world-map.source.json` together with an updated `sourceChecksumSha256`
   / `retrievedAt` in its `provenance` block (written automatically by the importer) and this table.
4. Run `pnpm run generate:world-map-data` to refresh the generated core module, then
   `pnpm run check:world-map-data` to confirm it is reproducible.

## Identifiers

Country ids are ISO 3166-1 alpha-2 codes wherever Natural Earth's `ISO_A2_EH` field resolves to
one (the "extended, historical" variant, which correctly resolves cases the plain `ISO_A2` column
leaves as `-99`, such as France and Norway). Multiple Natural Earth admin-0 features that share the
same resolved id (for example Australia, the Indian Ocean Territories, and Ashmore and Cartier
Islands all resolve to `AU`) are merged into one multi-polygon country entry; this is geometry
assembly, not merging politically distinct countries.

Two features have no ISO 3166-1 code and no dependency relationship to merge into. They are kept
under a documented, stable non-ISO id instead of being dropped or assigned an incorrect code:

| Id | Name | Why non-ISO |
| --- | --- | --- |
| `SOL` | Somaliland | No ISO 3166-1 code; Natural Earth models it as a de facto territory distinct from Somalia. |
| `CYN` | Northern Cyprus | No ISO 3166-1 code; Natural Earth models it as a de facto territory distinct from Cyprus. |

Kosovo keeps the commonly used `XK` user-assigned code, resolved directly from `ISO_A2_EH`.

## Excluded features

| Id | Name | Reason |
| --- | --- | --- |
| `ATA` | Antarctica | Excluded for a familiar world-map extent that omits the polar cap. The shared viewBox's latitude band (`-60` to `84`) reflects this. |
| `KAS` | Siachen Glacier | Natural Earth's "Indeterminate" border-filler region for the Kashmir area, not an administered country or territory — not a travel destination and not meaningfully selectable on a country map. |

No geographic outline in this dataset is fabricated or hand-drawn: every retained country's path
traces Natural Earth's own polygon rings (projected and simplified; see below), and every exclusion
or non-ISO id above is deliberate and documented rather than silent.

## Projection and precision

- **Projection:** simple equirectangular, documented once in
  [`packages/core/src/world-map.ts`](../packages/core/src/world-map.ts)
  (`projectLumenWorldMapCoordinate`) and mirrored in
  [`scripts/lib/world-map-geometry.mjs`](../scripts/lib/world-map-geometry.mjs) for the build-time
  generator. Both country paths and consumer-supplied markers go through the same function and the
  same fixed viewBox, so a marker's `{ latitude, longitude }` always lines up with the country
  outline beneath it.
- **ViewBox:** `1000 × 400`, covering longitude `-180..180` and latitude `84..-60`.
- **Simplification and quantization:** `generate:world-map-data` runs an iterative Douglas-Peucker
  simplification on each projected ring (tolerance scaled down for small shapes, such as reefs and
  tiny islands, so they keep a visible outline instead of collapsing to a point) and
  quantizes coordinates to one decimal place in the shared viewBox's units, retaining four
  decimal places for rings smaller than one unit so tiny atolls retain nonzero area. This keeps the
  generated TypeScript module compact without storing full Natural Earth precision at runtime.
  Polygon holes and multipart islands are preserved; country paths use `fill-rule: evenodd` so
  holes render correctly regardless of ring winding direction after the latitude flip.
