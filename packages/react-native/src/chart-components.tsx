import { Fragment, type ReactElement, type ReactNode, useId, useState } from 'react'
import {
  Pressable,
  ScrollView,
  Text,
  View,
  type ViewProps
} from 'react-native'
import { Circle, Defs, G, Line, LinearGradient, Path, Rect, Stop, Svg, Text as SvgText } from 'react-native-svg'

import {
  alignLumenChartSeries,
  createLumenBarGeometry,
  createLumenHeatmapModel,
  createLumenHistogramGeometry,
  createLumenLineGeometry,
  createLumenPieGeometry,
  createLumenRangeGeometry,
  createLumenScatterGeometry,
  createLumenWaterfallGeometry,
  formatLumenChartSummary,
  getLumenChartAxisPadding,
  getLumenChartCategories,
  getLumenChartCategoryLabel,
  getLumenChartCategoryTicks,
  getLumenChartDomain,
  getLumenChartTicks,
  getLumenHeatmapColorMix,
  hasLumenChartData,
  hasLumenPieData,
  type LumenBarChartLayout,
  type LumenChartDatum,
  type LumenChartLabels,
  type LumenChartReference,
  type LumenChartSeries,
  type LumenChartTone,
  type LumenComboSeries,
  type LumenHeatmapDatum,
  type LumenHeatmapOptions,
  type LumenHistogramBin,
  type LumenPieChartVariant,
  type LumenRangeDatum,
  type LumenWaterfallDatum,
  resolveLumenChartLabels,
  resolveLumenChartTone,
  scaleLumenChartValue
} from '@santi020k/lumen-core'

import { LumenDisclosure } from './content-components.js'
import { useLumenTheme } from './theme-context.js'
import { lumenChartOpacities, lumenChartStrokeWidths } from './tokens.generated.js'

export type {
  LumenChartDatum,
  LumenChartScaleType,
  LumenChartSelection,
  LumenChartSeries,
  LumenChartTone,
  LumenComboSeries,
  LumenHeatmapDatum,
  LumenHistogramBin,
  LumenRangeDatum,
  LumenWaterfallDatum } from '@santi020k/lumen-core'

interface LumenChartFrameProps extends Omit<ViewProps, 'children'> {
  children: ReactNode
  description?: string
  heading?: string
  label: string
  summary: string
}

const LumenChartFrame = ({
  children,
  description,
  heading,
  label,
  style,
  summary,
  ...props
}: LumenChartFrameProps): ReactElement => {
  const theme = useLumenTheme()

  return (
    <View
      {...props}
      style={[
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.line,
          borderRadius: theme.radii.lg,
          borderWidth: 1,
          gap: theme.spacing.md,
          overflow: 'hidden',
          padding: theme.spacing.lg
        },
        style
      ]}
    >
      <View
        accessible
        accessibilityLabel={`${label}. ${summary}`}
        accessibilityRole="image"
        style={{ height: 1, left: 0, opacity: 0, position: 'absolute', top: 0, width: 1 }}
      />
      {heading ?
        (
          <Text style={{ color: theme.colors.ink, fontSize: theme.fontSizes.lg, fontWeight: '700' }}>
            {heading}
          </Text>
        ) :
        null}
      {description ?
        (
          <Text style={{ color: theme.colors.inkSoft, fontSize: theme.fontSizes.sm }}>
            {description}
          </Text>
        ) :
        null}
      {children}
    </View>
  )
}

const lumenChartToneColor = (
  tone: LumenChartTone,
  theme: ReturnType<typeof useLumenTheme>
): string => {
  if (tone === 'brand') return theme.colors.brand

  if (tone === 'accent') return theme.colors.accent

  if (tone === 'success') return theme.colors.success

  if (tone === 'warning') return theme.colors.warning

  if (tone === 'danger') return theme.colors.danger

  if (tone === 'neutral') return theme.colors.inkMuted

  const seriesColors = [
    theme.chartColors.series1,
    theme.chartColors.series2,
    theme.chartColors.series3,
    theme.chartColors.series4,
    theme.chartColors.series5,
    theme.chartColors.series6,
    theme.chartColors.series7,
    theme.chartColors.series8
  ]

  const index = Number.parseInt(tone.slice('series-'.length), 10) - 1

  return seriesColors[index] ?? theme.chartColors.series1
}

const LumenChartDataDisclosure = ({ children, labels }: {
  children: ReactNode
  labels: Readonly<LumenChartLabels>
}): ReactElement => {
  const [expanded, setExpanded] = useState(false)
  const theme = useLumenTheme()

  return (
    <LumenDisclosure expanded={expanded} onExpandedChange={setExpanded} title={labels.viewData}>
      <ScrollView accessibilityLabel={labels.chartData} nestedScrollEnabled style={{ maxHeight: 280 }}>
        <View accessibilityRole="list" style={{ gap: theme.spacing.sm }}>{children}</View>
      </ScrollView>
    </LumenDisclosure>
  )
}

interface LumenChartDataListProps {
  formatCategory: ((value: number | string) => string) | undefined
  formatValue: (value: number) => string
  includeSize?: boolean
  labels: Readonly<LumenChartLabels>
  onSelect?: (seriesId: string, x: number | string) => void
  selectedSeriesId?: string
  selectedX?: number | string
  series: readonly LumenChartSeries[]
  showMarkers?: boolean
}

const formatChartSize = (
  size: number | null | undefined,
  formatValue: (value: number) => string,
  labels: Readonly<LumenChartLabels>
): string => (
  size === null || size === undefined || !Number.isFinite(size) || size < 0 ? labels.notAvailable : formatValue(size)
)

const chartDatumLabel = (
  item: LumenChartSeries,
  datum: LumenChartSeries['data'][number],
  formatCategory: ((value: number | string) => string) | undefined,
  formatValue: (value: number) => string,
  labels: Readonly<LumenChartLabels>,
  includeSize = false
): string => {
  const category = getLumenChartCategoryLabel([item], datum.x, formatCategory, 'detail')

  const value = datum.label ?? (
    datum.y === null || !Number.isFinite(datum.y) ? labels.notAvailable : formatValue(datum.y)
  )

  const size = formatChartSize(datum.size, formatValue, labels)

  return `${category}, ${item.label}: ${value}${datum.toneLabel ? `, ${datum.toneLabel}` : ''}${includeSize ? `, ${labels.size}: ${size}` : ''}`
}

