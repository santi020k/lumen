export const lumenChartTones = [
  'series-1',
  'series-2',
  'series-3',
  'series-4',
  'series-5',
  'series-6',
  'series-7',
  'series-8',
  'brand',
  'accent',
  'success',
  'warning',
  'danger',
  'neutral'
] as const

export type LumenChartTone = (typeof lumenChartTones)[number]

export type LumenChartScaleType = 'categorical' | 'linear' | 'time'
export type LumenChartAxisPosition = 'bottom' | 'left' | 'right' | 'top'

export interface LumenChartAxis {
  domain?: Partial<LumenChartDomain>
  label?: string
  position?: LumenChartAxisPosition
  scale?: LumenChartScaleType
  tickCount?: number
  unit?: string
}

export interface LumenChartDatum {
  id?: string
  label?: string
  size?: number | null
  tone?: LumenChartTone
  x: number | string
  xLabel?: string
  y: number | null
}

export interface LumenChartSeries {
  data: readonly LumenChartDatum[]
  dash?: 'dashed' | 'dotted' | 'solid'
  id: string
  label: string
  tone?: LumenChartTone
}

export interface LumenChartSelection {
  seriesId: string
  x: number | string
}

export interface LumenChartAnnotation {
  axis?: 'x' | 'y'
  id: string
  label: string
  tone?: LumenChartTone
  value: number | string
}

export interface LumenChartValidationIssue {
  code:
    | 'duplicate-datum-id' |
    'duplicate-series-id' |
    'invalid-size' |
    'invalid-x' |
    'invalid-y' |
    'unsorted-x'
  message: string
  path: string
}

export interface LumenChartSummary {
  availablePointCount: number
  maximum: number | null
  minimum: number | null
  missingPointCount: number
  seriesCount: number
}

export interface LumenChartDomain {
  max: number
  min: number
}

export interface LumenChartGeometryPoint extends LumenChartDatum {
  xCoordinate: number
  yCoordinate: number
}

export interface LumenLineGeometry {
  areaPaths: readonly string[]
  domain: LumenChartDomain
  path: string
  points: readonly LumenChartGeometryPoint[]
  xDomain?: LumenChartDomain
}

export interface LumenLineGeometryOptions {
  domain?: Partial<LumenChartDomain>
  height?: number
  includeZero?: boolean
  padding?: number
  width?: number
  xDomain?: Partial<LumenChartDomain>
  xScale?: LumenChartScaleType
}

export type LumenBarChartLayout = 'grouped' | 'stacked'
export type LumenChartOrientation = 'horizontal' | 'vertical'

export interface LumenBarGeometryMark {
  category: number | string
  height: number
  seriesId: string
  seriesLabel: string
  tone: LumenChartTone
  value: number
  width: number
  x: number
  y: number
}

export interface LumenBarGeometryCategory {
  category: number | string
  label: number | string
  x: number
  y: number
}

export interface LumenBarGeometry {
  categories: readonly LumenBarGeometryCategory[]
  domain: LumenChartDomain
  height: number
  marks: readonly LumenBarGeometryMark[]
  width: number
}

export interface LumenBarGeometryOptions {
  categoryWidth?: number
  domain?: Partial<LumenChartDomain>
  height?: number
  layout?: LumenBarChartLayout
  orientation?: LumenChartOrientation
  width?: number
}

export type LumenPieChartVariant = 'donut' | 'pie'

const lumenChartToneClassNames: Record<LumenChartTone, string> = {
  accent: 'ui-chart-tone--accent',
  brand: 'ui-chart-tone--brand',
  danger: 'ui-chart-tone--danger',
  neutral: 'ui-chart-tone--neutral',
  'series-1': 'ui-chart-tone--series-1',
  'series-2': 'ui-chart-tone--series-2',
  'series-3': 'ui-chart-tone--series-3',
  'series-4': 'ui-chart-tone--series-4',
  'series-5': 'ui-chart-tone--series-5',
  'series-6': 'ui-chart-tone--series-6',
  'series-7': 'ui-chart-tone--series-7',
  'series-8': 'ui-chart-tone--series-8',
  success: 'ui-chart-tone--success',
  warning: 'ui-chart-tone--warning'
}

const lumenPieChartVariantClassNames: Record<LumenPieChartVariant, string> = {
  donut: 'ui-pie-chart--donut',
  pie: 'ui-pie-chart--pie'
}

export interface LumenPieGeometrySlice {
  label: string
  path: string
  percentage: number
  tone: LumenChartTone
  value: number
  x: number | string
}

export interface LumenPieGeometry {
  center: number
  innerRadius: number
  outerRadius: number
  size: number
  slices: readonly LumenPieGeometrySlice[]
  total: number
}

export interface LumenPieGeometryOptions {
  padding?: number
  size?: number
  variant?: LumenPieChartVariant
}

export type LumenComboMark = 'area' | 'bar' | 'line'

export interface LumenComboSeries extends LumenChartSeries {
  mark: LumenComboMark
}

export interface LumenScatterGeometryPoint extends LumenChartGeometryPoint {
  radius: number
  seriesId: string
  seriesLabel: string
  tone: LumenChartTone
}

export interface LumenScatterGeometry {
  domain: LumenChartDomain
  height: number
  points: readonly LumenScatterGeometryPoint[]
  width: number
  xDomain: LumenChartDomain
}

