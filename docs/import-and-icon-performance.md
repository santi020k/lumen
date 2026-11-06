# Import and icon performance

Use the repeatable local measurements before changing Lumen's import guidance or generating icon
subsets:

```bash
pnpm run measure:imports
pnpm run measure:react-icons
pnpm run measure:react-server
pnpm run measure:elements-registration
pnpm run measure:selective-imports
pnpm run measure:route-delivery
pnpm run check:route-delivery
```

The Astro and React commands default to three builds per scenario and report median wall time,
output bytes, and their raw samples as JSON. Set `LUMEN_BENCHMARK_ITERATIONS` to increase the sample
count. The Elements command builds the package once and compares complete-catalog registration with
an explicit Card, Input, and Button set through the same minified browser bundler.

## Packed subscribe-form quick start

Run `pnpm run measure:subscribe-form` with Chromium installed. The fixture extracts the React and
Elements examples directly from the root README, installs packed Lumen packages, and builds each
example twice with Vite. Only the imports change between the catalog and granular cases. Each run
opens a cold browser page, fills the email control and records requested JS and CSS response bodies.
Gzip totals compress each response locally at level 9; React totals include React and React DOM.

| Adapter | Traversed modules, catalog → granular | Requested JS + CSS gzip, catalog → granular |
| --- | ---: | ---: |
| React | 2,364 → 35 | 66,564 → 66,564 B |
| Elements | 2,217 → 22 | 509,741 → 14,110 B |

These November 6, 2026 measurements use candidate fce87932. The React fixture also includes Field, FieldError and Checkbox. These are development measurements on packed candidates. React's improvement is in the build graph.
Both Elements costs fell. The fixture checks for an unexpected catalog import and compares the module
counts on every run. Granular builds allow 45 modules and 75,000 gzip bytes for React or 20,000 for
Elements. Actual route requests on a consumer app depend on its bundler and shared chunks.

## November 5, 2026 Astro route delivery

The modular candidate (`b328b53f`) is measured against published v4.4.0 (`fc264ae2`) using the same six cold
Chromium routes, Node 22.23.4, pnpm 12.8.1, and Astro 7.3.5. Each row sums requested assets,
compressed individually with gzip level 9. CSS inlining is disabled so the stylesheet totals include
all styles. These are local fixture bytes, not production traffic or measured network transfer.

| Route | v4 JS gzip | v5 JS gzip | v4 CSS gzip | v5 CSS gzip |
| --- | ---: | ---: | ---: | ---: |
| Static Card/Button, no runtime | 0 B | 0 B | 35,620 B | 7,025 B |
| Static Card/Button, root runtime | 35,300 B | 4,763 B | 36,026 B | 7,472 B |
| Dialog | 35,985 B | 5,448 B | 36,026 B | 8,705 B |
| CodeTabs with scroll cues | 35,300 B | 9,638 B | 36,026 B | 8,071 B |
| Form, Field, Input, Select | 35,300 B | 8,734 B | 36,026 B | 6,501 B |
| Calendar | 35,300 B | 8,768 B | 36,026 B | 6,132 B |

No additional assets were requested during the measured first interaction. Simple routes contain no
phone, map, rich-text, or scheduler controller. Dynamic toasts separately load their controller and
stylesheet when first requested, including when the initial page has no toast markup.

`measure:route-delivery` defaults to selective CSS and writes `.cache/route-delivery/candidate/report.json`.
Use `LUMEN_DELIVERY_CSS=full` for full-catalog setup. `check:route-delivery` enforces byte budgets and
allowed controller lists, delayed first clicks and native Enter/Space activation, Astro client
navigation, failed-chunk reload recovery, and deferred dynamic toast styling. The default fixtures
exercise a multi-route build; shared chunk composition can change these totals in another app.

Pass `--render` to capture computed properties and screenshots for seven routes, including composed
components in forward/reversed import order, across mobile/desktop themes and mobile RTL at 200% text.
Set `LUMEN_DELIVERY_COMPARE` to a previous fixture directory to require identical styles and pixels.
Archived source is selected through `LUMEN_DELIVERY_ASTRO_DIR`, with a separate `LUMEN_DELIVERY_LABEL`.
A v4 baseline needs its archived shared stylesheet as well as its Astro sources. Keep the same
consumer markup, shared behavior builds, and toolchain when comparing revisions.

Run delivery budgets with `--check` and the rendering comparison separately with `--render`.
The latter adds composition routes, which changes shared chunk composition. All 35 rendering
comparisons match the v4 baseline. Navigation checks include a dynamically created toast before
and after an Astro page swap, retaining its stylesheet without another download.

