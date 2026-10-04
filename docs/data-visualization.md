# Data visualization

Lumen provides one visualization foundation across web and native adapters: canonical semantic
chart colors and metrics, shared TypeScript geometry and validation helpers, framework-native
renderers, factual accessibility summaries, and readable fallback data. Applications continue to
own aggregation, statistics, units, locale formatting, streaming cadence, annotation content, and domain
decisions.

## Choose the lightest chart that answers the question

| Question | Component | Notes |
| --- | --- | --- |
| What direction is one compact metric moving? | `Sparkline` | Supply a concise accessible label; omit axes and legends. |
| How do categories compare? | `BarChart` | Group related series; stack only when the combined total matters. |
| How does a value change in order or time? | `LineChart` | Use area fill sparingly and preserve `null` values as honest gaps. |
| How is a small positive total divided? | `PieChart` | Prefer a bar chart for precise comparison or more than about seven slices. |
| Are two numeric measures related? | `ScatterChart` | Add `size` for a bubble encoding only when the third measure is meaningful. |
| Where are values concentrated in a matrix? | `Heatmap` | Use labels and the sequential palette; do not rely on color alone. |
| How does uncertainty or an interval change? | `RangeChart` | Supply low and high values in the same unit and domain. |
| How do magnitudes and trends compare together? | `ComboChart` | Mix bars, lines, and areas only when they share a meaningful value domain. |
| Which changes explain a final balance? | `WaterfallChart` | Use signed deltas and explicit totals on web and native. |
| How does the actual value compare with a target? | `BulletChart` | Use a zero-inclusive domain and optional labeled ranges on web and native. |
| How are observations distributed? | `Histogram` | Supply explicit bins and counts on web and native. |

Use `Chart` as the web escape hatch for a specialized SVG, canvas, or HTML visualization. Product-
specific maps, networks, financial studies, scientific plots, and high-density interaction can use
an application-selected engine while consuming Lumen chart tokens and accessibility patterns.

## Data contracts and reliability

Web and React Native use `LumenChartSeries` and `LumenChartDatum`. A datum has a stable `x`, a
finite `y` or `null`, and optional `id`, visible labels, tone, and bubble `size`. Core helpers cover
categorical alignment, linear and time scales, nice ticks, grouped and stacked bars, line gaps,
scatter/bubble points, heatmap cells, range bands, deterministic downsampling, bounded live-data
append, validation, and summary generation. The cross-platform fixture at
`charts/lumen.chart-conformance.json` keeps representative geometry behavior reviewable.

Never replace a missing measurement with zero unless zero is the real observation. Validate
untrusted or remote series with `validateLumenChartSeries`, preserve `null` gaps, and downsample
large display data without changing the source dataset. Use `appendLumenChartDatum` for a bounded
live window; the application still owns transport, retries, persistence, and update frequency.

Each series must have one observation per `x`. In v4, validation reports `duplicate-category`;
if invalid duplicate data reaches a renderer, the first observation wins consistently in the
plot and table. Use a stable ISO date or numeric timestamp for identity, not a localized date
label. Supply a short `xLabel` for the axis and `formatCategory` for full tooltip/table text.
Web line and bar axes measure label space, retain readable endpoint alignment, and omit
overlapping ticks. Exact values remain available in the data table. Line, waterfall, histogram, and
heatmap plots fit narrow cards with larger SVG labels and fewer category ticks. Other plots retain
horizontal scrolling where their labels need more room, without widening the page.

Compose line charts position homogeneous `LumenChartX.Time` and `LumenChartX.Number` values by
elapsed/numeric distance and sort their shared coordinates. Category or mixed-type series use
categorical spacing; bar and combo charts retain category bands. Single observations and
gap-isolated observations remain visible. Invalid numeric coordinates are excluded from line
geometry. Use `LumenChartLabels(formatX = ..., formatValue = ...)` to keep the native data
alternative in the application's language and units. The default time label includes date and
time. These v4 corrections can change the appearance of previously ordinal time-series plots.

## Web visualization controls

Astro, React, and Elements share the same line model. Set `xScale="linear"` for numeric distances
or `xScale="time"` for ISO dates and millisecond timestamps (`x-scale` in Elements). Categories
remain the default. All series share one sorted coordinate system, and missing observations stay
as gaps. Axis ticks label observed coordinates; applications supply locale and timezone formatting.
`domain` and `xDomain` constrain the viewport without changing the source table. Elements uses
`domain-min`, `domain-max`, `x-min`, and `x-max` numeric attributes instead.

Opt into `interactive` to inspect all series at an observation with the pointer, a tap, Left/Right,
Home, or End. A tap or keyboard selection pins the inspection panel; Escape dismisses it. Pointer
inspection does not repeatedly announce values to screen readers. The floating panel follows the
observation, stays inside the card, and does not move surrounding content. Legend buttons hide or show
series while retaining the domain and full data table. Astro requires `UIPrimitives` for enhancement;
the static chart and table remain usable without it.

Give related charts the same `syncGroup` (`sync-group` in Elements) to synchronize exact X identities
within a document. `ui:chart-cursor-change` bubbles with `{ x: number | string | null }` for direct
interaction. React also accepts `cursor` and `onCursorChange`; a controlled cursor updates when its
owner accepts the requested identity. Synchronized receivers do not emit another event. Numeric
and string identities remain distinct. Selection state stays in memory and is removed on unmount.

Line `annotations` accept stable IDs, labels, an X or Y axis, a value, and an optional chart tone.
They render labeled reference lines and an accessible text alternative. Annotations outside the
domain are omitted. Bands, zooming, and brush selection are not part of this API.

