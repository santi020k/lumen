import {
  alignLumenChartSeries,
  createLumenHeatmapGeometry,
  createLumenLineGeometry,
  getLumenChartAxisPadding,
  getLumenChartCategories,
  getLumenChartCategoryLabel,
  getLumenChartCategoryTicks,
  getLumenChartDomain,
  getLumenChartNumericX,
  getLumenChartTicks,
  type LumenChartAnnotation,
  type LumenChartDomain,
  type LumenChartScaleType,
  type LumenChartSeries,
  type LumenChartTone,
  type LumenHeatmapDatum,
  scaleLumenChartValue
} from './charts.js'

export interface LumenLineChartOptions {
  annotations?: readonly LumenChartAnnotation[]
  domain?: Partial<LumenChartDomain>
  formatCategory?: (value: number | string) => string
  formatValue?: (value: number) => string
  height?: number
  referenceValue?: number
  width?: number
  xDomain?: Partial<LumenChartDomain>
  xScale?: LumenChartScaleType
}

const chartSize = (value: number | undefined, fallback: number): number => {
  if (value === undefined || !Number.isFinite(value)) return fallback

  return Math.max(240, value)
}

const chartKey = (value: number | string): string => `${typeof value}:${String(value)}`

const resolveDomain = (automatic: LumenChartDomain, requested?: Partial<LumenChartDomain>): LumenChartDomain => {
  const min = requested?.min !== undefined && Number.isFinite(requested.min) ? requested.min : automatic.min
  const max = requested?.max !== undefined && Number.isFinite(requested.max) ? requested.max : automatic.max

  return min < max ? { max, min } : automatic
}

/** Preserves category identity; continuous axes align every series against the same domain. */
export const createLumenLineChartModel = (
  input: readonly LumenChartSeries[],
  options: LumenLineChartOptions = {}
) => {
  const { annotations = [], formatCategory, formatValue = String, xScale = 'categorical' } = options
  const width = chartSize(options.width, 640)
  const height = chartSize(options.height, 240)
  const padding = 44
  const categories = getLumenChartCategories(input).filter(value => xScale === 'categorical' || getLumenChartNumericX(value, xScale) !== null)

  if (xScale !== 'categorical') categories.sort((a, b) => (getLumenChartNumericX(a, xScale) ?? 0) - (getLumenChartNumericX(b, xScale) ?? 0))

  const series = input.map(item => alignLumenChartSeries(item, categories))

  const automaticDomain = getLumenChartDomain([
    ...series.flatMap(item => item.data.map(datum => datum.y)), options.referenceValue ?? null
  ], false)

  const domain = resolveDomain(automaticDomain, options.domain)
  const ticks = getLumenChartTicks(domain)
  const paddingLeft = getLumenChartAxisPadding(ticks.map(formatValue)) * 2

  const numericCategories = categories.flatMap(value => {
    if (xScale === 'categorical') return []

    const number = getLumenChartNumericX(value, xScale)

    return number === null ? [] : [number]
  })

  const xDomain = resolveDomain(getLumenChartDomain(numericCategories, false), options.xDomain)
  const categoryIndexes = new Map(categories.map((category, index) => [category, index]))

  const positionFor = (value: number | string): number | null => {
    if (xScale !== 'categorical') {
      const number = getLumenChartNumericX(value, xScale)

      return number === null ? null : scaleLumenChartValue(number, xDomain, paddingLeft, width - padding)
    }

    const index = categoryIndexes.get(value)

    if (index === undefined) return null

    const ratio = categories.length === 1 ? 0.5 : index / Math.max(1, categories.length - 1)

    return paddingLeft + ratio * (width - padding - paddingLeft)
  }

  const positions = categories.map(value => positionFor(value) ?? paddingLeft)

  const geometries = series.map(item => createLumenLineGeometry(item.data, {
    domain, height, includeZero: false, padding, paddingLeft, width, xDomain, xScale
  }))

  const categoryTicks = getLumenChartCategoryTicks(
    categories.map(value => getLumenChartCategoryLabel(series, value, formatCategory)),
    { end: width - padding, positions, start: paddingLeft }
  ).filter(tick => tick.position >= paddingLeft && tick.position <= width - padding)

  const annotationMarks = annotations.flatMap(annotation => {
    const axis = annotation.axis ?? 'y'
    let value: number | null = null

    if (axis === 'x') value = positionFor(annotation.value)
    else if (typeof annotation.value === 'number' && Number.isFinite(annotation.value)) {
      value = scaleLumenChartValue(annotation.value, domain, height - padding, padding)
    }

    if (value === null) return []

    const inBounds = axis === 'x' ?
      value >= paddingLeft && value <= width - padding :
      value >= padding && value <= height - padding

    if (!inBounds) return []

    return [{ ...annotation, axis, coordinate: value }]
  })

  return {
    annotationMarks,
    categories,
    categoryTicks,
    domain,
    geometries,
    height,
    padding,
    paddingLeft,
    positions,
    series,
    ticks,
    width,
    xDomain
  }
}