export interface LumenScatterGeometryOptions {
  domain?: Partial<LumenChartDomain>
  height?: number
  maximumRadius?: number
  minimumRadius?: number
  padding?: number
  width?: number
  xDomain?: Partial<LumenChartDomain>
  xScale?: Exclude<LumenChartScaleType, 'categorical'>
}

export interface LumenHeatmapDatum {
  id?: string
  label?: string
  tone?: LumenChartTone
  value: number | null
  x: number | string
  xLabel?: string
  y: number | string
  yLabel?: string
}

export interface LumenHeatmapGeometryCell extends LumenHeatmapDatum {
  height: number
  ratio: number
  width: number
  xCoordinate: number
  yCoordinate: number
}

export interface LumenHeatmapGeometry {
  cells: readonly LumenHeatmapGeometryCell[]
  domain: LumenChartDomain
  height: number
  width: number
  xCategories: readonly (number | string)[]
  yCategories: readonly (number | string)[]
}

export interface LumenRangeDatum {
  high: number | null
  id?: string
  label?: string
  low: number | null
  x: number | string
  xLabel?: string
}

export interface LumenRangeGeometryPoint extends LumenRangeDatum {
  highCoordinate: number
  lowCoordinate: number
  xCoordinate: number
}

export interface LumenRangeGeometry {
  areaPath: string
  domain: LumenChartDomain
  points: readonly LumenRangeGeometryPoint[]
}

const defaultChartSize = 100
const defaultChartPadding = 4

export const hasLumenChartData = (
  series: readonly LumenChartSeries[]
): boolean => series.some(item => item.data.some(datum => datum.y !== null && Number.isFinite(datum.y)))

export const hasLumenPieData = (data: readonly LumenChartDatum[]): boolean => data.some(
  datum => datum.y !== null && Number.isFinite(datum.y) && datum.y > 0
)

export const getLumenChartDomain = (
  values: readonly (number | null)[],
  includeZero = true
): LumenChartDomain => {
  let min = Number.POSITIVE_INFINITY
  let max = Number.NEGATIVE_INFINITY

  for (const value of values) {
    if (value === null || !Number.isFinite(value)) continue

    min = Math.min(min, value)

    max = Math.max(max, value)
  }

  if (!Number.isFinite(min) || !Number.isFinite(max)) return { max: 1, min: 0 }

  if (includeZero) {
    min = Math.min(0, min)

    max = Math.max(0, max)
  }

  if (min === max) {
    const offset = Math.abs(min || 1) * 0.1

    min -= offset

    max += offset
  }

  return { max, min }
}

const resolveLumenChartDomain = (
  values: readonly (number | null)[],
  requested: Partial<LumenChartDomain> | undefined,
  includeZero: boolean
): LumenChartDomain => {
  const calculated = getLumenChartDomain(values, includeZero)

  return {
    max: requested?.max ?? calculated.max,
    min: requested?.min ?? calculated.min
  }
}

export const scaleLumenChartValue = (
  value: number,
  domain: LumenChartDomain,
  rangeStart: number,
  rangeEnd: number
): number => {
  const domainSize = domain.max - domain.min

  if (!Number.isFinite(value) || domainSize === 0) return rangeStart

  const ratio = (value - domain.min) / domainSize

  return rangeStart + ratio * (rangeEnd - rangeStart)
}

export const getLumenChartTicks = (
  domain: LumenChartDomain,
  count = 5
): number[] => {
  const safeCount = Math.max(2, Math.round(count))
  const span = domain.max - domain.min

  if (!Number.isFinite(span) || span <= 0) return [domain.min, domain.max]

  const roughStep = span / (safeCount - 1)
  const magnitude = 10 ** Math.floor(Math.log10(roughStep))
  const residual = roughStep / magnitude
  let niceFactor = 1

  if (residual >= 7.5) niceFactor = 10
  else if (residual >= 3.5) niceFactor = 5
  else if (residual >= 1.5) niceFactor = 2

  const step = niceFactor * magnitude
  const first = Math.ceil(domain.min / step) * step
  const last = Math.floor(domain.max / step) * step
  const ticks: number[] = []

  for (let value = first; value <= last + step / 1000; value += step) {
    ticks.push(Number(value.toPrecision(12)))
  }

  if (ticks.length >= 2) return ticks

  return [domain.min, domain.max]
}

export const resolveLumenChartTone = (
  tone: LumenChartTone | undefined,
  index = 0
): LumenChartTone => tone ?? lumenChartTones[index % 8] ?? 'series-1'

export const getLumenChartToneClassName = (
  tone: LumenChartTone | undefined,
  index = 0
): string => lumenChartToneClassNames[resolveLumenChartTone(tone, index)]

export const getLumenPieChartVariantClassName = (
  variant: LumenPieChartVariant
): string => lumenPieChartVariantClassNames[variant]

interface LumenPolarPoint {
  x: number
  y: number
}

const polarPoint = (
  center: number,
  radius: number,
  angle: number
): LumenPolarPoint => {
  const radians = (angle * Math.PI) / 180

  return {
    x: center + Math.cos(radians) * radius,
    y: center + Math.sin(radians) * radius
  }
}

const formatPieCoordinate = (value: number): string => value.toFixed(3)