const LumenChartDataList = ({
  formatCategory,
  formatValue,
  includeSize = false,
  labels,
  onSelect,
  selectedSeriesId,
  selectedX,
  series,
  showMarkers = false
}: LumenChartDataListProps): ReactElement => {
  const theme = useLumenTheme()

  return (
    <LumenChartDataDisclosure labels={labels}>
      {series.flatMap(item => item.data.map((datum, datumIndex) => {
        const label = chartDatumLabel(item, datum, formatCategory, formatValue, labels, includeSize)
        const selected = selectedSeriesId === item.id && selectedX === datum.x
        const key = `${item.id}:${datum.id ?? `${typeof datum.x}:${String(datum.x)}:${datumIndex}`}`

        const content = (
          <Fragment>
            {showMarkers && (
              <View
                accessibilityElementsHidden
                accessible={false}
                importantForAccessibility="no-hide-descendants"
                style={{
                  backgroundColor: lumenChartToneColor(resolveLumenChartTone(datum.tone, datumIndex), theme),
                  borderRadius: 3,
                  flexShrink: 0,
                  height: 10,
                  width: 10
                }}
              />
            )}
            <Text style={{ color: theme.colors.inkSoft, flexShrink: 1, fontSize: theme.fontSizes.sm }}>
              {label}
            </Text>
          </Fragment>
        )

        if (!onSelect || datum.y === null || !Number.isFinite(datum.y)) {
          return (
            <View key={key} style={{ alignItems: 'center', flexDirection: 'row', gap: theme.spacing.sm }}>
              {content}
            </View>
          )
        }

        return (
          <Pressable
            accessibilityLabel={label}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            key={key}
            onPress={() => {
              onSelect(item.id, datum.x)
            }}
            style={{
              alignItems: 'center',
              backgroundColor: selected ? theme.colors.brandSoft : theme.colors.surfaceMuted,
              borderRadius: theme.radii.sm,
              flexDirection: 'row',
              gap: theme.spacing.sm,
              minHeight: 44,
              padding: theme.spacing.sm
            }}
          >
            {content}
          </Pressable>
        )
      }))}
    </LumenChartDataDisclosure>
  )
}

interface LumenChartStructuredDataListProps {
  labels: Readonly<LumenChartLabels>
  rows: readonly { id: string, label: string }[]
}

const LumenChartStructuredDataList = ({
  labels,
  rows
}: LumenChartStructuredDataListProps): ReactElement => {
  const theme = useLumenTheme()

  return (
    <LumenChartDataDisclosure labels={labels}>
      {rows.map(row => (
        <Text key={row.id} style={{ color: theme.colors.inkSoft, fontSize: theme.fontSizes.sm }}>
          {row.label}
        </Text>
      ))}
    </LumenChartDataDisclosure>
  )
}

interface LumenDataChartProps extends Omit<ViewProps, 'children'> {
  description?: string
  formatCategory?: (value: number | string) => string
  formatValue?: (value: number) => string
  heading?: string
  label: string
  labels?: Partial<LumenChartLabels>
  onSelectionChange?: (seriesId: string, x: number | string) => void
  selectedSeriesId?: string
  selectedX?: number | string
  showData?: boolean
  summary?: string
}

const defaultLumenChartCategoryFormatter = (value: number | string): string => String(value)
const defaultLumenChartValueFormatter = (value: number): string => String(value)

const resolveLumenChartCategoryFormatter = (
  formatter: ((value: number | string) => string) | undefined
): ((value: number | string) => string) => formatter ?? defaultLumenChartCategoryFormatter

const resolveLumenChartValueFormatter = (
  formatter: ((value: number) => string) | undefined
): ((value: number) => string) => formatter ?? defaultLumenChartValueFormatter

export interface LumenSparklineProps extends Omit<ViewProps, 'children'> {
  area?: boolean
  label: string
  tone?: LumenChartTone
  values: readonly number[]
}

export const LumenSparkline = ({
  area = false,
  label,
  style,
  tone,
  values,
  ...props
}: LumenSparklineProps): ReactElement => {
  const theme = useLumenTheme()

  const geometry = createLumenLineGeometry(
    values.map((value, index) => ({ x: index, y: value })),
    { height: 40, padding: 3, width: 120 }
  )

  const color = lumenChartToneColor(resolveLumenChartTone(tone), theme)

  return (
    <View
      {...props}
      accessible
      accessibilityLabel={label}
      accessibilityRole="image"
      style={[{ height: 40, width: 120 }, style]}
    >
      <Svg height={40} viewBox="0 0 120 40" width={120}>
        {area ?
          geometry.areaPaths.map(path => (
            <Path d={path} fill={color} fillOpacity={lumenChartOpacities.area} key={path} />
          )) :
          null}
        <Path
          d={geometry.path}
          fill="none"
          stroke={color}
          strokeWidth={lumenChartStrokeWidths.series}
        />
      </Svg>
    </View>
  )
}

export interface LumenLineChartProps extends LumenDataChartProps {
  area?: boolean
  reference?: LumenChartReference
  series: readonly LumenChartSeries[]
}

interface LumenChartReferenceRuleProps {
  domain: Readonly<{ max: number, min: number }>
  height: number
  padding: number
  paddingLeft: number
  reference?: LumenChartReference
  width: number
}

const LumenChartReferenceRule = ({
  domain,
  height,
  padding,
  paddingLeft,
  reference,
  width
}: LumenChartReferenceRuleProps): ReactElement | null => {
  const theme = useLumenTheme()

  if (!reference) return null

  const y = scaleLumenChartValue(reference.value, domain, height - padding, padding)
  const color = lumenChartToneColor(resolveLumenChartTone(reference.tone), theme)

  return (
    <Fragment>
      <Line stroke={color} strokeDasharray="6 4" strokeWidth={lumenChartStrokeWidths.reference} x1={paddingLeft} x2={width - padding} y1={y} y2={y} />
      <SvgText fill={color} fontSize="12" transform={`translate(${paddingLeft + 4} ${Math.max(12, y - 5)})`}>{reference.label}</SvgText>
    </Fragment>
  )
}