export interface LumenWaterfallDatum {
  id: string
  label: string
  /** A total resets the running balance to this explicit value. */
  kind?: 'delta' | 'total'
  tone?: LumenChartTone
  value: number
}

export interface LumenHistogramBin {
  count: number
  end: number
  label?: string
  start: number
}

export interface LumenIntervalChartOptions {
  /** Axis text size in geometry coordinates; native renderers use their unscaled font size. */
  axisFontSize?: number
  formatValue?: (value: number) => string
  height?: number
  width?: number
}

export interface LumenIntervalChartMark {
  end: number
  height: number
  key: string
  label: string
  start: number
  tone: LumenChartTone
  value: number
  width: number
  x: number
  y: number
}

const intervalFrame = (values: readonly number[], options: LumenIntervalChartOptions) => {
  const width = chartSize(options.width, 640)
  const height = chartSize(options.height, 320)
  const domain = getLumenChartDomain(values)
  const ticks = getLumenChartTicks(domain)
  const requestedFontSize = options.axisFontSize

  const fontSize = requestedFontSize !== undefined && Number.isFinite(requestedFontSize) && requestedFontSize > 0 ?
    requestedFontSize :
    24

  const left = Math.min(width - 64, getLumenChartAxisPadding(ticks.map(options.formatValue ?? String)) * fontSize / 12)
  const top = 32
  const right = width - 24
  const bottom = height - 48
  const y = (value: number) => scaleLumenChartValue(value, domain, bottom, top)

  return { bottom, domain, height, left, right, ticks, top, width, y }
}

/** Invalid steps fail closed: silently dropping a change would misstate every later balance. */
export const createLumenWaterfallGeometry = (
  data: readonly LumenWaterfallDatum[],
  options: LumenIntervalChartOptions = {}
) => {
  const ids = new Set<string>()
  let balance = 0

  const steps = data.map(datum => {
    const start = datum.kind === 'total' ? 0 : balance
    const end = datum.kind === 'total' ? datum.value : balance + datum.value

    balance = end

    return { ...datum, end, start }
  })

  const valid = steps.every(step => {
    if (!Number.isFinite(step.value) || !Number.isFinite(step.end) || ids.has(step.id)) return false

    ids.add(step.id)

    return true
  })

  const toneFor = (step: LumenWaterfallDatum): LumenChartTone => {
    if (step.tone) return step.tone

    if (step.kind === 'total') return 'series-1'

    return step.value < 0 ? 'series-3' : 'series-2'
  }

  const frame = intervalFrame(valid ? steps.flatMap(step => [step.start, step.end]) : [], options)
  const band = (frame.right - frame.left) / Math.max(1, steps.length)

  const marks: LumenIntervalChartMark[] = valid ?
    steps.map((step, index) => ({
      end: step.end,
      height: Math.abs(frame.y(step.end) - frame.y(step.start)),
      key: step.id,
      label: step.label,
      start: step.start,
      tone: toneFor(step),
      value: step.value,
      width: band * 0.7,
      x: frame.left + band * (index + 0.15),
      y: Math.min(frame.y(step.start), frame.y(step.end))
    })) :
    []

  const categoryTicks = getLumenChartCategoryTicks(marks.map(mark => mark.label), {
    end: frame.right, positions: marks.map(mark => mark.x + mark.width / 2), start: frame.left
  })

  const connectors = marks.slice(0, -1).flatMap((mark, index) => {
    const next = marks[index + 1]

    return next ? [{ x1: mark.x + mark.width, x2: next.x, y: frame.y(mark.end) }] : []
  })

  return { ...frame, categoryTicks, connectors, marks, valid }
}