const pieArc = (
  radius: number,
  largeArc: boolean,
  sweep: 0 | 1,
  point: LumenPolarPoint
): string => [
  'A',
  formatPieCoordinate(radius),
  formatPieCoordinate(radius),
  0,
  largeArc ? 1 : 0,
  sweep,
  formatPieCoordinate(point.x),
  formatPieCoordinate(point.y)
].join(' ')

const fullPiePath = (
  center: number,
  outerRadius: number,
  innerRadius: number
): string => {
  const topOuter = polarPoint(center, outerRadius, -90)
  const bottomOuter = polarPoint(center, outerRadius, 90)

  const outer = [
    `M ${formatPieCoordinate(topOuter.x)} ${formatPieCoordinate(topOuter.y)}`,
    pieArc(outerRadius, true, 1, bottomOuter),
    pieArc(outerRadius, true, 1, topOuter),
    'Z'
  ]

  if (innerRadius === 0) return outer.join(' ')

  const topInner = polarPoint(center, innerRadius, -90)
  const bottomInner = polarPoint(center, innerRadius, 90)

  return [
    ...outer,
    `M ${formatPieCoordinate(topInner.x)} ${formatPieCoordinate(topInner.y)}`,
    pieArc(innerRadius, true, 0, bottomInner),
    pieArc(innerRadius, true, 0, topInner),
    'Z'
  ].join(' ')
}

const pieSlicePath = (
  center: number,
  outerRadius: number,
  innerRadius: number,
  startAngle: number,
  endAngle: number
): string => {
  if (endAngle - startAngle >= 359.999) {
    return fullPiePath(center, outerRadius, innerRadius)
  }

  const outerStart = polarPoint(center, outerRadius, startAngle)
  const outerEnd = polarPoint(center, outerRadius, endAngle)
  const largeArc = endAngle - startAngle > 180

  if (innerRadius === 0) {
    return [
      `M ${formatPieCoordinate(center)} ${formatPieCoordinate(center)}`,
      `L ${formatPieCoordinate(outerStart.x)} ${formatPieCoordinate(outerStart.y)}`,
      pieArc(outerRadius, largeArc, 1, outerEnd),
      'Z'
    ].join(' ')
  }

  const innerStart = polarPoint(center, innerRadius, startAngle)
  const innerEnd = polarPoint(center, innerRadius, endAngle)

  return [
    `M ${formatPieCoordinate(outerStart.x)} ${formatPieCoordinate(outerStart.y)}`,
    pieArc(outerRadius, largeArc, 1, outerEnd),
    `L ${formatPieCoordinate(innerEnd.x)} ${formatPieCoordinate(innerEnd.y)}`,
    pieArc(innerRadius, largeArc, 0, innerStart),
    'Z'
  ].join(' ')
}

export const createLumenPieGeometry = (
  data: readonly LumenChartDatum[],
  options: LumenPieGeometryOptions = {}
): LumenPieGeometry => {
  const size = Math.max(1, options.size ?? 320)
  const padding = Math.max(0, options.padding ?? 12)
  const center = size / 2
  const outerRadius = Math.max(0, center - padding)
  const innerRadius = options.variant === 'pie' ? 0 : outerRadius * 0.58

  const available = data.filter(
    (datum): datum is LumenChartDatum & { y: number } => datum.y !== null && Number.isFinite(datum.y) && datum.y > 0
  )

  const total = available.reduce((sum, datum) => sum + datum.y, 0)
  let angle = -90

  const slices = available.map((datum, index) => {
    const percentage = total === 0 ? 0 : datum.y / total
    const startAngle = angle

    const endAngle =
      index === available.length - 1 ? 270 : startAngle + percentage * 360

    angle = endAngle

    return {
      label: datum.label ?? datum.xLabel ?? String(datum.x),
      path: pieSlicePath(
        center, outerRadius, innerRadius, startAngle, endAngle
      ),
      percentage,
      tone: resolveLumenChartTone(datum.tone, index),
      value: datum.y,
      x: datum.x
    }
  })

  return {
    center,
    innerRadius,
    outerRadius,
    size,
    slices,
    total
  }
}

export const getLumenChartNumericX = (
  value: number | string,
  scale: Exclude<LumenChartScaleType, 'categorical'>
): number | null => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null

  if (scale === 'linear') {
    const numeric = Number(value)

    return Number.isFinite(numeric) ? numeric : null
  }

  const timestamp = Date.parse(value)

  return Number.isFinite(timestamp) ? timestamp : null
}

const getLumenChartXDomain = (
  data: readonly LumenChartDatum[],
  scale: Exclude<LumenChartScaleType, 'categorical'>,
  requested: Partial<LumenChartDomain> | undefined
): LumenChartDomain => {
  const calculated = getLumenChartDomain(
    data.map(datum => getLumenChartNumericX(datum.x, scale)),
    false
  )

  return {
    max: requested?.max ?? calculated.max,
    min: requested?.min ?? calculated.min
  }
}

const getLumenLineXCoordinate = (
  datum: LumenChartDatum,
  index: number,
  dataLength: number,
  padding: number,
  drawableWidth: number,
  xScale: LumenChartScaleType,
  xDomain: LumenChartDomain | undefined
): number | null => {
  if (xScale === 'categorical') {
    const denominator = Math.max(1, dataLength - 1)

    return padding + (dataLength === 1 ? 0.5 : index / denominator) * drawableWidth
  }

  const numericX = getLumenChartNumericX(datum.x, xScale)

  if (numericX === null || xDomain === undefined) return null

  return scaleLumenChartValue(numericX, xDomain, padding, padding + drawableWidth)
}