const resolveLineChartSummary = (
  series: readonly LumenChartSeries[],
  valueFormatter: (value: number) => string,
  labels: Readonly<LumenChartLabels>,
  reference: LumenChartReference | undefined,
  summary: string | undefined
): string => {
  if (summary !== undefined) return summary

  const baseSummary = formatLumenChartSummary(series, valueFormatter, labels)

  return reference ? `${baseSummary} ${reference.label}: ${valueFormatter(reference.value)}.` : baseSummary
}

const getLumenLineChartDomain = (
  series: readonly LumenChartSeries[],
  reference: LumenChartReference | undefined
): ReturnType<typeof getLumenChartDomain> => getLumenChartDomain(
  [
    ...series.flatMap(item => item.data.map(datum => datum.y)),
    reference?.value ?? null
  ],
  false
)

export const LumenLineChart = ({
  area = false,
  formatCategory,
  formatValue,
  label,
  labels,
  onSelectionChange,
  reference,
  selectedSeriesId,
  selectedX,
  series,
  showData = true,
  summary,
  ...props
}: LumenLineChartProps): ReactElement => {
  const theme = useLumenTheme()
  const valueFormatter = resolveLumenChartValueFormatter(formatValue)
  const chartLabels = resolveLumenChartLabels(labels)
  const width = 640
  const height = 320
  const padding = 44
  const categories = getLumenChartCategories(series)
  const aligned = series.map(item => alignLumenChartSeries(item, categories))
  const domain = getLumenLineChartDomain(aligned, reference)
  const ticks = getLumenChartTicks(domain)
  const paddingLeft = getLumenChartAxisPadding(ticks.map(valueFormatter))

  const categoryTicks = getLumenChartCategoryTicks(
    categories.map(category => getLumenChartCategoryLabel(aligned, category, formatCategory)),
    { end: width - padding, start: paddingLeft }
  )

  const resolvedSummary = resolveLineChartSummary(
    aligned, valueFormatter, chartLabels, reference, summary
  )

  return (
    <LumenChartFrame label={label} summary={resolvedSummary} {...props}>
      {hasLumenChartData(series) ?
        (
          <ScrollView accessibilityLabel={chartLabels.chartData} horizontal>
            <Svg height={height} viewBox={`0 0 ${width} ${height}`} width={width}>
              <LumenChartReferenceRule
                domain={domain}
                height={height}
                padding={padding}
                paddingLeft={paddingLeft}
                {...(reference ? { reference } : {})}
                width={width}
              />
              {ticks.map(tick => {
                const y = scaleLumenChartValue(tick, domain, height - padding, padding)

                return (
                  <Fragment key={tick}>
                    <Line
                      stroke={theme.chartColors.grid}
                      strokeOpacity={lumenChartOpacities.grid}
                      strokeWidth={lumenChartStrokeWidths.grid}
                      x1={paddingLeft}
                      x2={width - padding}
                      y1={y}
                      y2={y}
                    />
                    <SvgText
                      fill={theme.colors.inkMuted}
                      fontSize={12}
                      textAnchor="end"
                      transform={`translate(${paddingLeft - 8} ${y + 4})`}
                    >
                      {valueFormatter(tick)}
                    </SvgText>
                  </Fragment>
                )
              })}
              {categoryTicks.map(tick => (
                <SvgText
                  fill={theme.colors.inkMuted}
                  fontSize={12}
                  key={tick.index}
                  textAnchor={tick.textAnchor}
                  transform={`translate(${tick.position} ${height - 16})`}
                >
                  {tick.label}
                </SvgText>
              ))}
              {aligned.map((item, index) => {
                const geometry = createLumenLineGeometry(item.data, {
                  domain,
                  height,
                  padding,
                  paddingLeft,
                  width
                })

                const color = lumenChartToneColor(resolveLumenChartTone(item.tone, index), theme)

                return (
                  <Fragment key={item.id}>
                    {area ?
                      geometry.areaPaths.map(path => (
                        <Path
                          d={path}
                          fill={color}
                          fillOpacity={lumenChartOpacities.area}
                          key={path}
                        />
                      )) :
                      null}
                    <Path
                      d={geometry.path}
                      fill="none"
                      stroke={color}
                      strokeWidth={lumenChartStrokeWidths.series}
                    />
                    {geometry.points.filter(point => point.tone).map(point => (
                      <Circle
                        cx={point.xCoordinate}
                        cy={point.yCoordinate}
                        fill={lumenChartToneColor(resolveLumenChartTone(point.tone), theme)}
                        key={point.id ?? `${typeof point.x}:${String(point.x)}`}
                        r="4"
                      />
                    ))}
                  </Fragment>
                )
              })}
            </Svg>
          </ScrollView>
        ) :
        <Text style={{ color: theme.colors.inkMuted }}>{chartLabels.empty}</Text>}
      {showData ?
        (
          <LumenChartDataList
            formatCategory={formatCategory}
            formatValue={valueFormatter}
            labels={chartLabels}
            series={aligned}
            {...(onSelectionChange ? { onSelect: onSelectionChange } : {})}
            {...(selectedSeriesId === undefined ? {} : { selectedSeriesId })}
            {...(selectedX === undefined ? {} : { selectedX })}
          />
        ) :
        null}
    </LumenChartFrame>
  )
}

export interface LumenBarChartProps extends LumenDataChartProps {
  layout?: LumenBarChartLayout
  series: readonly LumenChartSeries[]
}