export interface LumenHistogramOptions extends LumenIntervalChartOptions {
  /** Density is count divided by bin width; required for unequal-width bins. */
  frequency?: 'count' | 'density'
  formatBoundary?: (value: number) => string
  tone?: LumenChartTone
}

const validHistogramBins = (bins: readonly LumenHistogramBin[], frequency: 'count' | 'density'): boolean => {
  const first = bins[0]
  const binWidth = first ? first.end - first.start : 0

  return bins.every((bin, index) => {
    const previous = bins[index - 1]
    const width = bin.end - bin.start

    if (![bin.start, bin.end, bin.count, width].every(Number.isFinite)) return false

    if (width <= 0 || bin.count < 0) return false

    if (previous && bin.start < previous.end) return false

    return frequency === 'density' || Math.abs(width - binWidth) <= Math.abs(binWidth) * 1e-9
  })
}

const histogramDomain = (bins: readonly LumenHistogramBin[]): LumenChartDomain => ({
  min: bins[0]?.start ?? 0, max: bins.at(-1)?.end ?? 1
})

/** Bins are supplied by the application. Their numeric widths remain visible. */
export const createLumenHistogramGeometry = (
  data: readonly LumenHistogramBin[],
  options: LumenHistogramOptions = {}
) => {
  const bins = [...data].sort((a, b) => a.start - b.start)
  const frequency = options.frequency ?? 'count'
  const valid = validHistogramBins(bins, frequency)
  const valueFor = (bin: LumenHistogramBin): number => frequency === 'density' ? bin.count / (bin.end - bin.start) : bin.count
  const finite = valid && bins.every(bin => Number.isFinite(valueFor(bin)))
  const frame = intervalFrame(finite ? bins.map(valueFor) : [], options)
  const xDomain = histogramDomain(bins)
  const x = (value: number) => scaleLumenChartValue(value, xDomain, frame.left, frame.right)
  const format = options.formatBoundary ?? String

  const marks: LumenIntervalChartMark[] = finite ?
    bins.map(bin => ({
      end: bin.end,
      height: frame.y(0) - frame.y(valueFor(bin)),
      key: chartKey(bin.start),
      label: bin.label ?? `${format(bin.start)}–${format(bin.end)}`,
      start: bin.start,
      tone: options.tone ?? 'series-1',
      value: valueFor(bin),
      width: Math.max(0, x(bin.end) - x(bin.start) - 1),
      x: x(bin.start),
      y: frame.y(valueFor(bin))
    })) :
    []

  const boundaries = finite ? [...new Set(bins.flatMap(bin => [bin.start, bin.end]))].sort((a, b) => a - b) : []

  const categoryTicks = getLumenChartCategoryTicks(boundaries.map(format), {
    end: frame.right, positions: boundaries.map(x), start: frame.left
  })

  return { ...frame, bins: finite ? bins : [], categoryTicks, frequency, marks, valid: finite, xDomain }
}

export interface LumenHeatmapOptions {
  colorScale?: 'diverging' | 'sequential'
  domain?: Partial<LumenChartDomain>
  midpoint?: number
}

const heatmapScale = (automatic: LumenChartDomain, options: LumenHeatmapOptions) => {
  const midpoint = Number.isFinite(options.midpoint) ? options.midpoint ?? 0 : 0

  if (options.colorScale !== 'diverging') return { domain: resolveDomain(automatic, options.domain), midpoint }

  const radius = Math.max(Math.abs(automatic.min - midpoint), Math.abs(automatic.max - midpoint), 1)
  const symmetric = { min: midpoint - radius, max: midpoint + radius }
  const requested = resolveDomain(symmetric, options.domain)
  const finite = (domain: LumenChartDomain) => Number.isFinite(domain.min) && Number.isFinite(domain.max)

  if (finite(requested) && requested.min < midpoint && requested.max > midpoint) return { domain: requested, midpoint }

  if (finite(symmetric)) return { domain: symmetric, midpoint }

  // No finite symmetric extent exists around the requested midpoint; use a neutral zero.
  const fallbackRadius = Math.max(Math.abs(automatic.min), Math.abs(automatic.max), 1)

  return { domain: { min: -fallbackRadius, max: fallbackRadius }, midpoint: 0 }
}

