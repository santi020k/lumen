'use client'

import type { ReactNode } from 'react'

import { composeClassName, createLumenBoxPlotGeometry, createLumenCalendarHeatmapGeometry, createLumenFunnelGeometry, getLumenChartToneClassName, type LumenBoxPlotDatum, type LumenBoxPlotOptions, type LumenBoxPlotStatisticLabels, type LumenCalendarHeatmapDatum, type LumenCalendarHeatmapOptions, type LumenChartLabels, type LumenFunnelDatum, resolveLumenChartLabels } from '@santi020k/lumen-core'

import { Chart, type ChartProps } from './components.js'

interface DataChartProps extends Omit<ChartProps, 'children'> {
  formatValue?: (value: number) => string
  labels?: Partial<LumenChartLabels>
  showTable?: boolean
}

export interface CalendarHeatmapProps extends DataChartProps, LumenCalendarHeatmapOptions {
  data?: readonly LumenCalendarHeatmapDatum[]
  formatDate?: (date: string) => string
  /** Seven labels indexed Sunday (0) through Saturday (6). */
  weekdayLabels?: readonly string[]
}
export interface FunnelChartProps extends DataChartProps { data?: readonly LumenFunnelDatum[] }
export type BoxPlotStatisticLabels = LumenBoxPlotStatisticLabels
export interface BoxPlotProps extends DataChartProps, LumenBoxPlotOptions {
  data?: readonly LumenBoxPlotDatum[]
  statisticLabels?: Partial<BoxPlotStatisticLabels>
}

const defaultStatistics: BoxPlotStatisticLabels = { min: 'Lower whisker', q1: 'First quartile', median: 'Median', q3: 'Third quartile', max: 'Upper whisker', outliers: 'Outliers' }
const defaultWeekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const weekdayLabel = (
  labels: readonly string[] | undefined, day: number, weekStartsOn = 0
) => (labels ?? defaultWeekdays)[(day + weekStartsOn) % 7] ?? defaultWeekdays[(day + weekStartsOn) % 7]

const chartNumberFormatter = (formatter: ((value: number) => string) | undefined) => formatter ?? String
const calendarDateFormatter = (formatter: ((date: string) => string) | undefined) => formatter ?? String
const emptyCalendarData: readonly LumenCalendarHeatmapDatum[] = []
const emptyFunnelData: readonly LumenFunnelDatum[] = []
const emptyBoxData: readonly LumenBoxPlotDatum[] = []

const DataTable = ({ text, headings, children }: {
  text: Readonly<LumenChartLabels>
  headings: readonly { id: string, label: string }[]
  children: ReactNode
}) => (
  <details className="ui-chart__data">
    <summary>{text.viewData}</summary>
    <div role="group" tabIndex={0} aria-label={text.chartData}>
      <table>
        <thead><tr>{headings.map(heading => <th key={heading.id} scope="col">{heading.label}</th>)}</tr></thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  </details>
)