export const LumenBarChart = ({
  formatCategory,
  formatValue,
  label,
  labels,
  layout = 'grouped',
  onSelectionChange,
  selectedSeriesId,
  selectedX,
  series,
  showData = true,
  summary,
  ...props
}: LumenBarChartProps): ReactElement => {
  const theme = useLumenTheme()
  const valueFormatter = resolveLumenChartValueFormatter(formatValue)
  const chartLabels = resolveLumenChartLabels(labels)
  const categories = getLumenChartCategories(series)
  const aligned = series.map(item => alignLumenChartSeries(item, categories))

  const geometry = createLumenBarGeometry(aligned, {
    ...(formatCategory === undefined ? {} : { formatCategory }),
    formatValue: valueFormatter,
    layout
  })

  const { domain, height, margin, width } = geometry
  const ticks = getLumenChartTicks(domain)

  const categoryTicks = getLumenChartCategoryTicks(geometry.categories.map(category => String(category.label)), {
    end: width - margin.right,
    positions: geometry.categories.map(category => category.x),
    start: margin.left
  })

  const resolvedSummary = summary ?? formatLumenChartSummary(aligned, valueFormatter, chartLabels)

  return (
    <LumenChartFrame label={label} summary={resolvedSummary} {...props}>
      {hasLumenChartData(series) ?
        (
          <ScrollView accessibilityLabel={chartLabels.chartData} horizontal>
            <Svg
              height={geometry.height}
              viewBox={`0 0 ${geometry.width} ${geometry.height}`}
              width={geometry.width}
            >
              {ticks.map(tick => {
                const y = scaleLumenChartValue(tick, domain, height - margin.bottom, margin.top)

                return (
                  <Fragment key={tick}>
                    <Line
                      stroke={tick === 0 ? theme.colors.inkMuted : theme.chartColors.grid}
                      strokeOpacity={tick === 0 ? 1 : lumenChartOpacities.grid}
                      strokeWidth={lumenChartStrokeWidths.grid}
                      x1={margin.left}
                      x2={width - margin.right}
                      y1={y}
                      y2={y}
                    />
                    <SvgText
                      fill={theme.colors.inkMuted}
                      fontSize={12}
                      textAnchor="end"
                      transform={`translate(${margin.left - 8} ${y + 4})`}
                    >
                      {valueFormatter(tick)}
                    </SvgText>
                  </Fragment>
                )
              })}
              {categoryTicks.map(tick => (
                <SvgText
                  fill={theme.colors.inkMuted}
                  fontSize={12}
                  key={tick.index}
                  textAnchor={tick.textAnchor}
                  transform={`translate(${tick.position} ${height - 20})`}
                >
                  {tick.label}
                </SvgText>
              ))}
              {geometry.marks.map(mark => (
                <Rect
                  fill={lumenChartToneColor(mark.tone, theme)}
                  height={mark.height}
                  key={`${mark.seriesId}:${typeof mark.category}:${String(mark.category)}`}
                  rx={4}
                  transform={`translate(${mark.x} ${mark.y})`}
                  width={mark.width}
                />
              ))}
            </Svg>
          </ScrollView>
        ) :
        <Text style={{ color: theme.colors.inkMuted }}>{chartLabels.empty}</Text>}
      {showData ?
        (
          <LumenChartDataList
            formatCategory={formatCategory}
            formatValue={valueFormatter}
            labels={chartLabels}
            series={aligned}
            {...(onSelectionChange ? { onSelect: onSelectionChange } : {})}
            {...(selectedSeriesId === undefined ? {} : { selectedSeriesId })}
            {...(selectedX === undefined ? {} : { selectedX })}
          />
        ) :
        null}
    </LumenChartFrame>
  )
}

export interface LumenPieChartProps extends LumenDataChartProps {
  series: LumenChartSeries
  variant?: LumenPieChartVariant
}

export const LumenPieChart = ({
  formatCategory,
  formatValue,
  label,
  labels,
  onSelectionChange,
  selectedSeriesId,
  selectedX,
  series,
  showData = true,
  summary,
  variant = 'donut',
  ...props
}: LumenPieChartProps): ReactElement => {
  const theme = useLumenTheme()
  const valueFormatter = resolveLumenChartValueFormatter(formatValue)
  const chartLabels = resolveLumenChartLabels(labels)
  const geometry = createLumenPieGeometry(series.data, { size: 320, variant })

  const renderedSeries = {
    ...series,
    data: series.data.filter(datum => datum.y !== null && Number.isFinite(datum.y) && datum.y > 0)
  }

  const resolvedSummary = summary ?? formatLumenChartSummary([renderedSeries], valueFormatter, chartLabels)

  return (
    <LumenChartFrame label={label} summary={resolvedSummary} {...props}>
      {hasLumenPieData(series.data) ?
        (
          <Svg height={320} viewBox="0 0 320 320" width="100%">
            {geometry.slices.map(slice => (
              <Path
                d={slice.path}
                fill={lumenChartToneColor(slice.tone, theme)}
                fillRule="evenodd"
                key={`${typeof slice.x}:${String(slice.x)}`}
                stroke={theme.colors.surface}
                strokeWidth={2}
              />
            ))}
          </Svg>
        ) :
        <Text style={{ color: theme.colors.inkMuted }}>{chartLabels.empty}</Text>}
      {showData ?
        (
          <LumenChartDataList
            formatCategory={formatCategory}
            formatValue={valueFormatter}
            labels={chartLabels}
            series={[renderedSeries]}
            showMarkers
            {...(onSelectionChange ? { onSelect: onSelectionChange } : {})}
            {...(selectedSeriesId === undefined ? {} : { selectedSeriesId })}
            {...(selectedX === undefined ? {} : { selectedX })}
          />
        ) :
        null}
    </LumenChartFrame>
  )
}

export interface LumenScatterChartProps extends LumenDataChartProps {
  series: readonly LumenChartSeries[]
}