Heatmaps show both axes, a color legend, and an explicit × for missing measurements. Zero remains
a measurement. Use `colorScale="diverging"` with a meaningful `midpoint` when values span a neutral
reference. The automatic domain is symmetric around that midpoint. A custom domain must enclose
the midpoint; otherwise the automatic domain is used. The legend places its neutral color at the
correct proportion of an asymmetric domain. Supply every missing coordinate explicitly as `null`.

`WaterfallChart` accepts `{ id, label, value, kind?, tone? }` steps. A `delta` adds its signed value
to the running balance; an explicit `total` draws from zero and resets the balance. Non-finite
values, overflowing balances, or duplicate IDs produce an invalid-data state rather than a partial
balance. The table includes each step's start, end, and supplied value.

`Histogram` accepts `{ start, end, count, label? }` bins. Lumen sorts bins without mutating input,
preserves numeric widths and gaps, and rejects reversed, overlapping, non-finite, or negative-count
bins. Unequal widths require `frequency="density"`: height is count divided by bin width, and the
table retains original counts. Applications own binning, inclusion of interval boundaries, and
units. Use `formatBoundary` and `formatValue` for those units; Elements exposes `boundaryFormatter`
and `valueFormatter` properties. Localize messages with `labels` or the documented Elements label
attributes. Waterfall and histogram components are also available in React Native, SwiftUI, and Compose.

## Native heatmaps

Native heatmaps use the same sequential and diverging color semantics as web charts. They include
row and column labels, a numeric color legend, explicit missing-value crosses, and an expandable
list of exact measurements. Dense axes omit overlapping labels without removing observations.
The first measurement at each coordinate wins in both the plot and the readable list.

Use `colorScale="diverging"` in React Native, `.diverging` in SwiftUI, or
`LumenHeatmapColorScale.Diverging` in Compose. `midpoint` defaults to zero; an explicit `domain`
must be finite, increasing, and contain the midpoint for a diverging scale. SwiftUI and Compose
accept a closed numeric range; React Native accepts `{ min, max }`. Values outside the domain
use the endpoint color while their exact values remain available in the data disclosure.
Pass `formatValue` in React Native or `labels.formatValue` in SwiftUI and Compose to format the
legend and data consistently. `heading` and `description` provide visible chart context.

The [web comparison gallery](https://lumen.santi020k.com/docs/web/data-visualization) renders the same
synthetic datasets through framework tabs and demonstrates cursor synchronization. Its overview
combines compact metrics, a wide trend chart, distributions, balance changes, channel shares, and
a weekly matrix. The styling ships in Lumen's shared stylesheet: existing package imports remain
unchanged. Line charts use a wider default aspect ratio, fading area fills, quiet grid lines, and
compact legends; pie charts use clearer slice separation and a smaller default footprint.

## Accessibility

Every data chart needs a useful accessible name. Lumen adds a factual generated summary describing
series count, available points, range, and missing values; pass `summary` when domain context is
more useful. Web charts expose a full-width disclosure table with sticky headers and a bounded, keyboard-scrollable
body. Native charts pair their visual plot with an expandable, bounded data list, and controlled selection is available where the adapter supports it.

Keep visual marks decorative to assistive technology, retain the summary and fallback data, and
format every visible and spoken value with the same unit and locale. Do not use hue as the only
distinction: Lumen varies line dashes on the web and the fallback data carries explicit series
labels. Test keyboard or switch navigation, screen-reader reading order, high contrast, dark mode,
large text, reduced motion, empty data, missing values, negative values, and very large input.

## Tokens and theming

`tokens/lumen.tokens.json` is the source of truth. The `visualization` group defines light and dark
axis, grid, reference, selection, tooltip, eight categorical series, sequential, and diverging
colors plus chart stroke widths and opacities. Generated TypeScript, Swift, and Kotlin adapters keep
the same roles available without forcing one rendering technology.

Use categorical colors for unrelated series, sequential colors for ordered magnitude, and
diverging colors only when a meaningful midpoint separates negative and positive outcomes. Keep
semantic success, warning, and danger tones for data that truly carries those meanings.

## Platform implementation

- Astro, React, and Elements ship the full sparkline, line, bar, pie, scatter, heatmap, range, and
  combo family with dependency-free SVG renderers, factual summaries, and semantic data tables.
- React Native uses `react-native-svg`, shared geometry, Lumen theme tokens, and native accessible
  data controls.
- SwiftUI uses Swift Charts where available and a tokenized `Canvas` pie/donut implementation that
  preserves the iOS 16 baseline.
- Compose uses `Canvas`, Material text and surfaces, generated tokens, and TalkBack semantics.

The native galleries under `apps/playground-react-native`, `apps/playground-apple`, and
`apps/playground-android` provide executable examples. Run the platform-specific builds and the
repository validation gates before publishing API or token changes.

## Actual values and targets

`BulletChart` (native `LumenBulletChart`) compares a nullable `value` with a finite `target`.
The actual bar starts at zero, including for negative values. The target is a separate high-contrast
marker; its exact value remains visible above the plot. `ranges` contains `{ end, label, tone? }`
entries sorted by their unique finite end values. Lumen keeps the source array unchanged.

An explicit `domain` must include zero, the actual value, target, and every range end. Invalid
measurements, duplicate ends, blank labels, or truncated domains produce the invalid-data state.
A null value displays the localized unavailable label while retaining the target and ranges;
zero remains a real observation. No percent-of-target score is inferred.

Astro and React accept `formatValue`, `targetLabel`, `valueLabel`, and `labels`. Elements exposes
`value` and `target` as numeric properties or attributes, `ranges` as a property or JSON attribute,
`domain-min`/`domain-max`, `target-label`, and a `valueFormatter` property. Removing the Elements
`value` attribute represents a missing observation. Native adapters use their existing labels and
number formatter contracts. Keep `showTable` (web) or `showData` (native) enabled for exact values.
