import type { LumenBoxPlotDatum, LumenCalendarHeatmapDatum, LumenChartSeries, LumenFunnelDatum, LumenHeatmapDatum, LumenHistogramBin, LumenWaterfallDatum } from '@santi020k/lumen-core'

const timeline = (values: readonly (number | null)[]) => values.map((y, index) => {
  const x = index < 2 ? index : Math.round((index - 1) * 180 / (values.length - 2))

  return { x, xLabel: `${String(9 + Math.floor(x / 60)).padStart(2, '0')}:${String(x % 60).padStart(2, '0')}`, y }
})

export const chartDemoSeries: readonly LumenChartSeries[] = [
  { id: 'requests',
    label: 'Requests',
    data: timeline([
      48,
      52,
      46,
      61,
      58,
      null,
      78,
      72,
      86,
      82,
      106,
      118,
      110,
      124,
      103,
      98,
      116,
      137,
      129,
      148,
      141,
      165,
      158,
      176,
      169,
      188
    ]) },
  { id: 'completed',
    label: 'Completed',
    data: timeline([
      34, 38, 36, 43, 42, 51, 55, 53, 66, 61, 76, 82, 79, 89, 74, 71, 83, 96, 92, 106, 103, 119, 112, 125, 122, 136
    ]) }
]

export const chartDemoBins: readonly LumenHistogramBin[] = [3, 8, 18, 34, 48, 57, 51, 37, 26, 15, 8, 3]
  .map((count, index) => ({ start: index * 25, end: (index + 1) * 25, count }))

export const chartDemoWaterfall: readonly LumenWaterfallDatum[] = [
  { id: 'opening', label: 'Opening', kind: 'total', value: 120 },
  { id: 'new', label: 'New', value: 85 },
  { id: 'expansion', label: 'Expansion', value: 35 },
  { id: 'churn', label: 'Churn', value: -45, tone: 'series-4' },
  { id: 'credits', label: 'Credits', value: -10, tone: 'series-4' },
  { id: 'closing', label: 'Closing', kind: 'total', value: 185 }
]

export const chartDemoHeatmap: readonly LumenHeatmapDatum[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].flatMap((y, day) => Array.from({ length: 12 }, (_, hour) => ({
  x: hour * 2,
  xLabel: `${String(hour * 2).padStart(2, '0')}:00`,
  y,
  value: day === 5 && hour === 8 ? null : Math.round(Math.sin(hour * 0.55 - day * 0.7) * 7 + Math.cos(day * 1.8) * 2)
})))

export const chartDemoChannels: LumenChartSeries = {
  id: 'channels',
  label: 'Traffic source',
  data: [
    { x: 'Organic', y: 48, tone: 'series-1' },
    { x: 'Direct', y: 27, tone: 'series-2' },
    { x: 'Referral', y: 17, tone: 'series-3' },
    { x: 'Social', y: 8, tone: 'series-4' }
  ]
}

export const chartDemoMetrics = chartDemoSeries.map(series => ({
  label: series.label,
  value: series.data.reduce((total, point) => total + (point.y ?? 0), 0).toLocaleString('en-US'),
  values: series.data.flatMap(point => point.y === null ? [] : [point.y])
}))

export const chartDemoBulletRanges = [
  { end: 70, label: 'Developing' },
  { end: 90, label: 'Consistent' },
  { end: 100, label: 'Excellent' }
]

export const chartDemoComparisons = [
  { id: 'design', label: 'Design', reference: 62, value: 88 },
  { id: 'engineering', label: 'Engineering', reference: 76, value: 91 },
  { id: 'support', label: 'Support', reference: 81, value: 74 },
  { id: 'operations', label: 'Operations', reference: 54, value: 83 }
]

export const chartDemoCalendar: readonly LumenCalendarHeatmapDatum[] = Array.from({ length: 28 }, (_, index) => ({
  date: `2026-08-${String(index + 1).padStart(2, '0')}`,
  value: index === 7 || index === 15 ? null : index % 9
}))
export const chartDemoFunnel: readonly LumenFunnelDatum[] = [
  { id: 'visits', label: 'Visits', value: 4800 },
  { id: 'registered', label: 'Registered', value: 2100 },
  { id: 'activated', label: 'Activated', value: 1250 },
  { id: 'paid', label: 'Paid', value: 640 }
]
export const chartDemoBoxPlots: readonly LumenBoxPlotDatum[] = [
  { id: 'north', label: 'North team', min: 12, q1: 22, median: 31, q3: 44, max: 61, outliers: [8, 73] },
  { id: 'south', label: 'South team', min: 16, q1: 29, median: 38, q3: 48, max: 66, outliers: [78] },
  { id: 'east', label: 'East team', min: 10, q1: 18, median: 24, q3: 36, max: 53 }
]