export const LumenScatterChart = ({
  formatCategory,
  formatValue,
  label,
  labels,
  onSelectionChange,
  selectedSeriesId,
  selectedX,
  series,
  showData = true,
  summary,
  ...props
}: LumenScatterChartProps): ReactElement => {
  const theme = useLumenTheme()
  const valueFormatter = resolveLumenChartValueFormatter(formatValue)
  const chartLabels = resolveLumenChartLabels(labels)
  const geometry = createLumenScatterGeometry(series)

  const renderedSeries = series.map(item => ({
    ...item,
    data: item.data.filter(datum => geometry.points.some(point => (
      point.seriesId === item.id &&
      point.id === datum.id &&
      point.x === datum.x &&
      point.y === datum.y
    )))
  })).filter(item => item.data.length > 0)

  const hasData = geometry.points.length > 0
  const resolvedSummary = summary ?? formatLumenChartSummary(renderedSeries, valueFormatter, chartLabels)

  return (
    <LumenChartFrame label={label} summary={resolvedSummary} {...props}>
      {hasData ?
        (
          <ScrollView accessibilityLabel={chartLabels.chartData} horizontal>
            <Svg height={geometry.height} width={geometry.width}>
              {geometry.points.map((point, pointIndex) => (
                <Circle
                  cx={point.xCoordinate}
                  cy={point.yCoordinate}
                  fill={lumenChartToneColor(point.tone, theme)}
                  key={`${point.seriesId}:${point.id ?? `${typeof point.x}:${String(point.x)}:${pointIndex}`}`}
                  r={point.radius}
                />
              ))}
            </Svg>
          </ScrollView>
        ) :
        <Text style={{ color: theme.colors.inkMuted }}>{chartLabels.empty}</Text>}
      {showData && hasData ?
        (
          <LumenChartDataList
            formatCategory={formatCategory}
            formatValue={valueFormatter}
            includeSize
            labels={chartLabels}
            series={renderedSeries}
            {...(onSelectionChange ? { onSelect: onSelectionChange } : {})}
            {...(selectedSeriesId === undefined ? {} : { selectedSeriesId })}
            {...(selectedX === undefined ? {} : { selectedX })}
          />
        ) :
        null}
    </LumenChartFrame>
  )
}

export interface LumenHeatmapProps extends Omit<ViewProps, 'children'>, LumenHeatmapOptions {
  data: readonly LumenHeatmapDatum[]
  description?: string
  formatCategory?: (value: number | string) => string
  formatValue?: (value: number) => string
  heading?: string
  label: string
  labels?: Partial<LumenChartLabels>
  showData?: boolean
  summary?: string
}

type NativeHeatmapModel = ReturnType<typeof createLumenHeatmapModel>

const nativeHeatmapColumns = (model: NativeHeatmapModel): { label: string, value: number | string }[] => {
  const columns = new Map<number | string, string>()

  for (const cell of model.cells) {
    if (!columns.has(cell.x)) columns.set(cell.x, cell.xLabel ?? String(cell.x))
  }

  return [...columns].map(([value, label]) => ({ label, value }))
}

const LumenHeatmapLegend = ({ model, colorScale, width, labels, formatValue }: {
  model: NativeHeatmapModel
  colorScale: LumenHeatmapOptions['colorScale']
  width: number
  labels: LumenChartLabels
  formatValue: (value: number) => string
}): ReactElement => {
  const theme = useLumenTheme()
  const gradientId = `heatmap-${useId().replaceAll(':', '')}`
  let midpointAnchor: 'start' | 'middle' | 'end' = 'middle'

  if (model.midpointPercent < 15) midpointAnchor = 'start'

  if (model.midpointPercent > 85) midpointAnchor = 'end'

  const stops: { key: string, position: number, value: number, color: string, anchor: 'start' | 'middle' | 'end' }[] = [
    { key: 'minimum',
      position: 0,
      value: model.domain.min,
      anchor: 'start',
      color: colorScale === 'diverging' ? theme.chartColors.divergingNegative : theme.chartColors.sequentialLow },
    ...(colorScale === 'diverging' ?
      [{ key: 'midpoint',
        position: model.midpointPercent / 100,
        value: model.midpoint,
        color: theme.chartColors.divergingMid,
        anchor: midpointAnchor }] :
      []),
    { key: 'maximum',
      position: 1,
      value: model.domain.max,
      anchor: 'end',
      color: colorScale === 'diverging' ? theme.chartColors.divergingPositive : theme.chartColors.sequentialHigh }
  ]

  return (
    <View accessible accessibilityLabel={`${labels.chartLegend}: ${stops.map(stop => formatValue(stop.value)).join(', ')}`}>
      <Svg aria-hidden accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" height={colorScale === 'diverging' ? 54 : 38} width={width}>
        <Defs>
          <LinearGradient id={gradientId} x1="0%" x2="100%" y1="0%" y2="0%">
            {stops.map(stop => <Stop key={stop.key} offset={stop.position} stopColor={stop.color} />)}
          </LinearGradient>
        </Defs>
        <Rect fill={`url(#${gradientId})`} height={8} rx={4} width={width} />
        {stops.map(stop => (
          <SvgText
            key={stop.key}
            fill={theme.colors.inkSoft}
            fontSize={12}
            fontFamily={theme.fontFamilies.sans.join(', ')}
            transform={`translate(${stop.position * width} ${stop.key === 'midpoint' ? 48 : 28})`}
            textAnchor={stop.anchor}
          >
            {formatValue(stop.value)}
          </SvgText>
        ))}
      </Svg>
    </View>
  )
}

