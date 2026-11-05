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

## November 5, 2026 Astro route delivery

The v5 runtime split is measured against published v4.4.0 (`fc264ae2`) with the same six cold
Chromium routes, Node 22.23.4, pnpm 12.8.1, Astro 7.3.5, and full stylesheet. Each row reports the
sum of the assets actually requested after initialization, compressed individually with gzip level 9.
These are local fixture bytes, not measured network transfer or production traffic.

| Route | v4.4.0 JavaScript gzip | v5 modular runtime gzip | v5 controller modules |
| --- | ---: | ---: | --- |
| Static Card/Button, no runtime | 0 B | 0 B | None |
| Static Card/Button, root runtime mounted | 35,300 B | 4,716 B | Loader only |
| Dialog | 35,985 B | 5,401 B | Dialog |
| CodeTabs with scroll cues | 35,300 B | 9,591 B | Tabs, code, scroll cues, shared helpers |
| Form, Field, Input, Select | 35,300 B | 8,644 B | Forms, select, shared helpers |
| Calendar | 35,300 B | 8,721 B | Calendar, calendar helpers, shared helpers |

The full stylesheet remains 35,620 gzip bytes on these routes. This comparison establishes runtime
savings; selective CSS is a separate v5 milestone. No additional script requests occurred during the
measured first interaction. The module report maps fetched chunks back to their source modules; the
simple routes contain no phone, map, rich-text, or scheduler controller.

`measure:route-delivery` builds the fixtures in `.cache/route-delivery/candidate` and writes a JSON
report there. `check:route-delivery` additionally enforces the budgets and allowed controller lists in
`tests/fixtures/delivery/budgets.json`, tests slow first clicks and native Enter/Space activation,
checks actual Astro client navigation, and verifies a reload after a failed controller request.
The performance fixture uses public component/runtime contracts with direct source resolution so an
archived Astro source tree can be compared using `LUMEN_DELIVERY_ASTRO_DIR` and
`LUMEN_DELIVERY_LABEL`. Baseline source must match the intended revision, with the same shared package
builds and toolchain; never compare different consumer markup and call it a library improvement.

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