## Optional appearance CSS in v5

With Node 22.23.4, Astro 7.4.5 and the same six cold routes, the base Card/Button page
requested 5,180 gzip bytes of CSS, down from 7,025 at `b3c9194b` (1,845 bytes or 26.3%).
Uncompressed CSS went from 36,421 to 18,218 bytes. Both builds requested zero JavaScript for
this route. The dialog went from 8,705 to 6,975 gzip bytes and CodeTabs from 8,069 to 6,065.
The static fixture has a 5,500-byte gzip budget. These totals apply to selective imports.

## November 5, 2026 production installation footprint

Ten empty projects compared published Core/Astro/CLI 4.4.0 and React/Elements 4.3.0 with fresh packs
from candidate `dba0dbfa`. Node 22.23.4, pnpm 12.8.1, external dependency versions, and security
policies were identical. Production-only installs disabled scripts and automatic peer installation;
host frameworks and optional peers are excluded, so this is not a complete application measurement.

| Direct package | Production packages | Installed content MB | Compressed tarballs MB |
| --- | ---: | ---: | ---: |
| Core | 3 → 3 | 41.98 → 42.76 | 5.46 → 5.59 |
| Astro | 8 → 5 | 68.30 → 43.63 | 10.39 → 5.78 |
| React | 13 → 10 | 69.80 → 45.07 | 10.71 → 6.08 |
| Elements | 7 → 4 | 68.09 → 43.38 | 10.35 → 5.72 |
| CLI | 6 → 6 | 67.55 → 68.51 | 10.22 → 10.39 |

MB means 1,000,000 bytes. Installed content is logical regular-file bytes, excluding links, store
metadata, and allocated-disk overhead. Tarballs are distinct compressed package lengths; network
traffic depends on caching. Each adapter removes the umbrella CLI, TypeScript, and semver, saving
about 35% of installed content in this snapshot. Generated component CSS adds files and increases
Core and CLI sizes. Later layer-order headers add small CSS costs; these exact installation figures
belong to `dba0dbfa`, not every later candidate. Browser bytes are measured separately above.

All ten installs and exact export-target checks passed. Intentionally omitted host peers produced
the expected peer diagnostics. Installed-consumer behavior is covered by separate browser and
server-boundary checks.

## November 5, 2026 React Native import graph

The navigation fixture previously traversed web icon metadata through Core's root entry. Focused
public Core entries keep that metadata outside native imports. With the same Hermes toolchain,
the root-navigation bundle changed from 6,639,170 to 4,412,414 bytes (about 33.5%). The unchanged
6,291,456-byte budget and all three canonical native import fixtures pass. This measures that
fixture's bundle, not application startup, memory, or every native consumer.

The earlier barrel regression below no longer reproduces at v4.4.0: root and component imports each
emit 684 bytes for Card/Button/Icon, or 287 bytes without Icon, across three builds. Prefer granular
imports for predictable dependency graphs, while measuring output before claiming browser savings.

## July 30, 2026 baseline

The Astro fixture renders the same `Card`, `Button`, and `Icon` through package-root and
per-component imports.

| Scenario | Median build | Peak RSS | Static output |
| --- | ---: | ---: | ---: |
| Per-component with Icon | 729 ms | 127.3 MB | 596 B |
| Per-component without Icon | 900 ms | 127.1 MB | 199 B |
| Root with Icon | 913 ms | 127.0 MB | 80,323 B |
| Root without Icon | 1,306 ms | 129.3 MB | 79,926 B |

At this historical baseline, the root barrel caused the Astro runtime asset to be emitted even
when the selected primitives were static. The November measurement above supersedes this behavior.

The 397-byte Astro output delta is the rendered icon SVG, not a server-side Lucide registry bundle.

