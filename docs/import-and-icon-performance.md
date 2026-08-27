# Import and icon performance

Use the repeatable local measurements before changing Lumen's import guidance or generating icon
subsets:

```bash
pnpm run measure:imports
pnpm run measure:react-icons
pnpm run measure:react-server
pnpm run measure:elements-registration
```

The Astro and React commands default to three builds per scenario and report median wall time,
output bytes, and their raw samples as JSON. Set `LUMEN_BENCHMARK_ITERATIONS` to increase the sample
count. The Elements command builds the package once and compares complete-catalog registration with
an explicit Card, Input, and Button set through the same minified browser bundler.

## July 30, 2026 baseline

The Astro fixture renders the same `Card`, `Button`, and `Icon` through package-root and
per-component imports.

| Scenario | Median build | Peak RSS | Static output |
| --- | ---: | ---: | ---: |
| Per-component with Icon | 729 ms | 127.3 MB | 596 B |
| Per-component without Icon | 900 ms | 127.1 MB | 199 B |
| Root with Icon | 913 ms | 127.0 MB | 80,323 B |
| Root without Icon | 1,306 ms | 129.3 MB | 79,926 B |

The repeated output difference is material: the root barrel currently causes the Astro runtime
asset to be emitted even when the selected primitives are static. Prefer root imports for
convenience in runtime-heavy applications, but prefer the documented per-component paths for small
static pages and large catalogs until barrel tree-shaking removes this output difference.

The 397-byte Astro output delta is the rendered icon SVG, not a server-side Lucide registry bundle.

The Next.js client fixture produced the same 1,301,831-byte complete `.next/static` directory with
and without `Icon`. Median builds were 5.70 s with Icon and 4.81 s without it in this three-sample
run; the time difference is too noisy to justify generated subsets, while identical client output
shows no measurable emitted-directory cost in this fixture. Continue enforcing the existing React
bundle budget and rerun the benchmark after icon-registry changes.

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
