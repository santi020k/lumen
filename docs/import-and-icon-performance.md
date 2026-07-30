# Import and icon performance

Use the repeatable local measurements before changing Lumen's import guidance or generating icon
subsets:

```bash
pnpm run measure:imports
pnpm run measure:react-icons
```

Both commands default to three builds per scenario and report median wall time, output bytes, and
their raw samples as JSON. Set `LUMEN_BENCHMARK_ITERATIONS` to increase the sample count.

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