const LumenHeatmapPlot = ({ model, colorScale, labels, formatValue }: {
  model: NativeHeatmapModel
  colorScale: LumenHeatmapOptions['colorScale']
  labels: LumenChartLabels
  formatValue: (value: number) => string
}): ReactElement => {
  const theme = useLumenTheme()
  const [width, setWidth] = useState(320)
  const left = Math.min(width * 0.3, getLumenChartAxisPadding(model.yTicks.map(tick => tick.label)))
  const plotWidth = width - left - 16
  const x = (position: number) => left + (position - 120) * plotWidth / 496
  const y = (position: number) => 8 + (position - 24) * 208 / 248
  const columns = nativeHeatmapColumns(model)

  const ticks = getLumenChartCategoryTicks(columns.map(column => column.label), {
    start: left,
    end: width - 16,
    positions: columns.map((_, index) => left + (index + 0.5) * plotWidth / columns.length)
  })

  const hasMissing = model.cells.some(cell => cell.value === null || !Number.isFinite(cell.value))
  const rowTicks = model.yTicks.filter((_, index) => index % Math.max(1, Math.ceil(model.yTicks.length / 12)) === 0)

  return (
    <View
      style={{ gap: theme.spacing.sm }}
      onLayout={event => {
        const nextWidth = event.nativeEvent.layout.width

        if (Number.isFinite(nextWidth) && nextWidth > 0) setWidth(Math.max(160, Math.floor(nextWidth)))
      }}
    >
      <ScrollView horizontal>
        <Svg aria-hidden accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" height={256} width={width}>
          {model.cells.map(cell => {
            const mix = getLumenHeatmapColorMix(cell.value, model.domain, colorScale, model.midpoint)
            const cellWidth = Math.max(0, cell.width * plotWidth / 496 - 2)
            const cellHeight = Math.max(0, cell.height * 208 / 248 - 2)
            const missingMarkSize = Math.min(4, cellWidth / 2, cellHeight / 2)

            return (
              <G key={JSON.stringify([cell.x, cell.y])} transform={`translate(${x(cell.xCoordinate) + 1} ${y(cell.yCoordinate) + 1})`}>
                <Rect
                  fill={mix ? theme.chartColors[mix.base] : theme.colors.surfaceMuted}
                  height={cellHeight}
                  width={cellWidth}
                  rx={2}
                />
                {mix ?
                  (
                    <Rect
                      fill={theme.chartColors[mix.overlay]}
                      fillOpacity={mix.ratio}
                      height={cellHeight}
                      width={cellWidth}
                      rx={2}
                    />
                  ) :
                  (
                    <Path
                      d={`M ${(cellWidth - missingMarkSize) / 2} ${(cellHeight - missingMarkSize) / 2} l ${missingMarkSize} ${missingMarkSize} m ${-missingMarkSize} 0 l ${missingMarkSize} ${-missingMarkSize}`}
                      stroke={theme.colors.inkSoft}
                      strokeWidth={1}
                    />
                  )}
              </G>
            )
          })}
          {ticks.map(tick => (
            <SvgText
              key={tick.index}
              fill={theme.colors.inkSoft}
              fontSize={12}
              fontFamily={theme.fontFamilies.sans.join(', ')}
              textAnchor={tick.textAnchor}
              transform={`translate(${tick.position} 240)`}
            >
              {tick.label}
            </SvgText>
          ))}
          {rowTicks.map(tick => (
            <SvgText
              key={JSON.stringify(tick.value)}
              fill={theme.colors.inkSoft}
              fontSize={12}
              fontFamily={theme.fontFamilies.sans.join(', ')}
              textAnchor="end"
              transform={`translate(${left - 8} ${y(tick.position) + 4})`}
            >
              {getLumenChartCategoryTicks([tick.label], { start: 0, end: left - 12 })[0]?.label ?? ''}
            </SvgText>
          ))}
        </Svg>
      </ScrollView>
      <LumenHeatmapLegend
        model={model}
        colorScale={colorScale}
        width={width}
        labels={labels}
        formatValue={formatValue}
      />
      {hasMissing && <Text style={{ color: theme.colors.inkSoft, fontSize: theme.fontSizes.sm }}>{`× ${labels.notAvailable}`}</Text>}
    </View>
  )
}

export const LumenHeatmap = ({
  colorScale = 'sequential', data, description, domain, formatCategory, formatValue, heading,
  label, labels, midpoint, showData = true, style, summary, ...props
}: LumenHeatmapProps): ReactElement => {
  const theme = useLumenTheme()
  const categoryFormatter = resolveLumenChartCategoryFormatter(formatCategory)

  const model = createLumenHeatmapModel(data.map(datum => ({
    ...datum, xLabel: datum.xLabel ?? categoryFormatter(datum.x), yLabel: datum.yLabel ?? categoryFormatter(datum.y)
  })), { colorScale, ...(domain ? { domain } : {}), ...(midpoint === undefined ? {} : { midpoint }) })

  const availableCells = model.cells.filter(cell => cell.value !== null && Number.isFinite(cell.value))
  const chartLabels = resolveLumenChartLabels(labels)
  const resolvedSummary = summary ?? chartLabels.formatHeatmapSummary(availableCells.length)
  const valueFormatter = resolveLumenChartValueFormatter(formatValue)

  return (
    <LumenChartFrame
      label={label}
      style={style}
      summary={resolvedSummary}
      {...props}
      {...(heading === undefined ? {} : { heading })}
      {...(description === undefined ? {} : { description })}
    >
      {availableCells.length > 0 ?
        <LumenHeatmapPlot model={model} colorScale={colorScale} labels={chartLabels} formatValue={valueFormatter} /> :
        <Text style={{ color: theme.colors.inkSoft }}>{chartLabels.empty}</Text>}
      {showData && (
        <LumenChartStructuredDataList
          labels={chartLabels}
          rows={model.cells.map(datum => ({
            id: JSON.stringify([datum.x, datum.y]),
            label: `${datum.xLabel ?? categoryFormatter(datum.x)}, ${datum.yLabel ?? categoryFormatter(datum.y)}: ${
              datum.value === null || !Number.isFinite(datum.value) ?
                chartLabels.notAvailable :
                valueFormatter(datum.value)
            }`
          }))}
        />
      )}
    </LumenChartFrame>
  )
}

export interface LumenRangeChartProps extends Omit<ViewProps, 'children'> {
  data: readonly LumenRangeDatum[]
  formatCategory?: (value: number | string) => string
  formatValue?: (value: number) => string
  label: string
  labels?: Partial<LumenChartLabels>
  showData?: boolean
  summary?: string
  tone?: LumenChartTone
}