const heatmapLegendBackground = (colorScale: LumenHeatmapOptions['colorScale'], midpointPercent: number): string => {
  if (colorScale === 'diverging') return `linear-gradient(to right, hsl(var(--chart-diverging-negative)), hsl(var(--chart-diverging-mid)) ${midpointPercent}%, hsl(var(--chart-diverging-positive)))`

  return 'linear-gradient(to right, hsl(var(--chart-sequential-low)), hsl(var(--chart-sequential-high)))'
}

/** One cell per coordinate, including explicit missing measurements. */
export const createLumenHeatmapModel = (
  data: readonly LumenHeatmapDatum[], options: LumenHeatmapOptions = {}
) => {
  const seen = new Set<string>()

  const cells = data.filter(cell => {
    const key = JSON.stringify([cell.x, cell.y])

    if (seen.has(key)) return false

    seen.add(key)

    return true
  })

  const base = createLumenHeatmapGeometry(cells, 496, 248)
  const values = cells.flatMap(cell => cell.value !== null && Number.isFinite(cell.value) ? [cell.value] : [])
  const automatic = getLumenChartDomain(values, false)
  const { domain, midpoint } = heatmapScale(automatic, options)
  const midpointPercent = scaleLumenChartValue(midpoint, domain, 0, 100)
  const labelFor = (axis: 'x' | 'y', value: number | string) => cells.find(cell => cell[axis] === value)?.[axis === 'x' ? 'xLabel' : 'yLabel'] ?? String(value)

  const xTicks = getLumenChartCategoryTicks(base.xCategories.map(value => labelFor('x', value)), {
    end: 616,
    positions: base.xCategories.map((_, index) => 120 + (index + 0.5) * 496 / base.xCategories.length),
    start: 120
  })

  const yTicks = base.yCategories.map((value, index) => ({
    label: getLumenChartCategoryTicks([labelFor('y', value)], { end: 104, start: 0 })[0]?.label ?? '',
    position: 24 + (index + 0.5) * 248 / base.yCategories.length,
    value
  }))

  return {
    cells: base.cells.map(cell => ({
      ...cell, xCoordinate: cell.xCoordinate + 120, yCoordinate: cell.yCoordinate + 24
    })),
    domain,
    height: 320,
    legendBackground: heatmapLegendBackground(options.colorScale, midpointPercent),
    midpoint,
    midpointPercent,
    width: 640,
    xTicks,
    yTicks
  }
}

export interface LumenHeatmapColorMix {
  base: 'divergingMid' | 'sequentialLow'
  overlay: 'divergingNegative' | 'divergingPositive' | 'sequentialHigh'
  ratio: number
}

/** Platform-neutral color weights; missing measurements have no color weight. */
export const getLumenHeatmapColorMix = (
  value: number | null, domain: LumenChartDomain, colorScale: 'diverging' | 'sequential' = 'sequential', midpoint = 0
): LumenHeatmapColorMix | null => {
  if (value === null || !Number.isFinite(value)) return null

  const ratio = (start: number, end: number) => {
    if (end === start) return 0.5

    return Math.max(0, Math.min(1, scaleLumenChartValue(value, { min: start, max: end }, 0, 1)))
  }

  if (colorScale === 'diverging') {
    const negative = value < midpoint
    const amount = negative ? 1 - ratio(domain.min, midpoint) : ratio(midpoint, domain.max)

    return { base: 'divergingMid', overlay: negative ? 'divergingNegative' : 'divergingPositive', ratio: amount }
  }

  return { base: 'sequentialLow', overlay: 'sequentialHigh', ratio: ratio(domain.min, domain.max) }
}

export const getLumenHeatmapColor = (
  value: number | null, domain: LumenChartDomain, colorScale: 'diverging' | 'sequential' = 'sequential', midpoint = 0
): string => {
  const mix = getLumenHeatmapColorMix(value, domain, colorScale, midpoint)

  if (!mix) return 'hsl(var(--surface-muted))'

  const token = (name: string) => name.replace(/[A-Z]/gu, letter => `-${letter.toLowerCase()}`)

  return `color-mix(in srgb, hsl(var(--chart-${token(mix.overlay)})) ${mix.ratio * 100}%, hsl(var(--chart-${token(mix.base)})))`
}