export const CalendarHeatmap = ({
  data = emptyCalendarData,
  startDate,
  endDate,
  weekStartsOn,
  domain,
  formatValue = String,
  formatDate,
  weekdayLabels,
  labels,
  showTable = true,
  summary,
  className,
  ...props
}: CalendarHeatmapProps) => {
  const dateFormatter = calendarDateFormatter(formatDate)
  const text = resolveLumenChartLabels(labels)
  const model = createLumenCalendarHeatmapGeometry(data, { startDate, endDate, weekStartsOn, domain })
  const format = (value: number | null) => value === null ? text.notAvailable : formatValue(value)
  const available = model.cells.filter(cell => cell.value !== null).length

  return (
    <Chart {...props} className={composeClassName('ui-calendar-heatmap', className)} summary={summary ?? (model.valid ? text.formatHeatmapSummary(available) : text.invalidData)}>
      {!model.valid ?
        <p className="ui-chart__empty" role="status">{text.invalidData}</p> :
        (
          <>
            {available === 0 && <p className="ui-chart__empty" role="status">{text.empty}</p>}
            <p className="ui-calendar-heatmap__range">
              {dateFormatter(startDate)}
              {' '}
              –
              {' '}
              {dateFormatter(endDate)}
            </p>
            <div className="ui-calendar-heatmap__plot" role="group" tabIndex={0} aria-label={text.chartData}>
              <svg aria-hidden="true" width={model.weekCount * 18 + 36} height="146" viewBox={`0 0 ${model.weekCount * 18 + 36} 146`}>
                {Array.from({ length: 7 }, (_, day) => (
                  <text
                    key={day}
                    x="0"
                    y={day * 18 + 16}
                    className="ui-calendar-heatmap__weekday"
                  >
                    {weekdayLabel(weekdayLabels, day, weekStartsOn)}
                  </text>
                ))}
                {model.cells.map(cell => (
                  <g key={cell.date}>
                    <rect
                      className="
                        ui-calendar-heatmap__cell ui-chart-tone--series-1
                      "
                      data-missing={cell.value === null ? 'true' : undefined}
                      x={cell.week * 18 + 36}
                      y={cell.day * 18 + 4}
                      width="14"
                      height="14"
                      rx="3"
                      style={{ fillOpacity: cell.ratio === null ? 1 : 0.15 + cell.ratio * 0.85 }}
                    >
                      <title>{`${dateFormatter(cell.date)}: ${format(cell.value)}`}</title>
                    </rect>
                    {cell.value === null && (
                      <text
                        className="ui-calendar-heatmap__missing"
                        x={cell.week * 18 + 43}
                        y={cell.day * 18 + 15}
                        textAnchor="middle"
                      >
                        ×
                      </text>
                    )}
                  </g>
                ))}
                {model.cells.filter(cell => cell.day === 0 && cell.week % 4 === 0).map(cell => (
                  <text
                    className="ui-calendar-heatmap__weekday"
                    key={cell.date}
                    x={cell.week * 18 + 36}
                    y="142"
                  >
                    {cell.date.slice(5)}
                  </text>
                ))}
              </svg>
            </div>
            <div className="ui-calendar-heatmap__legend">
              <span>
                {text.low}
                :
                {' '}
                {formatValue(model.domain.min)}
              </span>
              <span>
                {text.high}
                :
                {' '}
                {formatValue(model.domain.max)}
              </span>
              <span className="ui-calendar-heatmap__scale" aria-hidden="true" />
              <span>
                ×
                {text.notAvailable}
              </span>
            </div>
            {!showTable && (
              <ul className="ui-sr-only">
                {model.cells.map(cell => (
                  <li key={cell.date}>
                    {dateFormatter(cell.date)}
                    :
                    {' '}
                    {format(cell.value)}
                  </li>
                ))}
              </ul>
            )}
            {showTable && (
              <DataTable text={text} headings={[{ id: 'category', label: text.category }, { id: 'value', label: text.value }]}>
                {model.cells.map(cell => (
                  <tr key={cell.date}>
                    <th scope="row">{dateFormatter(cell.date)}</th>
                    <td>{format(cell.value)}</td>
                  </tr>
                ))}
              </DataTable>
            )}
          </>
        )}
    </Chart>
  )
}

export const FunnelChart = ({
  data = emptyFunnelData,
  formatValue = String,
  labels,
  showTable = true,
  summary,
  className,
  ...props
}: FunnelChartProps) => {
  const text = resolveLumenChartLabels(labels)
  const model = createLumenFunnelGeometry(data)
  const format = (value: number | null) => value === null ? text.notAvailable : formatValue(value)

  return (
    <Chart {...props} className={composeClassName('ui-funnel-chart', className)} summary={summary ?? (model.valid ? model.rows.map(row => `${row.label}: ${format(row.value)}`).join('. ') : text.invalidData)}>
      {!model.valid || model.rows.length === 0 ?
        <p className="ui-chart__empty" role="status">{model.valid ? text.empty : text.invalidData}</p> :
        (
          <>
            <ol className="ui-funnel-chart__rows">
              {model.rows.map((row, index) => (
                <li key={row.id} className={getLumenChartToneClassName(row.tone, index)}>
                  <div className="ui-funnel-chart__label">
                    <span>{row.label}</span>
                    <strong>{format(row.value)}</strong>
                  </div>
                  <div
                    className="ui-funnel-chart__track"
                    aria-hidden="true"
                  >
                    {row.ratio !== null && (
                      <span
                        className="ui-funnel-chart__bar"
                        style={{ width: `${row.ratio * 100}%` }}
                      />
                    )}
                  </div>
                </li>
              ))}
            </ol>
            {showTable && (
              <DataTable text={text} headings={[{ id: 'category', label: text.category }, { id: 'value', label: text.value }]}>
                {model.rows.map(row => (
                  <tr key={row.id}>
                    <th scope="row">{row.label}</th>
                    <td>{format(row.value)}</td>
                  </tr>
                ))}
              </DataTable>
            )}
          </>
        )}
    </Chart>
  )
}