const isAvailableLumenChartY = (value: number | null): value is number => value !== null && Number.isFinite(value)

const splitGeometrySegments = (
  data: readonly LumenChartDatum[],
  domain: LumenChartDomain,
  width: number,
  height: number,
  padding: number,
  xScale: LumenChartScaleType,
  xDomain: LumenChartDomain | undefined
): LumenChartGeometryPoint[][] => {
  const drawableWidth = Math.max(0, width - padding * 2)
  const drawableHeight = Math.max(0, height - padding * 2)
  const segments: LumenChartGeometryPoint[][] = []
  let current: LumenChartGeometryPoint[] = []

  for (const [index, datum] of data.entries()) {
    const xCoordinate = getLumenLineXCoordinate(
      datum, index, data.length, padding, drawableWidth, xScale, xDomain
    )

    if (!isAvailableLumenChartY(datum.y) || xCoordinate === null) {
      if (current.length > 0) segments.push(current)

      current = []

      continue
    }

    current.push({
      ...datum,
      xCoordinate,
      yCoordinate: scaleLumenChartValue(
        datum.y, domain, padding + drawableHeight, padding
      )
    })
  }

  if (current.length > 0) segments.push(current)

  return segments
}

const segmentPath = (points: readonly LumenChartGeometryPoint[]): string => points
  .map(
    (point, index) => `${index === 0 ? 'M' : 'L'} ${point.xCoordinate.toFixed(3)} ${point.yCoordinate.toFixed(3)}`
  )
  .join(' ')

const lumenLineAreaPath = (
  points: readonly LumenChartGeometryPoint[],
  baseline: number
): string => {
  const first = points[0]
  const last = points[points.length - 1]

  if (!first || !last) return ''

  return [
    segmentPath(points),
    'L',
    last.xCoordinate.toFixed(3),
    baseline.toFixed(3),
    'L',
    first.xCoordinate.toFixed(3),
    baseline.toFixed(3),
    'Z'
  ].join(' ')
}

export const createLumenLineGeometry = (
  data: readonly LumenChartDatum[],
  options: LumenLineGeometryOptions = {}
): LumenLineGeometry => {
  const {
    domain: requestedDomain,
    height = defaultChartSize,
    includeZero = false,
    padding = defaultChartPadding,
    width = defaultChartSize,
    xDomain: requestedXDomain,
    xScale = 'categorical'
  } = options

  const domainValues = xScale === 'categorical' ?
    data.map(datum => datum.y) :
    data
      .filter(datum => getLumenChartNumericX(datum.x, xScale) !== null)
      .map(datum => datum.y)

  const domain = resolveLumenChartDomain(domainValues, requestedDomain, includeZero)

  const xDomain =
    xScale === 'categorical' ? undefined : getLumenChartXDomain(data, xScale, requestedXDomain)

  const segments = splitGeometrySegments(
    data, domain, width, height, padding, xScale, xDomain
  )

  const baseline = scaleLumenChartValue(
    Math.max(domain.min, Math.min(domain.max, 0)), domain, height - padding, padding
  )

  return {
    areaPaths: segments
      .map(points => lumenLineAreaPath(points, baseline))
      .filter(Boolean),
    domain,
    path: segments.map(segmentPath).join(' '),
    points: segments.flat(),
    ...(xDomain === undefined ? {} : { xDomain })
  }
}

export const getLumenChartValueRatio = (
  value: number,
  domain: LumenChartDomain
): number => {
  const ratio = scaleLumenChartValue(value, domain, 0, 1)

  return Math.max(0, Math.min(1, ratio))
}

export const getLumenChartCategories = (
  series: readonly LumenChartSeries[]
): (number | string)[] => {
  const categories = new Map<string, number | string>()

  for (const item of series) {
    for (const datum of item.data) {
      const key = `${typeof datum.x}:${String(datum.x)}`

      if (!categories.has(key)) categories.set(key, datum.x)
    }
  }

  return [...categories.values()]
}

const lumenChartCategoryKey = (category: number | string): string => `${typeof category}:${String(category)}`

const indexLumenChartSeries = (
  series: LumenChartSeries
): ReadonlyMap<string, LumenChartDatum> => new Map(
  series.data.map(datum => [lumenChartCategoryKey(datum.x), datum])
)

export const alignLumenChartSeries = (
  series: LumenChartSeries,
  categories: readonly (number | string)[]
): LumenChartSeries => {
  const indexed = indexLumenChartSeries(series)

  return {
    ...series,
    data: categories.map(
      category => indexed.get(lumenChartCategoryKey(category)) ?? {
        x: category,
        y: null
      }
    )
  }
}

const getDatumValue = (
  series: ReadonlyMap<string, LumenChartDatum>,
  category: number | string
): number => {
  const value = series.get(lumenChartCategoryKey(category))?.y

  return value !== null && value !== undefined && Number.isFinite(value) ? value : 0
}