The Next.js client fixture produced the same 1,301,831-byte complete `.next/static` directory with
and without `Icon`. Median builds were 5.70 s with Icon and 4.81 s without it in this three-sample
run; the time difference is too noisy to justify generated subsets, while identical client output
shows no measurable emitted-directory cost in this fixture. Rerun the benchmark after icon-registry
changes; current size enforcement follows the [bundle size policy](../CONTRIBUTING.md#bundle-size-policy).

These are local regression measurements, not universal performance claims. Keep the JSON output in
release evidence when an import or icon change is proposed.

## August 26, 2026 React server-boundary baseline

The Next.js fixture renders the same stateless `Badge`, `Progress`, and `Skeleton` primitives from
the client package root and the implementation-level `@santi020k/lumen-react/server` entrypoint.
Each scenario was built three times with Next.js 16.3.2:

| Scenario | Median build | `.next/static` |
| --- | ---: | ---: |
| Client package root | 3,682 ms | 1,497,737 B |
| Server-safe entrypoint | 2,379 ms | 566,254 B |

The server-safe entrypoint reduced emitted static output by 931,483 bytes in this fixture. It owns
the stateless implementations directly and contains no `"use client"` directive; the client root
reuses those exact implementations and keeps the complete interactive catalog. Prefer `/server`
for its documented stateless primitives in React Server Components, while keeping event handlers,
hooks, and interactive primitives behind the root Client Component boundary. Build duration is
recorded for reproducibility but remains environment-sensitive.

## August 27, 2026 Elements registration baseline

The additive component-set API limits which constructors enter a custom element registry, but the
`define` entry remains a monolithic implementation module. Badge, Button, Card, and Combobox now
also expose implementation-level entrypoints. The repeatable measurement covers both stateless and
behavior-backed granular registration:

| Scenario | Minified bundle | Gzip |
| --- | ---: | ---: |
| Complete catalog | 1,039,784 B | 248,372 B |
| Badge, Button, and Card through `define` | 1,039,809 B | 248,384 B |
| Badge, Button, and Card granular entrypoints | 4,793 B | 1,835 B |
| Combobox granular entrypoint | 5,966 B | 2,384 B |

The selected `define` scenario still includes the full catalog and adds 25 raw bytes for its
component-name arguments. The stateless granular path is 1,034,991 raw bytes and 246,537 gzip bytes
smaller for the same components in this fixture. The behavior-backed Combobox entrypoint is
1,033,818 raw bytes and 245,988 gzip bytes smaller than complete-catalog registration. A clean
application built from the packed npm tarball imports each granular entrypoint and verifies all four
tags. Keep complete-catalog registration supported for the rest of the catalog and expand granular
coverage only with the same constructor-identity, package-consumer, and measurement evidence.

## August 27, 2026 foundation delivery expansion

The React server entrypoint now owns 22 server-safe component and type exports, including compound
Card composition and the layout/accessibility foundations. The package root reuses those exact
implementations. The same Next.js measurement remains at 566,254 bytes of emitted static output for
the server-entry scenario, versus 1,500,057 bytes for the complete client root in this run.

Elements now exposes a grouped `components/foundations` implementation entrypoint for fifteen
stateless components. The repeatable registration measurement reports 6,050 minified bytes and
2,209 gzip bytes for the complete foundation group, while complete-catalog registration is
1,039,784 minified bytes and 248,372 gzip bytes in the current run.

Astro now selector-loads phone normalization; dialog, alert-dialog, drawer, and sheet behavior; and
Anchor and ScrollProgress document-navigation behavior separately from the shared runtime. The base
`UIPrimitives` source decreased from 163.2 KiB raw and 32.3 KiB gzip to 155.9 KiB raw and 30.8 KiB
gzip. Pages without those component contracts do not load their controller chunks; the overlay
controller is 3.0 KiB raw and 0.9 KiB gzip, while document navigation is 3.5 KiB raw and 1.1 KiB
gzip.

The generated critical CSS entry is 50,116 raw bytes versus 170,526 bytes for the full standalone
catalog, a 70.6% reduction. It retains the canonical token/base layers plus the essential forms,
feedback, tabs, dialogs, calendar, and data-table selectors. Identical exports ship from the
umbrella, Astro, React, and Elements packages, and `pnpm run check:critical-web-css` rejects stale or
accidentally expanded generated output.

## V4 selective component entries

React exposes existing standalone component modules under `/components/*` and behavior hooks under
`/hooks`. Elements adds `/components/virtual-list`, using the same constructor as full registration.
Core exposes image-comparison and virtual-windowing helpers through dedicated entry points. Root imports
remain supported. Interactive React entries preserve their client boundary for Next.js consumers.

The minified equivalent-consumer benchmark uses external React and reports module graph size as
well as raw/gzip output. In the final October 4 run, ImageComparison traversed 2,026 modules from
root and five from its selective entry, with identical 4,599-byte raw output (1,979 vs 1,985 gzip).
VirtualList registration measured 1,474,882 raw / 488,079 gzip through the full catalog and
7,215 raw / 2,973 gzip through its granular entry. These are synthetic consumer measurements,
not application download sizes or a promise that every selective import reduces final output.
Run the benchmark against the final candidate after rebuilding packages; output varies with
bundler symbol naming and subsequent component changes.
