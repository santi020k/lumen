# Chart implementation learnings from Observatory

Observatory adopted the data-visualization components introduced for Lumen 0.4.0 across a real
Astro SSR analytics dashboard. It replaced custom progress bars and div-based time-series plots
with `BarChart` and `LineChart` for package downloads, portfolio history, project history, and
Cloudflare website traffic.

## What worked well

- The shared `LumenChartSeries` shape made it straightforward to move four visualizations onto the
  same contract without moving aggregation or product logic into Lumen.
- `BarChart` with `orientation="horizontal"` is a good default for ranked project names because it
  preserves readable category labels.
- `LineChart` communicates rolling and continuous metrics more honestly than the previous custom
  bars.
- `tone="brand"` and `tone="accent"` mapped the charts to the existing application theme without
  consumer-owned color CSS.
- The revealable data table improved keyboard and screen-reader access while removing custom
  per-mark ARIA markup from the application.
- SSR output and the zero-runtime SVG approach fit an Astro dashboard without adding hydration or a
  charting dependency.

## Possible improvements

### Separate category identity from axis formatting

`LumenChartDatum.x` currently serves as both the alignment key and the visible axis label. Time
series often need a stable ISO timestamp for identity and a short localized date for display.
Using the formatted date as `x` can collapse distinct samples collected on the same day.

Consider adding an optional category formatter or a separate display label:

```ts
interface LumenChartDatum {
  x: number | string;
  xLabel?: string;
  y: number | null;
  label?: string;
}
```

The geometry should continue aligning on `x`, while axes and the accessible table prefer `xLabel`.

### Add value and tick formatters

Observatory formats large counts compactly (`18.4K`) but axis ticks currently render raw numeric
values. A `formatValue` callback shared by axis ticks, SVG titles, and the data table would keep the
visual and semantic representations consistent. An independent `formatCategory` callback would
cover localized dates without changing data identity.

### Make chart margins responsive to labels

The horizontal bar chart uses a fixed left margin. Long product names can be clipped, while short
names leave unused plot space. Consider a documented `categoryWidth` or `margin` prop first; a later
enhancement could measure or estimate label width within safe bounds.

### Support application-level heading composition without double framing

Analytics cards often already provide an eyebrow, heading, range, and controls outside the chart.
The chart correctly allows `heading` to be omitted, but it still renders its own framed surface.
A low-emphasis or `bare` presentation would let `BarChart` and `LineChart` sit inside `Card` without
nested borders and backgrounds while retaining plot, legend, caption, empty state, and data table.

### Offer marker density control

`LineChart` exposes a boolean `markers` prop. For a 30-day series every point is useful, while
longer ranges benefit from fewer visible markers without removing data from the line or table.
Consider `markers="auto" | "all" | "none"` or a numeric marker step.

### Expose empty-state copy

The built-in empty state is accessible and useful, but product dashboards often need source-specific
guidance. An `emptyLabel` prop or empty-state slot would preserve the component structure while
allowing actionable copy.

## Suggested priority

1. Add category and value formatting without changing the existing series contract.
2. Add a low-emphasis presentation for charts nested in cards.
3. Add label-aware horizontal margins and automatic marker density.
4. Add customizable empty-state content.

These additions would reduce consumer preprocessing and CSS without turning Lumen into a statistics
or data-aggregation library.