const getStackedDomain = (
  series: readonly LumenChartSeries[],
  categories: readonly (number | string)[]
): LumenChartDomain => {
  const indexedSeries = series.map(indexLumenChartSeries)

  const totals = categories.flatMap(category => {
    let positive = 0
    let negative = 0

    for (const item of indexedSeries) {
      const value = getDatumValue(item, category)

      if (value >= 0) positive += value
      else negative += value
    }

    return [negative, positive]
  })

  return getLumenChartDomain(totals)
}

const getBarStartValue = (
  layout: LumenBarChartLayout,
  value: number,
  positiveOffset: number,
  negativeOffset: number
): number => {
  if (layout !== 'stacked') return 0

  return value >= 0 ? positiveOffset : negativeOffset
}

/* eslint-disable complexity -- Bar geometry deliberately keeps both orientations and layouts in one deterministic pass. */
export const createLumenBarGeometry = (
  series: readonly LumenChartSeries[],
  options: LumenBarGeometryOptions = {}
): LumenBarGeometry => {
  const width = options.width ?? 640
  const height = options.height ?? 320
  const orientation = options.orientation ?? 'vertical'
  const layout = options.layout ?? 'grouped'
  const categories = getLumenChartCategories(series)
  const indexedSeries = series.map(indexLumenChartSeries)
  const values = series.flatMap(item => item.data.map(datum => datum.y))

  const calculatedDomain =
    layout === 'stacked' ?
      getStackedDomain(series, categories) :
      getLumenChartDomain(values)

  const domain = {
    max: options.domain?.max ?? calculatedDomain.max,
    min: options.domain?.min ?? calculatedDomain.min
  }

  const margin =
    orientation === 'horizontal' ?
      {
        bottom: 24,
        left: Math.max(64, Math.min(240, options.categoryWidth ?? 112)),
        right: 20,
        top: 16
      } :
      { bottom: 52, left: 52, right: 16, top: 16 }

  const plotWidth = Math.max(1, width - margin.left - margin.right)
  const plotHeight = Math.max(1, height - margin.top - margin.bottom)

  const categorySize =
    (orientation === 'horizontal' ? plotHeight : plotWidth) /
    Math.max(1, categories.length)

  const categoryGap = Math.min(16, categorySize * 0.24)
  const usableCategorySize = Math.max(1, categorySize - categoryGap)
  const seriesSize = usableCategorySize / Math.max(1, series.length)
  const marks: LumenBarGeometryMark[] = []
  const categoryPositions: LumenBarGeometryCategory[] = []

  for (const [categoryIndex, category] of categories.entries()) {
    const categoryStart =
      (orientation === 'horizontal' ? margin.top : margin.left) +
      categoryIndex * categorySize +
      categoryGap / 2

    let positiveOffset = 0
    let negativeOffset = 0

    categoryPositions.push({
      category,
      label:
        series
          .flatMap(item => item.data)
          .find(datum => datum.x === category)?.xLabel ?? category,
      x:
        orientation === 'horizontal' ?
          margin.left - 8 :
          categoryStart + usableCategorySize / 2,
      y:
        orientation === 'horizontal' ?
          categoryStart + usableCategorySize / 2 :
          height - 20
    })

    for (const [seriesIndex, item] of series.entries()) {
      const indexed = indexedSeries[seriesIndex]

      if (!indexed) continue

      const value = indexed.get(lumenChartCategoryKey(category))?.y

      if (value === null || value === undefined || !Number.isFinite(value)) continue

      const tone = resolveLumenChartTone(item.tone, seriesIndex)

      if (orientation === 'horizontal') {
        const startValue = getBarStartValue(
          layout, value, positiveOffset, negativeOffset
        )

        const endValue = startValue + value

        const start = scaleLumenChartValue(
          startValue, domain, margin.left, margin.left + plotWidth
        )

        const end = scaleLumenChartValue(
          endValue, domain, margin.left, margin.left + plotWidth
        )

        marks.push({
          category,
          height:
            layout === 'stacked' ?
              usableCategorySize :
              Math.max(1, seriesSize - 2),
          seriesId: item.id,
          seriesLabel: item.label,
          tone,
          value,
          width: Math.abs(end - start),
          x: Math.min(start, end),
          y:
            categoryStart +
            (layout === 'stacked' ? 0 : seriesIndex * seriesSize + 1)
        })
      } else {
        const startValue = getBarStartValue(
          layout, value, positiveOffset, negativeOffset
        )

        const endValue = startValue + value

        const start = scaleLumenChartValue(
          startValue, domain, margin.top + plotHeight, margin.top
        )

        const end = scaleLumenChartValue(
          endValue, domain, margin.top + plotHeight, margin.top
        )

        marks.push({
          category,
          height: Math.abs(end - start),
          seriesId: item.id,
          seriesLabel: item.label,
          tone,
          value,
          width:
            layout === 'stacked' ?
              usableCategorySize :
              Math.max(1, seriesSize - 2),
          x:
            categoryStart +
            (layout === 'stacked' ? 0 : seriesIndex * seriesSize + 1),
          y: Math.min(start, end)
        })
      }

      if (layout === 'stacked') {
        if (value >= 0) positiveOffset += value
        else negativeOffset += value
      }
    }
  }

  return {
    categories: categoryPositions,
    domain,
    height,
    marks,
    width
  }
}
/* eslint-enable complexity */

