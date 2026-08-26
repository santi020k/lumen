import { Fragment, type ReactElement, type ReactNode } from 'react'
import {
  Pressable,
  ScrollView,
  Text,
  View,
  type ViewProps
} from 'react-native'
import { Circle, Line, Path, Rect, Svg } from 'react-native-svg'

import {
  alignLumenChartSeries,
  createLumenBarGeometry,
  createLumenHeatmapGeometry,
  createLumenLineGeometry,
  createLumenPieGeometry,
  createLumenRangeGeometry,
  createLumenScatterGeometry,
  formatLumenChartSummary,
  getLumenChartCategories,
  getLumenChartDomain,
  getLumenChartTicks,
  hasLumenChartData,
  hasLumenPieData,
  type LumenBarChartLayout,
  type LumenChartDatum,
  type LumenChartSeries,
  type LumenChartTone,
  type LumenComboSeries,
  type LumenHeatmapDatum,
  type LumenPieChartVariant,
  type LumenRangeDatum,
  resolveLumenChartTone,
  scaleLumenChartValue
} from '@santi020k/lumen-core'

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
  LumenRangeDatum
} from '@santi020k/lumen-core'

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
          <Text style={{ color: theme.colors.inkMuted, fontSize: theme.fontSizes.sm }}>
            {description}
          </Text>
        ) :
        null}
      {children}
    </View>
  )
}

interface LumenChartDataListProps {
  formatCategory: (value: number | string) => string
  formatValue: (value: number) => string
  onSelect?: (seriesId: string, x: number | string) => void
  selectedSeriesId?: string
  selectedX?: number | string
  series: readonly LumenChartSeries[]
}

const chartDatumLabel = (
  item: LumenChartSeries,
  datum: LumenChartSeries['data'][number],
  formatCategory: (value: number | string) => string,
  formatValue: (value: number) => string
): string => {
  const category = datum.xLabel ?? formatCategory(datum.x)

  const value = datum.label ?? (
    datum.y === null || !Number.isFinite(datum.y) ? 'Not available' : formatValue(datum.y)
  )

  return `${category}, ${item.label}: ${value}`
}

const LumenChartDataList = ({
  formatCategory,
  formatValue,
  onSelect,
  selectedSeriesId,
  selectedX,
  series
}: LumenChartDataListProps): ReactElement => {
  const theme = useLumenTheme()

  return (
    <View accessibilityRole="list" style={{ gap: theme.spacing.xs }}>
      <Text style={{ color: theme.colors.ink, fontWeight: '700' }}>Chart data</Text>
      {series.flatMap(item => item.data.map(datum => {
        const label = chartDatumLabel(item, datum, formatCategory, formatValue)
        const selected = selectedSeriesId === item.id && selectedX === datum.x
        const key = `${item.id}:${typeof datum.x}:${String(datum.x)}`

        if (!onSelect || datum.y === null || !Number.isFinite(datum.y)) {
          return (
            <Text key={key} style={{ color: theme.colors.inkSoft, fontSize: theme.fontSizes.sm }}>
              {label}
            </Text>
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
              backgroundColor: selected ? theme.colors.brandSoft : theme.colors.surfaceMuted,
              borderRadius: theme.radii.sm,
              minHeight: 44,
              padding: theme.spacing.sm
            }}
          >
            <Text style={{ color: theme.colors.inkSoft, fontSize: theme.fontSizes.sm }}>
              {label}
            </Text>
          </Pressable>
        )
      }))}
    </View>
  )
}

interface LumenChartStructuredDataListProps {
  rows: readonly { id: string, label: string }[]
}