export const LumenRangeChart = ({
  data,
  formatCategory,
  formatValue,
  label,
  labels,
  showData = true,
  style,
  summary,
  tone,
  ...props
}: LumenRangeChartProps): ReactElement => {
  const theme = useLumenTheme()
  const geometry = createLumenRangeGeometry(data)
  const hasData = geometry.points.length > 0
  const chartLabels = resolveLumenChartLabels(labels)
  const resolvedSummary = summary ?? chartLabels.formatRangeSummary(geometry.points.length)
  const color = lumenChartToneColor(resolveLumenChartTone(tone), theme)
  const categoryFormatter = resolveLumenChartCategoryFormatter(formatCategory)
  const valueFormatter = resolveLumenChartValueFormatter(formatValue)

  return (
    <LumenChartFrame label={label} style={style} summary={resolvedSummary} {...props}>
      {hasData ?
        (
          <ScrollView accessibilityLabel={chartLabels.chartData} horizontal>
            <Svg height={320} viewBox="0 0 640 320" width={640}>
              <Path
                d={geometry.areaPath}
                fill={color}
                fillOpacity={lumenChartOpacities.area}
                stroke={color}
                strokeWidth={lumenChartStrokeWidths.series}
              />
            </Svg>
          </ScrollView>
        ) :
        <Text style={{ color: theme.colors.inkMuted }}>{chartLabels.empty}</Text>}
      {showData ?
        (
          <LumenChartStructuredDataList
            labels={chartLabels}
            rows={data.map(datum => ({
              id: datum.id ?? `${typeof datum.x}:${String(datum.x)}`,
              label: `${datum.xLabel ?? categoryFormatter(datum.x)}: ${
                datum.low === null || !Number.isFinite(datum.low) ?
                  chartLabels.notAvailable :
                  valueFormatter(datum.low)
              } to ${
                datum.high === null || !Number.isFinite(datum.high) ?
                  chartLabels.notAvailable :
                  valueFormatter(datum.high)
              }`
            }))}
          />
        ) :
        null}
    </LumenChartFrame>
  )
}

export interface LumenComboChartProps extends LumenDataChartProps {
  series: readonly LumenComboSeries[]
}

export const LumenComboChart = ({
  formatCategory,
  formatValue,
  label,
  labels,
  onSelectionChange,
  selectedSeriesId,
  selectedX,
  series,
  showData = true,
  summary,
  ...props
}: LumenComboChartProps): ReactElement => {
  const theme = useLumenTheme()
  const valueFormatter = resolveLumenChartValueFormatter(formatValue)
  const chartLabels = resolveLumenChartLabels(labels)
  const width = 640
  const height = 320
  const padding = 44
  const categories = getLumenChartCategories(series)

  const aligned = series.map(item => ({
    ...item,
    data: alignLumenChartSeries(item, categories).data
  }))

  const domain = getLumenChartDomain(
    aligned.flatMap(item => item.data.map(datum => datum.y))
  )

  const barSeries = aligned.filter(item => item.mark === 'bar')
  const lineSeries = aligned.filter(item => item.mark !== 'bar')
  const bars = createLumenBarGeometry(barSeries, { domain, height, width })

  const categoryPositions = new Map(
    bars.categories.map(category => [`${typeof category.category}:${String(category.category)}`, category.x])
  )

  const drawableWidth = width - padding * 2

  const alignComboLineDatum = (datum: LumenChartDatum): LumenChartDatum => {
    if (barSeries.length === 0) return datum

    return {
      ...datum,
      x: ((categoryPositions.get(`${typeof datum.x}:${String(datum.x)}`) ?? padding) - padding) / drawableWidth
    }
  }

  const lineGeometryOptions = {
    domain,
    height,
    padding,
    width,
    ...(barSeries.length === 0 ?
      {} :
      {
        paddingBottom: bars.margin.bottom,
        paddingTop: bars.margin.top,
        xDomain: { max: 1, min: 0 },
        xScale: 'linear' as const
      })
  }

  const resolvedSummary = summary ?? formatLumenChartSummary(series, valueFormatter, chartLabels)

  return (
    <LumenChartFrame label={label} summary={resolvedSummary} {...props}>
      {hasLumenChartData(series) ?
        (
          <ScrollView accessibilityLabel={chartLabels.chartData} horizontal>
            <Svg height={height} viewBox={`0 0 ${width} ${height}`} width={width}>
              {bars.marks.map(mark => (
                <Rect
                  fill={lumenChartToneColor(mark.tone, theme)}
                  height={mark.height}
                  key={`${mark.seriesId}:${typeof mark.category}:${String(mark.category)}`}
                  rx={4}
                  transform={`translate(${mark.x} ${mark.y})`}
                  width={mark.width}
                />
              ))}
              {lineSeries.map((item, index) => {
                const geometry = createLumenLineGeometry(
                  item.data.map(alignComboLineDatum),
                  lineGeometryOptions
                )

                const color = lumenChartToneColor(
                  resolveLumenChartTone(item.tone, index + barSeries.length), theme
                )

                return (
                  <Fragment key={item.id}>
                    {item.mark === 'area' ?
                      geometry.areaPaths.map(path => (
                        <Path
                          d={path}
                          fill={color}
                          fillOpacity={lumenChartOpacities.area}
                          key={path}
                        />
                      )) :
                      null}
                    <Path
                      d={geometry.path}
                      fill="none"
                      stroke={color}
                      strokeWidth={lumenChartStrokeWidths.series}
                    />
                  </Fragment>
                )
              })}
            </Svg>
          </ScrollView>
        ) :
        <Text style={{ color: theme.colors.inkMuted }}>{chartLabels.empty}</Text>}
      {showData ?
        (
          <LumenChartDataList
            formatCategory={formatCategory}
            formatValue={valueFormatter}
            labels={chartLabels}
            series={series}
            {...(onSelectionChange ? { onSelect: onSelectionChange } : {})}
            {...(selectedSeriesId === undefined ? {} : { selectedSeriesId })}
            {...(selectedX === undefined ? {} : { selectedX })}
          />
        ) :
        null}
    </LumenChartFrame>
  )
}

interface LumenIntervalChartProps extends Omit<ViewProps, 'children'> {
  description?: string
  formatValue?: (value: number) => string
  heading?: string
  label: string
  labels?: Partial<LumenChartLabels>
  showData?: boolean
  summary?: string
  valueLabel?: string
}

export interface LumenWaterfallChartProps extends LumenIntervalChartProps {
  data: readonly LumenWaterfallDatum[]
}