export const summarizeLumenChart = (
  series: readonly LumenChartSeries[]
): LumenChartSummary => {
  let availablePointCount = 0
  let maximum = Number.NEGATIVE_INFINITY
  let minimum = Number.POSITIVE_INFINITY
  let missingPointCount = 0

  for (const item of series) {
    for (const datum of item.data) {
      if (datum.y === null || !Number.isFinite(datum.y)) {
        missingPointCount += 1

        continue
      }

      availablePointCount += 1

      maximum = Math.max(maximum, datum.y)

      minimum = Math.min(minimum, datum.y)
    }
  }

  return {
    availablePointCount,
    maximum: Number.isFinite(maximum) ? maximum : null,
    minimum: Number.isFinite(minimum) ? minimum : null,
    missingPointCount,
    seriesCount: series.length
  }
}

export const formatLumenChartSummary = (
  series: readonly LumenChartSeries[],
  formatValue: (value: number) => string = String
): string => {
  const summary = summarizeLumenChart(series)

  if (summary.availablePointCount === 0) return 'No chart data available.'

  const pointLabel = summary.availablePointCount === 1 ? 'point' : 'points'

  const missing =
    summary.missingPointCount === 0 ?
      '' :
      ` ${summary.missingPointCount} missing ${summary.missingPointCount === 1 ? 'value' : 'values'}.`

  return `${summary.seriesCount} series, ${summary.availablePointCount} ${pointLabel}. ` +
    `Values range from ${formatValue(summary.minimum ?? 0)} to ${formatValue(summary.maximum ?? 0)}.${missing}`
}

interface LumenChartDatumValidationContext {
  datumIds: Set<string>
  issues: LumenChartValidationIssue[]
  path: string
  previousX: number
  xScale: LumenChartScaleType
}

const validateLumenChartDatumId = (
  datum: LumenChartDatum,
  context: LumenChartDatumValidationContext
): void => {
  if (datum.id === undefined) return

  if (context.datumIds.has(datum.id)) {
    context.issues.push({
      code: 'duplicate-datum-id',
      message: `Datum id "${datum.id}" must be unique within its series.`,
      path: `${context.path}.id`
    })
  }

  context.datumIds.add(datum.id)
}

const validateLumenChartDatumNumbers = (
  datum: LumenChartDatum,
  context: LumenChartDatumValidationContext
): void => {
  if (datum.y !== null && !Number.isFinite(datum.y)) {
    context.issues.push({
      code: 'invalid-y',
      message: 'Chart values must be finite numbers or null.',
      path: `${context.path}.y`
    })
  }

  if (datum.size === undefined || datum.size === null) return

  if (!Number.isFinite(datum.size) || datum.size < 0) {
    context.issues.push({
      code: 'invalid-size',
      message: 'Bubble sizes must be finite, non-negative numbers or null.',
      path: `${context.path}.size`
    })
  }
}

const validateLumenChartDatumX = (
  datum: LumenChartDatum,
  context: LumenChartDatumValidationContext
): number => {
  if (context.xScale === 'categorical') return context.previousX

  const numericX = getLumenChartNumericX(datum.x, context.xScale)

  if (numericX === null) {
    context.issues.push({
      code: 'invalid-x',
      message: `The ${context.xScale} x-axis requires finite numbers or valid ISO dates.`,
      path: `${context.path}.x`
    })

    return context.previousX
  }

  if (numericX < context.previousX) {
    context.issues.push({
      code: 'unsorted-x',
      message: `The ${context.xScale} x-axis data must be sorted in ascending order.`,
      path: `${context.path}.x`
    })
  }

  return numericX
}

const validateLumenChartDatum = (
  datum: LumenChartDatum,
  context: LumenChartDatumValidationContext
): number => {
  validateLumenChartDatumId(datum, context)

  validateLumenChartDatumNumbers(datum, context)

  return validateLumenChartDatumX(datum, context)
}

export const validateLumenChartSeries = (
  series: readonly LumenChartSeries[],
  xScale: LumenChartScaleType = 'categorical'
): LumenChartValidationIssue[] => {
  const issues: LumenChartValidationIssue[] = []
  const seriesIds = new Set<string>()

  for (const [seriesIndex, item] of series.entries()) {
    const seriesPath = `series[${seriesIndex}]`

    if (seriesIds.has(item.id)) {
      issues.push({
        code: 'duplicate-series-id',
        message: `Series id "${item.id}" must be unique.`,
        path: `${seriesPath}.id`
      })
    }

    seriesIds.add(item.id)

    const datumIds = new Set<string>()
    let previousX = Number.NEGATIVE_INFINITY

    for (const [datumIndex, datum] of item.data.entries()) {
      previousX = validateLumenChartDatum(datum, {
        datumIds,
        issues,
        path: `${seriesPath}.data[${datumIndex}]`,
        previousX,
        xScale
      })
    }
  }

  return issues
}

const selectLumenChartBucketDatum = (
  bucket: readonly LumenChartDatum[],
  first: LumenChartDatum,
  last: LumenChartDatum,
  expectedRatio: number
): LumenChartDatum | undefined => {
  const missing = bucket.find(datum => !isAvailableLumenChartY(datum.y))

  if (missing) return missing

  const expected =
    !isAvailableLumenChartY(first.y) || !isAvailableLumenChartY(last.y) ?
      0 :
      first.y + (last.y - first.y) * expectedRatio

  let selected = bucket[0]
  let largestDistance = Number.NEGATIVE_INFINITY

  for (const datum of bucket) {
    const distance = isAvailableLumenChartY(datum.y) ? Math.abs(datum.y - expected) : 0

    if (distance <= largestDistance) continue

    largestDistance = distance

    selected = datum
  }

  return selected
}