const LumenChartStructuredDataList = ({
  rows
}: LumenChartStructuredDataListProps): ReactElement => {
  const theme = useLumenTheme()

  return (
    <View accessibilityRole="list" style={{ gap: theme.spacing.xs }}>
      <Text style={{ color: theme.colors.ink, fontWeight: '700' }}>Chart data</Text>
      {rows.map(row => (
        <Text key={row.id} style={{ color: theme.colors.inkSoft, fontSize: theme.fontSizes.sm }}>
          {row.label}
        </Text>
      ))}
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

interface LumenDataChartProps extends Omit<ViewProps, 'children'> {
  description?: string
  formatCategory?: (value: number | string) => string
  formatValue?: (value: number) => string
  heading?: string
  label: string
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
  series: readonly LumenChartSeries[]
}

export const LumenLineChart = ({
  area = false,
  formatCategory,
  formatValue,
  label,
  onSelectionChange,
  selectedSeriesId,
  selectedX,
  series,
  showData = true,
  summary,
  ...props
}: LumenLineChartProps): ReactElement => {
  const theme = useLumenTheme()
  const categoryFormatter = resolveLumenChartCategoryFormatter(formatCategory)
  const valueFormatter = resolveLumenChartValueFormatter(formatValue)
  const width = 640
  const height = 320
  const padding = 44
  const categories = getLumenChartCategories(series)
  const aligned = series.map(item => alignLumenChartSeries(item, categories))

  const domain = getLumenChartDomain(
    aligned.flatMap(item => item.data.map(datum => datum.y)), false
  )

  const ticks = getLumenChartTicks(domain)
  const resolvedSummary = summary ?? formatLumenChartSummary(series, valueFormatter)

  return (
    <LumenChartFrame label={label} summary={resolvedSummary} {...props}>
      {hasLumenChartData(series) ?
        (
          <ScrollView horizontal>
            <Svg height={height} viewBox={`0 0 ${width} ${height}`} width={width}>
              {ticks.map(tick => {
                const y = scaleLumenChartValue(tick, domain, height - padding, padding)

                return (
                  <Line
                    key={tick}
                    stroke={theme.chartColors.grid}
                    strokeOpacity={lumenChartOpacities.grid}
                    strokeWidth={lumenChartStrokeWidths.grid}
                    x1={padding}
                    x2={width - padding}
                    y1={y}
                    y2={y}
                  />
                )
              })}
              {aligned.map((item, index) => {
                const geometry = createLumenLineGeometry(item.data, {
                  domain,
                  height,
                  padding,
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
                  </Fragment>
                )
              })}
            </Svg>
          </ScrollView>
        ) :
        <Text style={{ color: theme.colors.inkMuted }}>No chart data available.</Text>}
      {showData ?
        (
          <LumenChartDataList
            formatCategory={categoryFormatter}
            formatValue={valueFormatter}
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

export interface LumenBarChartProps extends LumenDataChartProps {
  layout?: LumenBarChartLayout
  series: readonly LumenChartSeries[]
}

export const LumenBarChart = ({
  formatCategory,
  formatValue,
  label,
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
  const categoryFormatter = resolveLumenChartCategoryFormatter(formatCategory)
  const valueFormatter = resolveLumenChartValueFormatter(formatValue)
  const geometry = createLumenBarGeometry(series, { layout })
  const resolvedSummary = summary ?? formatLumenChartSummary(series, valueFormatter)

  return (
    <LumenChartFrame label={label} summary={resolvedSummary} {...props}>
      {hasLumenChartData(series) ?
        (
          <ScrollView horizontal>
            <Svg
              height={geometry.height}
              viewBox={`0 0 ${geometry.width} ${geometry.height}`}
              width={geometry.width}
            >
              {geometry.marks.map(mark => (
                <Rect
                  fill={lumenChartToneColor(mark.tone, theme)}
                  height={mark.height}
                  key={`${mark.seriesId}:${String(mark.category)}`}
                  rx={4}
                  transform={`translate(${mark.x} ${mark.y})`}
                  width={mark.width}
                />
              ))}
            </Svg>
          </ScrollView>
        ) :
        <Text style={{ color: theme.colors.inkMuted }}>No chart data available.</Text>}
      {showData ?
        (
          <LumenChartDataList
            formatCategory={categoryFormatter}
            formatValue={valueFormatter}
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

export interface LumenPieChartProps extends LumenDataChartProps {
  series: LumenChartSeries
  variant?: LumenPieChartVariant
}

export const LumenPieChart = ({
  formatCategory,
  formatValue,
  label,
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
  const categoryFormatter = resolveLumenChartCategoryFormatter(formatCategory)
  const valueFormatter = resolveLumenChartValueFormatter(formatValue)
  const geometry = createLumenPieGeometry(series.data, { size: 320, variant })
  const resolvedSummary = summary ?? formatLumenChartSummary([series], valueFormatter)

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
        <Text style={{ color: theme.colors.inkMuted }}>No chart data available.</Text>}
      {showData ?
        (
          <LumenChartDataList
            formatCategory={categoryFormatter}
            formatValue={valueFormatter}
            series={[series]}
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
  onSelectionChange,
  selectedSeriesId,
  selectedX,
  series,
  showData = true,
  summary,
  ...props
}: LumenScatterChartProps): ReactElement => {
  const theme = useLumenTheme()
  const categoryFormatter = resolveLumenChartCategoryFormatter(formatCategory)
  const valueFormatter = resolveLumenChartValueFormatter(formatValue)
  const geometry = createLumenScatterGeometry(series)
  const resolvedSummary = summary ?? formatLumenChartSummary(series, valueFormatter)

  return (
    <LumenChartFrame label={label} summary={resolvedSummary} {...props}>
      <ScrollView horizontal>
        <Svg height={geometry.height} width={geometry.width}>
          {geometry.points.map(point => (
            <Circle
              cx={point.xCoordinate}
              cy={point.yCoordinate}
              fill={lumenChartToneColor(point.tone, theme)}
              key={`${point.seriesId}:${typeof point.x}:${String(point.x)}`}
              r={point.radius}
            />
          ))}
        </Svg>
      </ScrollView>
      {showData ?
        (
          <LumenChartDataList
            formatCategory={categoryFormatter}
            formatValue={valueFormatter}
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

export interface LumenHeatmapProps extends Omit<ViewProps, 'children'> {
  data: readonly LumenHeatmapDatum[]
  formatCategory?: (value: number | string) => string
  formatValue?: (value: number) => string
  label: string
  showData?: boolean
  summary?: string
}

export const LumenHeatmap = ({
  data,
  formatCategory,
  formatValue,
  label,
  showData = true,
  style,
  summary = `${data.length} heatmap cells.`,
  ...props
}: LumenHeatmapProps): ReactElement => {
  const theme = useLumenTheme()
  const geometry = createLumenHeatmapGeometry(data)
  const availableCells = geometry.cells.filter(cell => cell.value !== null && Number.isFinite(cell.value))
  const categoryFormatter = resolveLumenChartCategoryFormatter(formatCategory)
  const valueFormatter = resolveLumenChartValueFormatter(formatValue)

  return (
    <LumenChartFrame label={label} style={style} summary={summary} {...props}>
      <ScrollView horizontal>
        <Svg height={geometry.height} width={geometry.width}>
          {availableCells.map(cell => (
            <Rect
              fill={theme.chartColors.sequentialHigh}
              fillOpacity={Math.max(0.12, cell.ratio)}
              height={Math.max(0, cell.height - 2)}
              key={cell.id ?? `${typeof cell.x}:${String(cell.x)}:${typeof cell.y}:${String(cell.y)}`}
              rx={3}
              transform={`translate(${cell.xCoordinate + 1} ${cell.yCoordinate + 1})`}
              width={Math.max(0, cell.width - 2)}
            />
          ))}
        </Svg>
      </ScrollView>
      {showData ?
        (
          <LumenChartStructuredDataList rows={data.map(datum => ({
            id: datum.id ?? `${typeof datum.x}:${String(datum.x)}:${typeof datum.y}:${String(datum.y)}`,
            label: `${categoryFormatter(datum.x)}, ${categoryFormatter(datum.y)}: ${
              datum.value === null || !Number.isFinite(datum.value) ?
                'Not available' :
                valueFormatter(datum.value)
            }`
          }))}
          />
        ) :
        null}
    </LumenChartFrame>
  )
}

export interface LumenRangeChartProps extends Omit<ViewProps, 'children'> {
  data: readonly LumenRangeDatum[]
  formatCategory?: (value: number | string) => string
  formatValue?: (value: number) => string
  label: string
  showData?: boolean
  summary?: string
  tone?: LumenChartTone
}

export const LumenRangeChart = ({
  data,
  formatCategory,
  formatValue,
  label,
  showData = true,
  style,
  summary = `${data.length} ranges.`,
  tone,
  ...props
}: LumenRangeChartProps): ReactElement => {
  const theme = useLumenTheme()
  const geometry = createLumenRangeGeometry(data)
  const color = lumenChartToneColor(resolveLumenChartTone(tone), theme)
  const categoryFormatter = resolveLumenChartCategoryFormatter(formatCategory)
  const valueFormatter = resolveLumenChartValueFormatter(formatValue)

  return (
    <LumenChartFrame label={label} style={style} summary={summary} {...props}>
      <ScrollView horizontal>
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
      {showData ?
        (
          <LumenChartStructuredDataList rows={data.map(datum => ({
            id: datum.id ?? `${typeof datum.x}:${String(datum.x)}`,
            label: `${datum.xLabel ?? categoryFormatter(datum.x)}: ${
              datum.low === null || !Number.isFinite(datum.low) ?
                'Not available' :
                valueFormatter(datum.low)
            } to ${
              datum.high === null || !Number.isFinite(datum.high) ?
                'Not available' :
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
  onSelectionChange,
  selectedSeriesId,
  selectedX,
  series,
  showData = true,
  summary,
  ...props
}: LumenComboChartProps): ReactElement => {
  const theme = useLumenTheme()
  const categoryFormatter = resolveLumenChartCategoryFormatter(formatCategory)
  const valueFormatter = resolveLumenChartValueFormatter(formatValue)
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
        xDomain: { max: 1, min: 0 },
        xScale: 'linear' as const
      })
  }

  const resolvedSummary = summary ?? formatLumenChartSummary(series, valueFormatter)

  return (
    <LumenChartFrame label={label} summary={resolvedSummary} {...props}>
      {hasLumenChartData(series) ?
        (
          <ScrollView horizontal>
            <Svg height={height} viewBox={`0 0 ${width} ${height}`} width={width}>
              {bars.marks.map(mark => (
                <Rect
                  fill={lumenChartToneColor(mark.tone, theme)}
                  height={mark.height}
                  key={`${mark.seriesId}:${String(mark.category)}`}
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
        <Text style={{ color: theme.colors.inkMuted }}>No chart data available.</Text>}
      {showData ?
        (
          <LumenChartDataList
            formatCategory={categoryFormatter}
            formatValue={valueFormatter}
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
