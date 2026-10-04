# Data visualization

Lumen provides one visualization foundation across web and native adapters: canonical semantic
chart colors and metrics, shared TypeScript geometry and validation helpers, framework-native
renderers, accessible context, and readable fallback data. Applications continue to
own aggregation, statistics, units, locale formatting, streaming cadence, annotation content, and domain
decisions.

The [interactive guide](https://lumen.santi020k.com/docs/web/data-visualization) includes the gallery,
chart-selection guidance, framework setup, and copyable examples for Astro, React, and Elements.
Start with [comparison recipes](https://lumen.santi020k.com/docs/web/data-visualization#chart-recipes)
for CalendarHeatmap, FunnelChart, BoxPlot, LollipopChart, DumbbellChart, and BulletChart.
Each recipe includes its own sample data and links to the full API reference.

## Install and render

Charts ship in the existing adapter packages; no separate chart package is required. Install your
adapter with `pnpm add @santi020k/lumen-astro`, `pnpm add @santi020k/lumen-react`, or
`pnpm add @santi020k/lumen-elements`, and import its `styles.css` entry once in your application shell.
Use the complete stylesheet for the chart catalog.

Astro renders comparison charts and native data disclosures without JavaScript. Mount
`UIPrimitives` from `@santi020k/lumen-astro/runtime` once for interactive LineChart and Lumen tabs.
React owns its interaction. Elements requires `defineLumenElements` in a browser entry processed by
your bundler; register only the components you use. In React Server Components apps, keep formatter
functions in a client component rather than passing functions across the server/client boundary.

## Choose the lightest chart that answers the question

| Question | Component | Notes |
| --- | --- | --- |
| Which days have the most activity? | `CalendarHeatmap` | Use strict date-only identities and preserve missing days. |
| How do stages compare for a cohort? | `FunnelChart` | Supply nonnegative counts in stage order; the application owns conversion rates. |
| How do distributions compare? | `BoxPlot` | Supply precomputed quartiles, whisker bounds, and outliers using one consistent policy. |
| What direction is one compact metric moving? | `Sparkline` | Supply a concise accessible label; omit axes and legends. |
| How do categories compare? | `BarChart` | Group related series; stack only when the combined total matters. |
| How does a value change in order or time? | `LineChart` | Use area fill sparingly and preserve `null` values as honest gaps. |
| How is a small positive total divided? | `PieChart` | Prefer a bar chart for precise comparison or more than about seven slices. |
| Are two numeric measures related? | `ScatterChart` | Add `size` for a bubble encoding only when the third measure is meaningful. |
| Where are values concentrated in a matrix? | `Heatmap` | Use labels and the sequential palette; do not rely on color alone. |
| How does uncertainty or an interval change? | `RangeChart` | Supply low and high values in the same unit and domain. |
| How do magnitudes and trends compare together? | `ComboChart` | Mix bars, lines, and areas only when they share a meaningful value domain. |
| Which changes explain a final balance? | `WaterfallChart` | Use signed deltas and explicit totals on web and native. |
| Which categories rank highest? | `LollipopChart` | Shows a value dot and a zero-based stem on a common scale. |
| How did each category change? | `DumbbellChart` | Connects an outlined reference dot with a filled current dot. |
| How does the actual value compare with a target? | `BulletChart` | Use a zero-inclusive domain and optional labeled ranges on web and native. |
| How are observations distributed? | `Histogram` | Supply explicit bins and counts on web and native. |

Sparkline stretches its trend to fit the container while keeping the endpoint marker circular at a fixed size. Set `showEndpoint` to `false` (or `show-endpoint="false"` in Elements) to omit the marker.

Use `Chart` as the web escape hatch for a specialized SVG, canvas, or HTML visualization. Product-
specific maps, networks, financial studies, scientific plots, and high-density interaction can use
an application-selected engine while consuming Lumen chart tokens and accessibility patterns.

## Data contracts and reliability

Series-based web and React Native charts use `LumenChartSeries` and `LumenChartDatum`. A datum has a stable `x`, a
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

## Datum activation foundation

Custom charts can share a typed activation payload using the core builders:

```ts
import {
  createLumenChartDatumActivation,
  parseLumenChartDatumActivation
} from '@santi020k/lumen-core/charts'

const detail = createLumenChartDatumActivation('received', {
  id: 'october-received',
  x: '2026-10',
  y: 0
})

if (detail) {
  // The application chooses the detail view, route, or filter.
  console.log(detail.kind, detail.x)
}

const validated = parseLumenChartDatumActivation(detail)
```

`LumenChartDatumActivationDetail` uses `kind: 'series'` with `seriesId`, `x`, and `y`;
`kind: 'heatmap'` with `x`, `y`, and `value`; or `kind: 'range'` with `x`, `low`, and `high`.
All kinds can carry `datumId`. Axes retain their original number or string identity rather than
localized display text. Builders reject missing, non-finite, and reversed range values; zero and
negative observations remain valid. Pie renderers must additionally restrict actions to the
positive observations represented by their slices.

The DOM controller described in the [core README](../packages/core/README.md#chart-datum-activation)
provides a common event path for custom marks and native buttons. It handles no fetching or
navigation. An activation payload is UI context, never proof that an operation is authorized.

## Astro chart actions

Astro's seven data charts accept `drilldown`. Mount `UIPrimitives` once in the page layout and
listen for `ui:chart-datum-activate` on the chart figure or a containing application surface.
The event uses the validated payload documented above, preserving the original X value even
when combo geometry transforms it for plotting.

```astro
<BarChart
  id="collection-chart"
  aria-label="Collections by month"
  drilldown
  series={collectionSeries}
  showTable={false}
  labels={{
    exploreData: 'Explorar datos del gráfico',
    formatDatumAction: context => `Abrir detalles: ${context}`
  }}
/>
```

The action disclosure remains available when the table is hidden. Its native buttons support
Enter, Space, and ordinary Tab order without making SVG marks part of the accessibility tree.
Line and combo point targets retain their actions when visible markers are omitted. Static
charts keep their existing output unless drilldown is enabled. Use chart formatters and the
remaining label overrides to keep the entire chart in the application's language.

## React chart actions

Pass `onDatumActivate` to any of the seven React data charts to enable the same native-button
disclosure and pointer actions. React owns callback dispatch; it does not emit the Astro DOM event
or need `UIPrimitives`. A mixed-framework Astro page leaves React chart roots to React's handlers.

```tsx
import { BarChart, type LumenChartDatumActivationDetail } from '@santi020k/lumen-react'

const openDetails = (detail: LumenChartDatumActivationDetail) => {
  if (detail.kind === 'series') {
    // Choose an application detail view using raw identities.
    console.log(detail.seriesId, detail.x, detail.datumId)
  }
}

<BarChart
  aria-label="Collections by month"
  series={collectionSeries}
  showTable={false}
  onDatumActivate={openDetails}
/>
```

The native `onClick` handler runs before datum activation and may prevent it. Disabled or inert
ancestors suppress callbacks. Stable action identities preserve button focus when values change;
the callback always receives the currently rendered values. Apps should handle stale data and
permissions again when carrying out the chosen operation.

## Elements chart actions

Set `drilldown` on BarChart, LineChart, PieChart, ScatterChart, ComboChart, Heatmap, or RangeChart
hosts to enable datum activation. Elements supplies its own controller lifecycle; listen for
`ui:chart-datum-activate` on the host and validate unknown event details with
`parseLumenChartDatumActivation` from core before using them at application boundaries.

The event uses the same original identities and finite values as Astro and React. Native action
buttons remain available with hidden tables or suppressed line markers. Use `explore-data-label`
and `datum-action-prefix`, or the host's `datumActionFormatter(context)` property, for localization.
When data updates, Elements retains the disclosure state and restores focus to the same available
action. Disconnection destroys the controller; reconnection enhances once. Disabled, inert, hidden,
and cancelled interactions do not activate a datum.

## Accessibility

Every data chart needs a useful accessible name. Supply visible `heading` and `description` context,
including units and the reporting period. Series charts can generate factual summaries of counts,
range, and missing values. Web comparison charts expose labeled rows; provide `summary` when a
written takeaway would help. Do not assume that a chart generates a domain-specific interpretation. Web charts expose a full-width disclosure table with sticky headers and a bounded, keyboard-scrollable
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

- Astro, React, and Elements ship sparkline, line, bar, pie, scatter, heatmap, range, combo,
  waterfall, histogram, bullet, lollipop, dumbbell, calendar heatmap, funnel, and box plot charts
  using SVG or HTML/CSS renderers and
  accessible data alternatives.
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

## Rankings and paired comparisons

`LollipopChart` and `DumbbellChart` (native `LumenLollipopChart` and `LumenDumbbellChart`)
accept `data` entries with a stable `id`, a `label`, nullable `value`, optional nullable `reference`,
and optional `tone`. All six adapters retain input order; the application owns ranking and sorting.
Lollipop stems begin at zero. Dumbbells join reference and current measurements, including decreases.
An outlined reference dot and a filled value dot distinguish the measurements without relying on hue.

Every row shares one zero-inclusive domain. An explicit domain must enclose every displayed value.
Non-finite values, blank identities or labels, duplicate IDs, and truncated domains fail closed.
Missing measurements keep their readable row; they never become zero or a connector to a missing dot.
Empty datasets show the localized empty state. The source array is never mutated.

Use `referenceLabel` and `valueLabel` for the column meanings and `formatValue` (native Apple/Android
`labels.formatValue`) for consistent units. Elements exposes `data` as a typed property or JSON
attribute, `valueFormatter`, `reference-label`, `value-label`, `domain-min`, and `domain-max`.
The exact table or native data list stays available through `showTable` or `showData`.

## Compact bar chart layout

Web bar charts fit the available card width across Astro, React, and Web Components, including
phone layouts. Horizontal charts reserve 160 SVG units for category labels by default; use
`categoryWidth` to adjust that space for your own labels. The readable data disclosure contains
every value even when the axis selects fewer labels.

React Native line, bar, scatter, range, and combo charts recompute their geometry when the container
resizes. This keeps the complete plot visible with fixed-size axis text and a compact phone height.


## Copyable comparison recipes

These examples assume the shared stylesheet is already loaded. For Astro, use the same component
props from `@santi020k/lumen-astro`, move data declarations into the component script between `---` fences, and omit the React
function wrapper. The interactive guide contains complete examples for each web framework.

```tsx
import { DumbbellChart, LollipopChart } from '@santi020k/lumen-react'

const data = [
  { id: 'design', label: 'Design', reference: 62, value: 88 },
  { id: 'engineering', label: 'Engineering', reference: 76, value: 91 },
  { id: 'support', label: 'Support', reference: 81, value: 74 }
]

export function TeamComparison() {
  return (
    <DumbbellChart
      aria-label="Team scores, previous and current quarter"
      heading="Progress by team"
      description="Score out of 100"
      data={data}
      domain={{ min: 0, max: 100 }}
      referenceLabel="Previous"
      valueLabel="Current"
    />
  )
}

export function TeamRanking() {
  return (
    <LollipopChart
      aria-label="Team scores, current quarter"
      heading="Team performance"
      description="Score out of 100 · highest first"
      data={data.toSorted((left, right) => right.value - left.value)}
      domain={{ min: 0, max: 100 }}
      valueLabel="Score"
    />
  )
}
```

The ranking example has no missing values; when sorting nullable measurements, explicitly choose
where missing rows belong. LollipopChart does not plot the optional `reference`. DumbbellChart
preserves the available endpoint when the other is `null` and omits its connector.

```tsx
import { BulletChart } from '@santi020k/lumen-react'

export function DeliveryTarget() {
  return (
    <BulletChart
      aria-label="Delivery performance, current quarter"
      heading="On-time delivery"
      description="Completed deliveries within the service window"
      value={86}
      target={95}
      ranges={[
        { end: 70, label: 'Developing' },
        { end: 90, label: 'Consistent' },
        { end: 100, label: 'Excellent' }
      ]}
      domain={{ min: 0, max: 100 }}
      valueLabel="Actual"
      targetLabel="Goal"
      formatValue={value => `${value}%`}
    />
  )
}
```

For Elements, register the element before assigning its typed data and formatter properties:

```ts
import {
  defineLumenElements,
  LumenDumbbellChartElement
} from '@santi020k/lumen-elements'

defineLumenElements(['DumbbellChart'])

const chart = document.querySelector('lumen-dumbbell-chart')
if (chart instanceof LumenDumbbellChartElement) {
  chart.data = [
    { id: 'design', label: 'Design', reference: 62, value: 88 },
    { id: 'support', label: 'Support', reference: 81, value: null }
  ]
  chart.valueFormatter = value => `${value} points`
}
```

Use `domain-min="0" domain-max="100" reference-label="Previous" value-label="Current"` on the
matching `<lumen-dumbbell-chart>` markup, together with `aria-label`, `heading`, and `description`.
The script must run after that markup exists. After assigning `.data`, update that property on
subsequent renders; it takes precedence over the JSON attribute. Formatters are functions assigned
to `.valueFormatter`, not string attributes.

## Units, localization, and states

- Keep source values numeric. A formatted string such as `"86%"` is not chart data. The bullet
  example stores percentage points (86) and appends `%`; `Intl.NumberFormat` with `style: 'percent'`
  expects a fraction (0.86) and a matching domain, target, and range scale.
- Use `labels` for missing, empty, invalid, and data-disclosure messages; use `referenceLabel`,
  `valueLabel`, and `targetLabel` for observation names. Elements exposes `not-available-label`,
  `view-data-label`, and other chart label attributes, plus formatter properties.
- An empty array means no rows. It does not mean a request is loading. Keep fetching, retries,
  loading skeletons, and error recovery in the application. Invalid comparison data fails closed
  instead of displaying a partial ranking.
- Use `presentation="bare"` when an enclosing Card already provides the surface. Keep exact data
  available with `showTable` unless an equivalent accessible data view is present nearby.
- Native charts use `label` and `showData`. React Native formats through `formatValue`; SwiftUI and
  Compose use `labels.formatValue`. Their domain types are `{ min, max }`, a Swift closed range,
  and a Kotlin closed floating-point range respectively. Follow each platform's theme setup.

## Calendars, funnels, and box plots

`CalendarHeatmap`, `FunnelChart`, and `BoxPlot` are available in Astro, React, and Elements, with
`LumenCalendarHeatmap`, `LumenFunnelChart`, and `LumenBoxPlot` in React Native, SwiftUI, and Compose.
All share validation, semantic chart colors, factual summaries, and exact accessible data.
Keep `showTable` (web) or `showData` (native) enabled for a visible data disclosure. When hidden,
exact facts remain available to assistive technology.

### Daily activity

Calendar heatmaps accept `{ date, value }` observations and required `startDate` / `endDate`
identities in strict `YYYY-MM-DD` form. Dates use the proleptic Gregorian calendar, years 0001–9999,
independent of device timezone and daylight saving time. The inclusive range is limited to 3660 days
and must contain every observation. Duplicate dates, invalid dates, and non-finite measurements
produce the invalid-data state. Omitted days and explicit `null` values stay missing; zero is measured.

`weekStartsOn` defaults to `0` (Sunday); use `1` for Monday. Custom `weekdayLabels` use Sunday-first
indexing. The plot scrolls within its card for long ranges; missing cells display a cross. A numeric
legend explains the intensity scale. `domain` must be finite, increasing and contain all measurements.
Supply `formatDate` and `formatValue` for application language and units (native number formatting
uses the existing chart labels contract). Elements uses `start-date`, `end-date`, `week-starts-on`,
and `domain-min` / `domain-max`, plus typed formatter and label properties.

```astro
<CalendarHeatmap aria-label="Daily activity" startDate="2026-08-01" endDate="2026-08-28"
  data={[{ date: '2026-08-01', value: 3 }, { date: '2026-08-02', value: 0 }]} />
```

### Conversion stages

Funnels accept `{ id, label, value, tone? }` rows. IDs must be unique and nonempty; labels must be
nonempty. Values are nullable, finite and nonnegative. Stage order is preserved, including increases
between stages. Centered bars use one scale based on the largest stage, and visible text preserves
exact values. All-zero stages remain zero rather than becoming full-width bars.

Applications own stage definitions, cohort alignment, aggregation and conversion percentages.
Lumen does not infer rates or reorder stages. Use `formatValue` and chart `labels` to localize values.

### Distribution summaries

Box plots accept `{ id, label, min, q1, median, q3, max, outliers?, tone? }` rows with precomputed
statistics. `min` and `max` are the lower and upper **whisker bounds**, so supplied outliers can lie
outside them. The ordered contract is `min ≤ q1 ≤ median ≤ q3 ≤ max`. Every statistic must be finite,
or all five must be `null` to represent a missing summary. Missing summaries cannot carry outliers.
Outliers must be finite. IDs must be unique; input order remains unchanged.

Every row shares a numeric domain enclosing all statistics and outliers. Explicit domains that
truncate observations fail closed. Equal statistics remain visible, and numeric extremes produce
finite positions. The box shows the middle two quartiles, a contrasting median, capped whiskers,
and outlined outlier dots. Format every statistic with the same unit. `statisticLabels` customizes
whisker, quartile, median and outlier names; SwiftUI uses `LumenBoxPlotLabels`.

Applications own sample selection, quartile algorithms, whisker policy and outlier detection.
Lumen renders the supplied summaries without changing their statistical meaning.