export const downsampleLumenChartData = (
  data: readonly LumenChartDatum[],
  threshold: number
): LumenChartDatum[] => {
  const safeThreshold = Math.max(3, Math.floor(threshold))

  if (data.length <= safeThreshold) return [...data]

  const sampled: LumenChartDatum[] = []
  const first = data[0]
  const last = data[data.length - 1]

  if (!first || !last) return []

  sampled.push(first)

  const bucketSize = (data.length - 2) / (safeThreshold - 2)

  for (let bucketIndex = 0; bucketIndex < safeThreshold - 2; bucketIndex += 1) {
    const start = 1 + Math.floor(bucketIndex * bucketSize)
    const end = Math.min(data.length - 1, 1 + Math.floor((bucketIndex + 1) * bucketSize))
    const bucket = data.slice(start, Math.max(start + 1, end))
    const expectedRatio = (bucketIndex + 1) / (safeThreshold - 1)
    const selected = selectLumenChartBucketDatum(bucket, first, last, expectedRatio)

    if (selected) sampled.push(selected)
  }

  sampled.push(last)

  return sampled
}

export const appendLumenChartDatum = (
  series: LumenChartSeries,
  datum: LumenChartDatum,
  maximumPoints = 500
): LumenChartSeries => {
  const safeMaximum = Math.max(1, Math.floor(maximumPoints))
  const data = [...series.data, datum]

  return {
    ...series,
    data: data.slice(Math.max(0, data.length - safeMaximum))
  }
}

interface LumenScatterPointContext {
  domain: LumenChartDomain
  height: number
  maximumRadius: number
  minimumRadius: number
  padding: number
  series: LumenChartSeries
  seriesIndex: number
  sizeDomain: LumenChartDomain
  width: number
  xDomain: LumenChartDomain
  xScale: Exclude<LumenChartScaleType, 'categorical'>
}

interface ResolvedLumenScatterGeometryOptions {
  height: number
  maximumRadius: number
  minimumRadius: number
  padding: number
  requestedDomain: Partial<LumenChartDomain> | undefined
  requestedXDomain: Partial<LumenChartDomain> | undefined
  width: number
  xScale: Exclude<LumenChartScaleType, 'categorical'>
}

const resolveLumenScatterGeometryOptions = (
  options: LumenScatterGeometryOptions
): ResolvedLumenScatterGeometryOptions => ({
  height: options.height ?? 320,
  maximumRadius: options.maximumRadius ?? 18,
  minimumRadius: options.minimumRadius ?? 4,
  padding: options.padding ?? 44,
  requestedDomain: options.domain,
  requestedXDomain: options.xDomain,
  width: options.width ?? 640,
  xScale: options.xScale ?? 'linear'
})

const createLumenScatterPoint = (
  datum: LumenChartDatum,
  context: LumenScatterPointContext
): LumenScatterGeometryPoint | null => {
  const numericX = getLumenChartNumericX(datum.x, context.xScale)

  if (numericX === null || !isAvailableLumenChartY(datum.y)) return null

  const radius =
    datum.size === null || datum.size === undefined || !Number.isFinite(datum.size) || datum.size < 0 ?
      context.minimumRadius :
      scaleLumenChartValue(
        datum.size, context.sizeDomain, context.minimumRadius, context.maximumRadius
      )

  return {
    ...datum,
    radius,
    seriesId: context.series.id,
    seriesLabel: context.series.label,
    tone: resolveLumenChartTone(datum.tone ?? context.series.tone, context.seriesIndex),
    xCoordinate: scaleLumenChartValue(
      numericX, context.xDomain, context.padding, context.width - context.padding
    ),
    yCoordinate: scaleLumenChartValue(
      datum.y, context.domain, context.height - context.padding, context.padding
    )
  }
}

export const createLumenScatterGeometry = (
  series: readonly LumenChartSeries[],
  options: LumenScatterGeometryOptions = {}
): LumenScatterGeometry => {
  const {
    height,
    maximumRadius: requestedMaximumRadius,
    minimumRadius: requestedMinimumRadius,
    padding,
    requestedDomain,
    requestedXDomain,
    width,
    xScale
  } = resolveLumenScatterGeometryOptions(options)

  const data = series.flatMap(item => item.data)

  const projectedData = data.filter(datum => (
    getLumenChartNumericX(datum.x, xScale) !== null && isAvailableLumenChartY(datum.y)
  ))

  const domain = resolveLumenChartDomain(
    projectedData.map(datum => datum.y), requestedDomain, false
  )

  const xDomain = getLumenChartXDomain(projectedData, xScale, requestedXDomain)

  const sizes = projectedData.map(datum => (
    datum.size !== undefined && datum.size !== null && datum.size >= 0 ? datum.size : null
  ))

  const sizeDomain = getLumenChartDomain(sizes, false)
  const minimumRadius = Math.max(1, requestedMinimumRadius)
  const maximumRadius = Math.max(minimumRadius, requestedMaximumRadius)
  const points: LumenScatterGeometryPoint[] = []

  for (const [seriesIndex, item] of series.entries()) {
    for (const datum of item.data) {
      const point = createLumenScatterPoint(datum, {
        domain,
        height,
        maximumRadius,
        minimumRadius,
        padding,
        series: item,
        seriesIndex,
        sizeDomain,
        width,
        xDomain,
        xScale
      })

      if (point) points.push(point)
    }
  }

  return { domain, height, points, width, xDomain }
}

