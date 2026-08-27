# Data visualization

Lumen provides one visualization foundation across web and native adapters: canonical semantic
chart colors and metrics, shared TypeScript geometry and validation helpers, framework-native
renderers, factual accessibility summaries, and readable fallback data. Applications continue to
own aggregation, statistics, units, locale formatting, streaming cadence, annotations, and domain
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

## Accessibility

Every data chart needs a useful accessible name. Lumen adds a factual generated summary describing
series count, available points, range, and missing values; pass `summary` when domain context is
more useful. Web charts expose a disclosure table by default. Native charts pair their visual plot
with a readable data list, and controlled selection is available where the adapter supports it.

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
