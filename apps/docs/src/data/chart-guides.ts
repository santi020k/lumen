type ChartGuideCategory = 'Activity' | 'Comparison' | 'Composition' | 'Distribution' | 'Relationship' | 'Trend'

type ChartGuideName =
  | 'BarChart' | 'BoxPlot' | 'BulletChart' | 'CalendarHeatmap' | 'ComboChart' | 'DumbbellChart' |
  'FunnelChart' | 'Heatmap' | 'Histogram' | 'LineChart' | 'LollipopChart' | 'PieChart' |
  'RangeChart' | 'ScatterChart' | 'Sparkline' | 'WaterfallChart'

export interface ChartGuide {
  readonly name: ChartGuideName
  readonly slug: string
  readonly category: ChartGuideCategory
  readonly question: string
  readonly description: string
  readonly when: string
  readonly dataShape: string
  readonly dataNotes: readonly string[]
  readonly readingNotes: readonly string[]
  readonly pitfalls: readonly string[]
  readonly related: readonly ChartGuideName[]
}

export const chartGuides: readonly ChartGuide[] = [
  {
    name: 'LineChart',
    slug: 'line-chart',
    category: 'Trend',
    question: 'How does a measure change over time?',
    description: 'Follow one or more ordered series, reveal missing observations, and inspect exact values along a shared axis.',
    when: 'Use a line when the order and movement between observations matter: traffic, temperature, balances, or recurring measurements.',
    dataShape: `import type { LumenChartSeries } from '@santi020k/lumen-core'

const series = [{
  id: 'visits',
  label: 'Visits',
  data: [
    { x: '2026-08-01T00:00:00Z', y: 120 },
    { x: '2026-08-02T00:00:00Z', y: null },
    { x: '2026-08-04T00:00:00Z', y: 180 }
  ]
}] satisfies readonly LumenChartSeries[]`,
    dataNotes: [
      'Give each series a unique id and a readable label. Keep y numeric; use null for an observation that is unavailable.',
      'The default xScale is categorical and spaces categories evenly. Use xScale="time" for elapsed-time spacing or "linear" for numeric spacing.',
      'For time data, use timestamps or ISO dates with an explicit time zone, sort ascending, and use formatCategory to display the intended locale and time zone.'
    ],
    readingNotes: [
      'A break in the line marks a missing observation. Area fill follows the same gaps.',
      'Use annotations or referenceValue to explain an event or threshold. Include the reporting period and units in the heading, description, or caption.',
      'Enable interactive inspection for pointer, touch, and keyboard exploration. Matching syncGroup values synchronize charts at the same X identity; Astro also needs UIPrimitives.'
    ],
    pitfalls: [
      'Do not format dates into ambiguous category strings before plotting a time scale.',
      'A shortened Y domain emphasizes small changes. Keep domains consistent when readers compare separate plots, and disclose the units.'
    ],
    related: ['Sparkline', 'RangeChart', 'ComboChart']
  },
  {
    name: 'Sparkline',
    slug: 'sparkline',
    category: 'Trend',
    question: 'What is the direction behind this metric?',
    description: 'Add a compact trend beside a prominent value without turning a metric card into a full chart.',
    when: 'Use beside a Stat or a table metric when the overall direction matters more than individual coordinates.',
    dataShape: `const values: readonly number[] = [42, 48, 63, 58, 74, 91]
const label = 'Weekly downloads increased from 42 to 91'`,
    dataNotes: [
      'Supply finite numbers in the order readers should follow. Values are spaced by their array index.',
      'The required label is the textual explanation of the trend. Include its measure, period, and a useful observation.'
    ],
    readingNotes: [
      'The endpoint marks the latest available value. area adds a fill below the line; showEndpoint controls the final dot.',
      'Keep the current value and units visible beside the sparkline. Its SVG is decorative; the labeled wrapper provides the accessible meaning.'
    ],
    pitfalls: [
      'This compact chart has no axes, exact-data disclosure, or time-scale prop. Use LineChart when users need to compare individual values or irregular intervals.',
      'Do not replace missing observations with zero to satisfy the number array. Choose a chart with an explicit nullable data contract when gaps matter.'
    ],
    related: ['LineChart', 'BulletChart', 'BarChart']
  },
  {
    name: 'RangeChart',
    slug: 'range-chart',
    category: 'Trend',
    question: 'How does an interval change across observations?',
    description: 'Show low and high bounds as intervals joined by a band, with exact endpoints available in the data table.',
    when: 'Use for forecast bounds, daily temperature ranges, or another ordered sequence where both limits are meaningful.',
    dataShape: `import type { LumenRangeDatum } from '@santi020k/lumen-core'

const data = [
  { x: 'Mon', low: 17, high: 28 },
  { x: 'Tue', low: 19, high: 31 },
  { x: 'Wed', low: null, high: null }
] satisfies readonly LumenRangeDatum[]`,
    dataNotes: [
      'Supply one low/high pair per X identity, in the intended display order. Keep both endpoints finite and ensure low is no greater than high in your application.',
      'A null endpoint removes that interval and breaks the band. The data table still reports each supplied endpoint.',
      'X positions follow input order at equal spacing. Use xLabel for readable category text without changing identity.'
    ],
    readingNotes: [
      'The vertical interval shows the two bounds; the band connects adjacent complete observations.',
      'Explain what the bounds mean in the caption: minimum/maximum, forecast limits, or a stated confidence interval. Use formatValue to attach the same unit to both endpoints.'
    ],
    pitfalls: [
      'A range does not communicate a median, sample size, or probability by itself. State the statistical meaning of a forecast band.',
      'This component does not expose a time-scale prop. Equal spacing can be misleading for irregular observation times.'
    ],
    related: ['LineChart', 'BoxPlot', 'DumbbellChart']
  },
  {
    name: 'BarChart',
    slug: 'bar-chart',
    category: 'Comparison',
    question: 'Which categories are larger or smaller?',
    description: 'Compare already aggregated values with grouped or stacked bars in either orientation.',
    when: 'Use for category totals, rankings, or comparing the same measures across a small set of named groups.',
    dataShape: `import type { LumenChartSeries } from '@santi020k/lumen-core'

const series = [{
  id: 'downloads',
  label: 'Downloads',
  data: [
    { x: 'lumen', xLabel: 'Lumen', y: 18420 },
    { x: 'quality', xLabel: 'Quality', y: 6320 }
  ]
}] satisfies readonly LumenChartSeries[]`,
    dataNotes: [
      'Aggregate source records before passing series. Each series needs a unique id, label, and at most one observation for each category identity.',
      'Reuse the same x identities across series to align categories. Use xLabel for display text and null for unavailable measurements.'
    ],
    readingNotes: [
      'Use horizontal orientation when category names need more room. Grouped bars emphasize comparisons between series; stacked bars emphasize totals and contributions.',
      'Positive and negative values stack separately around zero. Keep the legend and exact-data disclosure available when multiple series share a category.'
    ],
    pitfalls: [
      'Stack only quantities whose sum is meaningful. Percentages with different denominators are not additive.',
      'A bar encodes magnitude through length. Preserve a zero baseline when configuring scales through lower-level chart tools.'
    ],
    related: ['LollipopChart', 'ComboChart', 'PieChart']
  },
  {
    name: 'LollipopChart',
    slug: 'lollipop-chart',
    category: 'Comparison',
    question: 'How do categories rank on one measure?',
    description: 'Use a dot and a stem from zero to make a single ordered comparison easy to scan.',
    when: 'Use for a concise ranking with one measurement per category and readable row labels.',
    dataShape: `import type { LumenComparisonDatum } from '@santi020k/lumen-core'

const data = [
  { id: 'engineering', label: 'Engineering', value: 91 },
  { id: 'design', label: 'Design', value: 88 },
  { id: 'support', label: 'Support', value: null }
] satisfies readonly LumenComparisonDatum[]`,
    dataNotes: [
      'Each row needs a unique nonempty id, a label, and a finite value or null. Input order is preserved; sort a copy in your application to create a ranking.',
      'A supplied domain must be finite, increasing, and include zero plus every measured value. Use the same domain when comparing panels.',
      'The shared comparison datum also accepts reference, but LollipopChart only plots value. Use DumbbellChart to display both endpoints.'
    ],
    readingNotes: [
      'The dot marks the value and the stem shows its distance from zero. Negative values extend to the opposite side of the baseline.',
      'Set valueLabel and formatValue to explain the measurement consistently in row values, ticks, and the exact-data table.'
    ],
    pitfalls: [
      'A null value is unavailable, while zero is an actual measurement. Do not substitute one for the other.',
      'Invalid rows, duplicate ids, or a domain that excludes a value make the dataset invalid; validate before rendering.'
    ],
    related: ['BarChart', 'DumbbellChart', 'BulletChart']
  },
  {
    name: 'DumbbellChart',
    slug: 'dumbbell-chart',
    category: 'Comparison',
    question: 'How much did each category change?',
    description: 'Connect two measurements per row so readers can compare their direction and distance.',
    when: 'Use for before/after comparisons or two consistently defined observations of the same categories.',
    dataShape: `import type { LumenComparisonDatum } from '@santi020k/lumen-core'

const data = [
  { id: 'design', label: 'Design', reference: 62, value: 88 },
  { id: 'support', label: 'Support', reference: 81, value: 74 },
  { id: 'sales', label: 'Sales', reference: null, value: 70 }
] satisfies readonly LumenComparisonDatum[]`,
    dataNotes: [
      'Use unique nonempty ids and labels. value is the current measurement; reference is the comparison and may be omitted or null.',
      'Both measurements use the same numeric unit. Input order is preserved and an explicit domain must enclose zero and every available endpoint.'
    ],
    readingNotes: [
      'Set referenceLabel and valueLabel to name the two observations, such as Previous quarter and Current quarter.',
      'The connector appears only when both endpoints exist. A lone endpoint remains available without implying a zero comparison.'
    ],
    pitfalls: [
      'A movement to the right means a larger value, not necessarily a better outcome. Explain whether higher or lower is desirable.',
      'Do not compare values calculated from different units or incompatible populations as if they were a paired change.'
    ],
    related: ['LollipopChart', 'RangeChart', 'LineChart']
  },
  {
    name: 'BulletChart',
    slug: 'bullet-chart',
    category: 'Comparison',
    question: 'How does performance compare with a target?',
    description: 'Place one actual value, a target marker, and optional labeled performance ranges on a shared scale.',
    when: 'Use for a compact goal comparison, such as service performance, delivery rate, or capacity against a planned limit.',
    dataShape: `import type { LumenBulletRange } from '@santi020k/lumen-core'

const value: number | null = 86
const target = 95
const ranges = [
  { end: 70, label: 'Developing' },
  { end: 90, label: 'Consistent' },
  { end: 100, label: 'Excellent' }
] satisfies readonly LumenBulletRange[]`,
    dataNotes: [
      'value accepts a finite number or null; target must be finite. Keep values numeric and use formatValue for units.',
      'Each optional range needs a nonempty label and a unique finite end. Ranges are sorted by end without mutating your input.',
      'A supplied domain must increase, contain zero, and enclose the actual, target, and all range ends.'
    ],
    readingNotes: [
      'The bar shows actual magnitude from zero. The separate marker shows the target; background bands explain the configured ranges.',
      'Set valueLabel and targetLabel to make the comparison explicit. The exact-data disclosure reports actual, target, and range boundaries.'
    ],
    pitfalls: [
      'A target is not automatically a maximum. Choose a domain that leaves room for exceeding it when that is possible.',
      'Lumen does not decide whether higher values are good. Choose range labels and tones that match the measure.'
    ],
    related: ['LollipopChart', 'DumbbellChart', 'Sparkline']
  },
  {
    name: 'Histogram',
    slug: 'histogram',
    category: 'Distribution',
    question: 'Where are observations concentrated?',
    description: 'Plot explicit numeric bins to reveal the shape, spread, and concentration of a distribution.',
    when: 'Use for a continuous measure such as response time, order value, or duration after your application groups observations into bins.',
    dataShape: `import type { LumenHistogramBin } from '@santi020k/lumen-core'

const bins = [
  { start: 0, end: 100, count: 8 },
  { start: 100, end: 200, count: 24 },
  { start: 200, end: 300, count: 42 }
] satisfies readonly LumenHistogramBin[]`,
    dataNotes: [
      'The application owns binning. Provide finite start/end boundaries with start below end and a finite, nonnegative count.',
      'Bins are sorted by start. They must not overlap; gaps are allowed and keep their numeric spacing.',
      'The default frequency="count" requires equal-width bins. Use frequency="density" for unequal widths; density is count divided by bin width.'
    ],
    readingNotes: [
      'In count mode, height represents observations in a bin. In density mode, area represents count, so a wider bin does not exaggerate its concentration.',
      'Use formatBoundary for the measured axis and formatValue for frequency. The table retains raw counts alongside the plotted frequency.'
    ],
    pitfalls: [
      'Bin width changes the apparent shape. Use the same boundaries when comparing populations and explain your binning convention.',
      'Density here is count per unit of width, not a probability density normalized to a total area of one.'
    ],
    related: ['BoxPlot', 'BarChart', 'ScatterChart']
  },
  {
    name: 'BoxPlot',
    slug: 'box-plot',
    category: 'Distribution',
    question: 'How do distributions differ between groups?',
    description: 'Compare precomputed quartiles, medians, whiskers, and optional outliers without reducing a group to its average.',
    when: 'Use to compare the spread and center of several populations when the underlying summary statistics are already available.',
    dataShape: `import type { LumenBoxPlotDatum } from '@santi020k/lumen-core'

const data = [{
  id: 'search',
  label: 'Search',
  min: 40,
  q1: 58,
  median: 72,
  q3: 92,
  max: 115,
  outliers: [140]
}] satisfies readonly LumenBoxPlotDatum[]`,
    dataNotes: [
      'Compute the statistics in your application. Each uniquely identified row must satisfy min ≤ q1 ≤ median ≤ q3 ≤ max with finite numbers.',
      'min and max are the supplied whisker bounds. Lumen does not calculate quartiles, choose a whisker rule, or detect outliers.',
      'Use all five statistics as null for a missing summary, with no outliers. Partial-null summaries are invalid. A supplied domain must enclose every statistic and outlier.'
    ],
    readingNotes: [
      'The box spans q1 through q3, the middle marker is the median, and the whiskers end at min/max. Separate dots show supplied outliers.',
      'State the quartile and whisker convention in a caption. Use statisticLabels and formatValue to name and format exact values for your audience.'
    ],
    pitfalls: [
      'Do not label whisker bounds as the absolute minimum and maximum when your statistical method excludes outliers.',
      'A box plot does not reveal sample size or multiple peaks. Add that context or use a Histogram when distribution shape matters.'
    ],
    related: ['Histogram', 'RangeChart', 'ScatterChart']
  },
  {
    name: 'PieChart',
    slug: 'pie-chart',
    category: 'Composition',
    question: 'How is a whole divided into parts?',
    description: 'Show a small set of positive contributions as a donut or a traditional pie, with exact values and shares.',
    when: 'Use when categories form one meaningful whole and readers need a broad sense of contribution rather than precise ranking.',
    dataShape: `import type { LumenChartSeries } from '@santi020k/lumen-core'

const series = {
  id: 'frameworks',
  label: 'Framework share',
  data: [
    { x: 'astro', label: 'Astro', y: 46 },
    { x: 'react', label: 'React', y: 31 },
    { x: 'elements', label: 'Web Components', y: 23 }
  ]
} satisfies LumenChartSeries`,
    dataNotes: [
      'Astro and React accept one series object. The Elements series property accepts an array containing that series.',
      'Positive finite y values become slices. Their sum defines the whole and the calculated shares; percentages are not required as input.',
      'Use stable x identities and readable labels. valueFormatter formats measurements without changing the slice proportions.'
    ],
    readingNotes: [
      'variant="donut" is the default; variant="pie" removes the center opening. Keep the legend visible so every slice has a readable identity.',
      'centerLabel and centerValue are supplied display content. Keep them consistent with the same reporting period and population as the slices.'
    ],
    pitfalls: [
      'Zero, negative, missing, and nonfinite values do not become slices. Do not use a pie for signed balances or imply missing categories are measured zero.',
      'Many small or similarly sized slices are hard to compare. Use a BarChart or LollipopChart when exact ranking matters.'
    ],
    related: ['BarChart', 'LollipopChart', 'WaterfallChart']
  },
  {
    name: 'WaterfallChart',
    slug: 'waterfall-chart',
    category: 'Composition',
    question: 'Which changes explain the final balance?',
    description: 'Trace signed additions and deductions between explicit total checkpoints.',
    when: 'Use to explain how an opening balance becomes a closing balance through ordered contributions.',
    dataShape: `import type { LumenWaterfallDatum } from '@santi020k/lumen-core'

const data = [
  { id: 'opening', label: 'Opening', kind: 'total', value: 120 },
  { id: 'sales', label: 'Sales', value: 85 },
  { id: 'expenses', label: 'Expenses', value: -75 },
  { id: 'closing', label: 'Closing', kind: 'total', value: 130 }
] satisfies readonly LumenWaterfallDatum[]`,
    dataNotes: [
      'Provide unique ids, labels, and finite signed values in the intended sequence. Omitted kind means delta.',
      'A delta adds to the running balance. kind="total" resets that balance to the explicit supplied value; it does not calculate a subtotal for you.',
      'Invalid steps, duplicate ids, or an overflowing running balance invalidate the chart so later balances are not silently misstated.'
    ],
    readingNotes: [
      'Floating bars show changes from one balance to the next. Total bars start at zero and establish a checkpoint.',
      'Use valueLabel and formatValue for the common unit. The exact-data table includes each supplied change and its resulting start/end balance.'
    ],
    pitfalls: [
      'Do not pass the final cumulative balance as another delta; mark it as a total.',
      'A total may reset to a value that differs from preceding arithmetic. Reconcile totals in your application and explain intentional adjustments.'
    ],
    related: ['BarChart', 'LineChart', 'BulletChart']
  },
  {
    name: 'FunnelChart',
    slug: 'funnel-chart',
    category: 'Composition',
    question: 'How many observations reach each stage?',
    description: 'Compare the magnitude of an ordered sequence of stages while retaining exact counts.',
    when: 'Use for an explicitly defined cohort progressing through signup, activation, checkout, or another ordered process.',
    dataShape: `import type { LumenFunnelDatum } from '@santi020k/lumen-core'

const data = [
  { id: 'visited', label: 'Visited', value: 600 },
  { id: 'signed-up', label: 'Signed up', value: 180 },
  { id: 'activated', label: 'Activated', value: 96 }
] satisfies readonly LumenFunnelDatum[]`,
    dataNotes: [
      'Each stage needs a unique nonempty id, a label, and a finite nonnegative value or null. Stage order follows the input.',
      'Define the cohort, reporting period, and counting rules before rendering. Lumen does not calculate conversion rates or infer drop-off percentages.',
      'A null stage is unavailable and zero is a measured count. Negative counts and duplicate ids invalidate the dataset.'
    ],
    readingNotes: [
      'Stage widths share a scale based on the largest available value. Exact labels and the data disclosure let readers inspect the counts.',
      'Use the description to identify the cohort and whether observations can skip, repeat, or re-enter stages.'
    ],
    pitfalls: [
      'A later stage may be larger because the component preserves your data. Do not describe the shape as conversion unless the underlying cohort supports that reading.',
      'Separate totals from different time windows do not automatically form a valid funnel.'
    ],
    related: ['BarChart', 'WaterfallChart', 'BulletChart']
  },
  {
    name: 'ComboChart',
    slug: 'combo-chart',
    category: 'Comparison',
    question: 'How do different measures move on one shared scale?',
    description: 'Combine bar, line, and area marks over aligned categories with a single meaningful value domain.',
    when: 'Use when different mark styles help distinguish related measures that share a unit, such as revenue and profit in the same currency.',
    dataShape: `import type { LumenComboSeries } from '@santi020k/lumen-core'

const series = [
  {
    id: 'revenue', label: 'Revenue', mark: 'bar',
    data: [{ x: 'Q1', y: 128 }, { x: 'Q2', y: 154 }]
  },
  {
    id: 'profit', label: 'Profit', mark: 'line',
    data: [{ x: 'Q1', y: 42 }, { x: 'Q2', y: 49 }]
  }
] satisfies readonly LumenComboSeries[]`,
    dataNotes: [
      'Each series has a unique id, label, and mark of bar, line, or area. Points use the shared x/y datum contract.',
      'Matching category identities align the marks. Use null for missing observations and keep all series in the same numeric unit.'
    ],
    readingNotes: [
      'The mark type distinguishes each measure without requiring color alone. Keep the series legend and a caption explaining the marks.',
      'All marks use one value domain. formatValue applies the same units to the shared chart and data alternative.'
    ],
    pitfalls: [
      'There is no secondary-axis prop. Do not plot currency and percentage rates together as if their numeric magnitudes were comparable.',
      'A series with much smaller values can disappear against a larger series. Use separate charts when the shared scale hides the question.'
    ],
    related: ['BarChart', 'LineChart', 'ScatterChart']
  },
  {
    name: 'ScatterChart',
    slug: 'scatter-chart',
    category: 'Relationship',
    question: 'How are two numeric measures related?',
    description: 'Position observations on independent numeric axes and optionally encode a third measure with bubble size.',
    when: 'Use to explore relationships, clusters, and outliers across observations with both X and Y measurements.',
    dataShape: `import type { LumenChartSeries } from '@santi020k/lumen-core'

const series = [{
  id: 'teams',
  label: 'Teams',
  data: [
    { id: 'starter', label: 'Starter teams', x: 12, y: 24, size: 18 },
    { id: 'growing', label: 'Growing teams', x: 38, y: 57, size: 32 }
  ]
}] satisfies readonly LumenChartSeries[]`,
    dataNotes: [
      'Use finite numeric X values for the default linear scale, or timestamps/ISO dates for xScale="time". Logarithmic X values must be positive.',
      'Y measurements are finite numbers or null. Optional size values must be finite and nonnegative; use labels to identify observations.',
      'domain controls Y and xDomain controls X. formatX and formatY let each axis use its own measurement unit.'
    ],
    readingNotes: [
      'Point position shows the X/Y pair. When size is supplied, explain what bubble magnitude represents in the caption.',
      'Use labeled references for meaningful lines or regions, such as a threshold. The data table retains both coordinates and supplied size.'
    ],
    pitfalls: [
      'Association does not establish causation. State the population and relevant sampling limits.',
      'Overlapping points can hide observations. Inspect exact data and consider grouping or filtering in the application when the plot becomes dense.'
    ],
    related: ['Heatmap', 'Histogram', 'LineChart']
  },
  {
    name: 'Heatmap',
    slug: 'heatmap',
    category: 'Activity',
    question: 'Where are the strongest patterns across two categories?',
    description: 'Encode a labeled row/column matrix with a sequential or diverging scale and an explicit missing-data marker.',
    when: 'Use for a matrix such as weekday by hour, region by product, or another pair of categorical dimensions.',
    dataShape: `import type { LumenHeatmapDatum } from '@santi020k/lumen-core'

const data = [
  { x: 'Morning', y: 'Monday', value: 18 },
  { x: 'Afternoon', y: 'Monday', value: 42 },
  { x: 'Morning', y: 'Tuesday', value: null },
  { x: 'Afternoon', y: 'Tuesday', value: 64 }
] satisfies readonly LumenHeatmapDatum[]`,
    dataNotes: [
      'Each datum identifies a column with x, a row with y, and a finite value or null. Aggregate duplicate row/column pairs before plotting.',
      'Use xLabel and yLabel when readable labels differ from the stored identities. Keep numeric source values separate from formatValue output.',
      'Use a sequential colorScale for magnitude. Use "diverging" with an explicit meaningful midpoint for differences around a reference.'
    ],
    readingNotes: [
      'The scale legend shows domain endpoints and the diverging midpoint when applicable. Missing observations use a separate × marker.',
      'Keep the exact-data disclosure available: readers should not have to estimate values from color. Share the same domain across comparable matrices.'
    ],
    pitfalls: [
      'Do not treat missing cells as zero activity. Supply explicit null observations where absence needs to remain visible.',
      'A heatmap is best for patterns, not small numerical differences. Use a table or bars when precise comparisons are the primary task.'
    ],
    related: ['CalendarHeatmap', 'ScatterChart', 'BarChart']
  },
  {
    name: 'CalendarHeatmap',
    slug: 'calendar-heatmap',
    category: 'Activity',
    question: 'When does daily activity happen?',
    description: 'Arrange observations by calendar day so weekly rhythms, quiet periods, and missing dates remain visible.',
    when: 'Use for daily activity, contributions, attendance, or another measure with one observation per calendar date.',
    dataShape: `import type { LumenCalendarHeatmapDatum } from '@santi020k/lumen-core'

const startDate = '2026-08-01'
const endDate = '2026-08-07'
const data = [
  { date: '2026-08-01', value: 3 },
  { date: '2026-08-02', value: 0 },
  { date: '2026-08-03', value: null },
  { date: '2026-08-07', value: 6 }
] satisfies readonly LumenCalendarHeatmapDatum[]`,
    dataNotes: [
      'startDate and endDate define an inclusive YYYY-MM-DD Gregorian range of at most 3660 days. Date identity is independent of locale and time zone.',
      'Each supplied date must be unique and inside that range. Values are finite numbers or null; omitted dates remain missing.',
      'Set weekStartsOn to 0 for Sunday or 1 for Monday. A custom weekdayLabels array always uses Sunday-first indexing, regardless of the first displayed day.'
    ],
    readingNotes: [
      'Each cell represents a day; color represents magnitude. A measured zero remains distinct from a missing date.',
      'Use formatDate and formatValue for localized output. A supplied domain must be increasing and enclose every observed value.',
      'When formatting date-only identities with Intl.DateTimeFormat, specify timeZone: \'UTC\' so local time zones do not shift the calendar day.'
    ],
    pitfalls: [
      'Do not pass timestamp strings in place of date-only identities. Convert events into the intended reporting date and aggregate them before rendering.',
      'Automatic color domains can differ between periods. Use a shared domain when comparing two calendars.'
    ],
    related: ['Heatmap', 'LineChart', 'Sparkline']
  }
]

export const getChartGuide = (name: string): ChartGuide | undefined => chartGuides.find(guide => guide.name === name)