const uniqueLumenChartCategories = (
  values: readonly (number | string)[]
): (number | string)[] => {
  const categories = new Map<string, number | string>()

  for (const value of values) categories.set(lumenChartCategoryKey(value), value)

  return [...categories.values()]
}

interface LumenHeatmapCellContext {
  cellHeight: number
  cellWidth: number
  domain: LumenChartDomain
  xIndexes: ReadonlyMap<string, number>
  yIndexes: ReadonlyMap<string, number>
}

const createLumenHeatmapCell = (
  datum: LumenHeatmapDatum,
  context: LumenHeatmapCellContext
): LumenHeatmapGeometryCell | null => {
  const xIndex = context.xIndexes.get(lumenChartCategoryKey(datum.x))
  const yIndex = context.yIndexes.get(lumenChartCategoryKey(datum.y))

  if (xIndex === undefined || yIndex === undefined) return null

  return {
    ...datum,
    height: context.cellHeight,
    ratio:
      datum.value === null || !Number.isFinite(datum.value) ?
        0 :
        getLumenChartValueRatio(datum.value, context.domain),
    width: context.cellWidth,
    xCoordinate: xIndex * context.cellWidth,
    yCoordinate: yIndex * context.cellHeight
  }
}

export const createLumenHeatmapGeometry = (
  data: readonly LumenHeatmapDatum[],
  width = 640,
  height = 320
): LumenHeatmapGeometry => {
  const xCategories = uniqueLumenChartCategories(data.map(datum => datum.x))
  const yCategories = uniqueLumenChartCategories(data.map(datum => datum.y))
  const domain = getLumenChartDomain(data.map(datum => datum.value), false)
  const cellWidth = width / Math.max(1, xCategories.length)
  const cellHeight = height / Math.max(1, yCategories.length)

  const xIndexes = new Map(
    xCategories.map((category, index) => [lumenChartCategoryKey(category), index])
  )

  const yIndexes = new Map(
    yCategories.map((category, index) => [lumenChartCategoryKey(category), index])
  )

  const cells = data.flatMap(datum => {
    const cell = createLumenHeatmapCell(datum, {
      cellHeight,
      cellWidth,
      domain,
      xIndexes,
      yIndexes
    })

    return cell ? [cell] : []
  })

  return { cells, domain, height, width, xCategories, yCategories }
}

const createLumenRangePoint = (
  datum: LumenRangeDatum,
  index: number,
  length: number,
  width: number,
  height: number,
  padding: number,
  domain: LumenChartDomain
): LumenRangeGeometryPoint | null => {
  if (
    datum.low === null ||
    datum.high === null ||
    !Number.isFinite(datum.low) ||
    !Number.isFinite(datum.high)
  ) return null

  const denominator = Math.max(1, length - 1)

  const xCoordinate =
    padding + (length === 1 ? 0.5 : index / denominator) * (width - padding * 2)

  return {
    ...datum,
    highCoordinate: scaleLumenChartValue(datum.high, domain, height - padding, padding),
    lowCoordinate: scaleLumenChartValue(datum.low, domain, height - padding, padding),
    xCoordinate
  }
}

export const createLumenRangeGeometry = (
  data: readonly LumenRangeDatum[],
  options: LumenLineGeometryOptions = {}
): LumenRangeGeometry => {
  const {
    domain: requestedDomain,
    height = 320,
    includeZero = false,
    padding = 44,
    width = 640
  } = options

  const values = data.flatMap(datum => (
    datum.low !== null &&
    datum.high !== null &&
    Number.isFinite(datum.low) &&
    Number.isFinite(datum.high) ?
      [datum.low, datum.high] :
      []
  ))

  const domain = resolveLumenChartDomain(values, requestedDomain, includeZero)
  const segments: LumenRangeGeometryPoint[][] = []
  let currentSegment: LumenRangeGeometryPoint[] = []

  for (const [index, datum] of data.entries()) {
    const point = createLumenRangePoint(
      datum, index, data.length, width, height, padding, domain
    )

    if (!point) {
      if (currentSegment.length > 0) segments.push(currentSegment)

      currentSegment = []

      continue
    }

    currentSegment.push(point)
  }

  if (currentSegment.length > 0) segments.push(currentSegment)

  const areaPath = segments.map(segment => {
    const upper = segment.map(
      (point, index) => `${index === 0 ? 'M' : 'L'} ${point.xCoordinate.toFixed(3)} ${point.highCoordinate.toFixed(3)}`
    )

    const lower = [...segment].reverse().map(
      point => `L ${point.xCoordinate.toFixed(3)} ${point.lowCoordinate.toFixed(3)}`
    )

    return [...upper, ...lower, 'Z'].join(' ')
  }).join(' ')

  return {
    areaPath,
    domain,
    points: segments.flat()
  }
}