export interface LumenHistogramProps extends LumenIntervalChartProps {
  data: readonly LumenHistogramBin[]
  formatBoundary?: (value: number) => string
  frequency?: 'count' | 'density'
  tone?: LumenChartTone
}

type LumenNativeIntervalModel =
  ReturnType<typeof createLumenWaterfallGeometry> | ReturnType<typeof createLumenHistogramGeometry>

const nativeIntervalValueLabel = (model: LumenNativeIntervalModel, text: Readonly<LumenChartLabels>): string => {
  if (!('frequency' in model)) return text.value

  return model.frequency === 'density' ? text.density : text.count
}

const nativeIntervalRows = (
  model: LumenNativeIntervalModel, text: Readonly<LumenChartLabels>, title: string,
  formatBoundary: (value: number) => string, formatValue: (value: number) => string
): { id: string, label: string }[] => model.marks.map((mark, index) => {
  const count = 'bins' in model && model.frequency === 'density' ?
    `, ${text.count}: ${formatValue(model.bins[index]?.count ?? 0)}` :
    ''

  return {
    id: mark.key,
    label: `${mark.label}, ${text.start}: ${formatBoundary(mark.start)}, ${text.end}: ${formatBoundary(mark.end)}, ` +
      `${title}: ${formatValue(mark.value)}${count}`
  }
})

const LumenIntervalPlot = ({ model, label, formatValue }: {
  model: LumenNativeIntervalModel
  label: string
  formatValue: (value: number) => string
}): ReactElement => {
  const theme = useLumenTheme()

  return (
    <ScrollView accessibilityLabel={label} horizontal>
      <Svg accessible={false} height={model.height} width={model.width}>
        {model.ticks.map(tick => (
          <Fragment key={tick}>
            <Line
              stroke={theme.chartColors.grid}
              strokeDasharray="3 5"
              x1={model.left}
              x2={model.right}
              y1={model.y(tick)}
              y2={model.y(tick)}
            />
            <SvgText
              fill={theme.colors.inkSoft}
              fontFamily={theme.fontFamilies.sans.join(', ')}
              fontSize={12}
              textAnchor="end"
              transform={`translate(${model.left - 8} ${model.y(tick) + 4})`}
            >
              {formatValue(tick)}
            </SvgText>
          </Fragment>
        ))}
        {'connectors' in model && model.connectors.map(connector => (
          <Line
            key={`${connector.x1}:${connector.x2}`}
            stroke={theme.colors.inkSoft}
            strokeDasharray="4 4"
            x1={connector.x1}
            x2={connector.x2}
            y1={connector.y}
            y2={connector.y}
          />
        ))}
        {model.marks.map(mark => (
          <Rect
            fill={lumenChartToneColor(mark.tone, theme)}
            height={mark.height}
            key={mark.key}
            rx={2}
            transform={`translate(${mark.x} ${mark.y})`}
            width={mark.width}
          />
        ))}
        {model.categoryTicks.map(tick => (
          <SvgText
            fill={theme.colors.inkSoft}
            fontFamily={theme.fontFamilies.sans.join(', ')}
            fontSize={12}
            key={tick.index}
            textAnchor={tick.textAnchor}
            transform={`translate(${tick.position} ${model.height - 12})`}
          >
            {tick.label}
          </SvgText>
        ))}
      </Svg>
    </ScrollView>
  )
}

const LumenIntervalChart = ({
  formatBoundary,
  formatValue = String,
  labels,
  createModel,
  showData = true,
  summary,
  valueLabel,
  ...props
}: LumenIntervalChartProps & {
  formatBoundary: (value: number) => string
  createModel: (width: number) => LumenNativeIntervalModel
}): ReactElement => {
  const [width, setWidth] = useState(320)
  const model = createModel(width)
  const theme = useLumenTheme()
  const text = resolveLumenChartLabels(labels)
  const valueTitle = valueLabel ?? nativeIntervalValueLabel(model, text)
  const series = [{ id: 'values', label: valueTitle, data: model.marks.map(mark => ({ x: mark.key, y: mark.value })) }]
  const hasData = model.marks.length > 0
  const factualSummary = model.valid ? formatLumenChartSummary(series, formatValue, text) : text.invalidData

  return (
    <LumenChartFrame {...props} summary={summary ?? factualSummary}>
      {hasData ?
        (
          <>
            <Text style={{ color: theme.colors.inkSoft, fontSize: theme.fontSizes.sm }}>{valueTitle}</Text>
            <View onLayout={event => {
              const measured = event.nativeEvent.layout.width

              if (Number.isFinite(measured) && measured > 0) setWidth(Math.max(240, Math.floor(measured)))
            }}
            >
              <LumenIntervalPlot model={model} label={text.chartData} formatValue={formatValue} />
            </View>
          </>
        ) :
        (
          <Text accessibilityRole="alert" style={{ color: theme.colors.inkSoft }}>
            {model.valid ? text.empty : text.invalidData}
          </Text>
        )}
      {showData && hasData && (
        <LumenChartStructuredDataList
          labels={text}
          rows={nativeIntervalRows(model, text, valueTitle, formatBoundary, formatValue)}
        />
      )}
    </LumenChartFrame>
  )
}

export const LumenWaterfallChart = ({
  data, formatValue = String, ...props
}: LumenWaterfallChartProps): ReactElement => (
  <LumenIntervalChart
    {...props}
    formatBoundary={formatValue}
    formatValue={formatValue}
    createModel={width => createLumenWaterfallGeometry(data, { axisFontSize: 12, formatValue, width, height: 260 })}
  />
)

export const LumenHistogram = ({
  data, formatBoundary = String, formatValue = String, frequency = 'count', tone = 'series-1', ...props
}: LumenHistogramProps): ReactElement => (
  <LumenIntervalChart
    {...props}
    formatBoundary={formatBoundary}
    formatValue={formatValue}
    createModel={width => createLumenHistogramGeometry(data, {
      axisFontSize: 12, formatBoundary, formatValue, frequency, tone, width, height: 260
    })}
  />
)
