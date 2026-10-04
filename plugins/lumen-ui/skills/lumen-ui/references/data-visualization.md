# Data Visualization Selection

Choose the encoding from the question, then retrieve the selected component's current usage
contract for the installed framework and version. These are catalog names, not a promise that an
older installed package or every native adapter exposes them. Use native list/get tools for native
availability; native component names and data types can differ from web names.

## Choose by Question

| Question | Component | Decision rule |
| --- | --- | --- |
| One compact trend | `Sparkline` | Pair with a labeled metric; omit axes and legends. |
| Compare categories | `BarChart` | Stack only when the combined total matters. |
| Ordered or time-based trend | `LineChart` | Preserve missing observations as gaps; use the matching X scale. |
| Small positive part-to-whole breakdown | `PieChart` | Prefer bars for precise comparison or more than about seven slices. |
| Relationship between numeric measures | `ScatterChart` | Bubble size needs a meaningful third measure. |
| Concentration in a labeled matrix | `Heatmap` | Use a diverging scale only with a meaningful neutral midpoint. |
| Daily activity | `CalendarHeatmap` | Use date-only identities; omitted days stay missing. |
| Cohort stages | `FunnelChart` | Preserve stage order; the application calculates conversion rates. |
| Distribution summaries | `BoxPlot` | Supply precomputed quartiles, whisker bounds, and outliers. |
| Low-to-high intervals | `RangeChart` | Use the same unit and domain for both bounds. |
| Magnitudes and trends together | `ComboChart` | Mixed marks must share a meaningful value domain. |
| Changes explaining a final balance | `WaterfallChart` | Supply signed deltas and explicit totals. |
| Ranked categories | `LollipopChart` | Use a common scale with a zero-based stem. |
| Reference versus current values | `DumbbellChart` | Make both endpoints and their units explicit. |
| Actual versus target | `BulletChart` | Use a zero-inclusive domain and meaningful target/range labels. |
| Binned observations | `Histogram` | Supply bins and counts; unequal widths require density. |
| Specialized custom plot | `Chart` | Use the web escape hatch with Lumen tokens and accessible data. |

## Data and Presentation Boundaries

- Retrieve props and examples before implementation. Series charts and specialized charts do not
  all accept the same data shape. Do not pass `LumenChartSeries` to every chart.
- Applications own aggregation, binning, statistics, cohort definitions, locale/timezone formatting,
  units, streaming, persistence, and selection policy. Lumen renders the supplied observations.
- Use stable, unique identities rather than localized display labels. Preserve `null` as missing;
  finite zero remains a measurement. Validate untrusted input with the selected contract's helpers.
- Keep accessible context and exact data. Retain `showTable` on web or `showData` on native unless
  equivalent readable data is already available. Never communicate a value only through color.
- Calendar heatmaps use strict `YYYY-MM-DD` identities with an inclusive range containing every
  observation. Box plots require ordered statistics; `min` and `max` are whisker bounds, not the
  extrema including outliers. Histograms render application-supplied bins without calculating them.
- Localize chart-owned labels and formatters as well as surrounding copy. Use semantic chart tokens
  and verify narrow layouts, keyboard inspection, and the data disclosure where supported.

Web charts ship in the existing adapter packages; load the complete `styles.css` once. Astro needs
`UIPrimitives` for interactive LineChart enhancement; static plots and tables remain usable without
it. React owns its interaction. Elements needs public element registration and typed properties for
structured data and formatters. In React Server Components apps, keep formatter functions in a
client component. Confirm setup against the installed version.

Read the [visualization guide](https://lumen.santi020k.com/docs/web/data-visualization) for recipes,
then use MCP usage contracts or installed package types for exact props. If the public guide or
hosted catalog is older than the installed package, inspect the matching package documentation and
source rather than inventing an API or upgrading the application silently.