export const BoxPlot = ({
  data = emptyBoxData,
  domain,
  statisticLabels,
  formatValue: suppliedFormatValue,
  labels,
  showTable = true,
  summary,
  className,
  ...props
}: BoxPlotProps) => {
  const formatValue = chartNumberFormatter(suppliedFormatValue)
  const text = resolveLumenChartLabels(labels)
  const stats = { ...defaultStatistics, ...statisticLabels }
  const model = createLumenBoxPlotGeometry(data, { domain })
  const format = (value: number | null) => value === null ? text.notAvailable : formatValue(value)
  const statistics = ['min', 'q1', 'median', 'q3', 'max'] as const

  const exactRows = model.rows.map(row => ({
    id: row.id,
    label: `${row.label}: ${statistics.map(key => `${stats[key]}: ${format(row[key])}`).join(', ')}. ${stats.outliers}: ${(row.outliers ?? []).map(formatValue).join(', ') || '—'}`
  }))

  return (
    <Chart {...props} className={composeClassName('ui-box-plot', className)} summary={summary ?? (model.valid ? exactRows.map(row => row.label).join('. ') : text.invalidData)}>
      {!model.valid || model.rows.length === 0 ?
        <p className="ui-chart__empty" role="status">{model.valid ? text.empty : text.invalidData}</p> :
        (
          <>
            <ul className="ui-box-plot__rows">
              {model.rows.map((row, index) => (
                <li key={row.id} className={getLumenChartToneClassName(row.tone, index)}>
                  <div className="ui-box-plot__label">
                    <span>{row.label}</span>
                    <strong>
                      {stats.median}
                      :
                      {' '}
                      {format(row.median)}
                    </strong>
                  </div>
                  <div
                    className="ui-box-plot__track"
                    aria-hidden="true"
                  >
                    {row.minPosition !== null && row.maxPosition !== null && (
                      <span
                        className="ui-box-plot__whisker"
                        style={{ left: `${row.minPosition * 100}%`, width: `${(row.maxPosition - row.minPosition) * 100}%` }}
                      />
                    )}
                    {row.q1Position !== null && row.q3Position !== null && (
                      <span
                        className="ui-box-plot__box"
                        style={{ left: `${row.q1Position * 100}%`, width: `${(row.q3Position - row.q1Position) * 100}%` }}
                      />
                    )}
                    {row.medianPosition !== null && (
                      <span
                        className="ui-box-plot__median"
                        style={{ left: `${row.medianPosition * 100}%` }}
                      />
                    )}
                    {[{ id: 'min', position: row.minPosition }, { id: 'max', position: row.maxPosition }].map(({ position, id }) => position !== null && (
                      <span
                        key={id}
                        className="ui-box-plot__cap"
                        style={{ left: `${position * 100}%` }}
                      />
                    ))}
                    {Array.from(new Set(row.outlierPositions)).map(position => (
                      <span
                        key={position}
                        className="ui-box-plot__outlier"
                        style={{ left: `${position * 100}%` }}
                      />
                    ))}
                  </div>
                </li>
              ))}
            </ul>
            <div className="ui-bullet-chart__ticks" aria-hidden="true">{model.ticks.map(tick => <span key={tick}>{formatValue(tick)}</span>)}</div>
            {!showTable && <ul className="ui-sr-only">{exactRows.map(row => <li key={row.id}>{row.label}</li>)}</ul>}
            {showTable && (
              <DataTable text={text} headings={[{ id: 'category', label: text.category }, ...statistics.map(key => ({ id: key, label: stats[key] })), { id: 'outliers', label: stats.outliers }]}>
                {model.rows.map(row => (
                  <tr key={row.id}>
                    <th scope="row">{row.label}</th>
                    {statistics.map(key => <td key={key}>{format(row[key])}</td>)}
                    <td>{(row.outliers ?? []).map(formatValue).join(', ') || '—'}</td>
                  </tr>
                ))}
              </DataTable>
            )}
          </>
        )}
    </Chart>
  )
}
