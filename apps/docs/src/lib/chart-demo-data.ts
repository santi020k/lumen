import type { LumenChartSeries, LumenHistogramBin, LumenWaterfallDatum } from '@santi020k/lumen-core'

export const chartDemoSeries: readonly LumenChartSeries[] = [
  { id: 'requests',
    label: 'Requests',
    data: [
      { x: 0, xLabel: '09:00', y: 20 },
      { x: 1, xLabel: '09:01', y: 35 },
      { x: 30, xLabel: '09:30', y: null },
      { x: 90, xLabel: '10:30', y: 75 },
      { x: 180, xLabel: '12:00', y: 60 }
    ] },
  { id: 'completed',
    label: 'Completed',
    data: [
      { x: 0, xLabel: '09:00', y: 12 },
      { x: 1, xLabel: '09:01', y: 22 },
      { x: 30, xLabel: '09:30', y: 40 },
      { x: 90, xLabel: '10:30', y: 62 },
      { x: 180, xLabel: '12:00', y: 52 }
    ] }
]

export const chartDemoBins: readonly LumenHistogramBin[] = [
  { start: 0, end: 100, count: 8 },
  { start: 100, end: 200, count: 24 },
  { start: 200, end: 300, count: 42 },
  { start: 300, end: 400, count: 18 }
]

export const chartDemoWaterfall: readonly LumenWaterfallDatum[] = [
  { id: 'opening', label: 'Opening', kind: 'total', value: 120 },
  { id: 'added', label: 'Added', value: 85 },
  { id: 'used', label: 'Used', value: -55 },
  { id: 'closing', label: 'Closing', kind: 'total', value: 150 }
]

export const chartDemoHeatmap = [
  { x: 'Morning', y: 'Monday', value: -4 },
  { x: 'Afternoon', y: 'Monday', value: 4 },
  { x: 'Morning', y: 'Tuesday', value: 0 },
  { x: 'Afternoon', y: 'Tuesday', value: null }
]
