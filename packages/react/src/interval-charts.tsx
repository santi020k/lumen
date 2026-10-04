'use client'

import { Fragment, type ReactNode } from 'react'

import {
  composeClassName,
  createLumenHistogramGeometry,
  createLumenWaterfallGeometry,
  formatLumenChartSummary,
  getLumenChartToneClassName,
  type LumenChartLabels,
  type LumenChartTone,
  type LumenHistogramBin,
  type LumenWaterfallDatum,
  resolveLumenChartLabels
} from '@santi020k/lumen-core'

import { getChartPlotLabel } from './chart-label.js'
import { Chart, type ChartProps } from './components.js'

interface IntervalChartProps extends Omit<ChartProps, 'children'> {
  formatValue?: (value: number) => string
  labels?: Partial<LumenChartLabels>
  showTable?: boolean
  valueLabel?: string
}

interface IntervalPlotProps extends IntervalChartProps {
  formatBoundary: (value: number) => string
  model: ReturnType<typeof createLumenWaterfallGeometry> | ReturnType<typeof createLumenHistogramGeometry>
}

const isDensityModel = (
  model: IntervalPlotProps['model']
): model is ReturnType<typeof createLumenHistogramGeometry> => 'bins' in model && model.frequency === 'density'

const intervalRows = (
  model: IntervalPlotProps['model'], formatValue: (value: number) => string, formatBoundary: (value: number) => string
) => model.marks.map((mark, index) => (
  <tr key={mark.key}>
    <th scope="row">{mark.label}</th>
    <td>{formatBoundary(mark.start)}</td>
    <td>{formatBoundary(mark.end)}</td>
    <td>{formatValue(mark.value)}</td>
    {isDensityModel(model) && <td>{model.bins[index]?.count}</td>}
  </tr>
))

const intervalSummary = (
  valid: boolean, summary: ReactNode, factual: string, invalid: string
): ReactNode => summary ?? (valid ? factual : invalid)

const intervalValueLabel = (label: string | undefined, fallback: string): string => label ?? fallback

const IntervalPlot = ({
  formatBoundary, formatValue = String, labels, model, showTable = true, summary, valueLabel, ...props
}: IntervalPlotProps) => {
  const text = resolveLumenChartLabels(labels)
  const label = intervalValueLabel(valueLabel, text.value)
  const data = model.marks.map(mark => ({ x: mark.key, xLabel: mark.label, y: mark.value }))
  const factualSummary = formatLumenChartSummary([{ id: 'values', label, data }], formatValue, text)
  const hasData = model.marks.length > 0
  const rows = intervalRows(model, formatValue, formatBoundary)

  return (
    <Chart {...props} summary={intervalSummary(model.valid, summary, factualSummary, text.invalidData)}>
      {!hasData && <p className="ui-chart__empty" role="status">{model.valid ? text.empty : text.invalidData}</p>}
      {hasData && (
        <>
          <p className="ui-chart__axis-title">{label}</p>
          <div className="ui-chart__plot" role="region" tabIndex={0} aria-label={getChartPlotLabel(props['aria-label'], props.heading, text.chartData)}>
            <svg aria-hidden="true" viewBox={`0 0 ${model.width} ${model.height}`}>
              <g className="ui-chart__grid">
                {model.ticks.map(tick => (
                  <Fragment key={tick}>
                    <line x1={model.left} x2={model.right} y1={model.y(tick)} y2={model.y(tick)} />
                    <text x={model.left - 8} y={model.y(tick)}>{formatValue(tick)}</text>
                  </Fragment>
                ))}
              </g>
              <g className="ui-chart__axis-labels">{model.categoryTicks.map(tick => <text key={tick.index} textAnchor={tick.textAnchor} x={tick.position} y={model.height - 16}>{tick.label}</text>)}</g>
              {'connectors' in model && model.connectors.map(connector => (
                <line
                  key={connector.x1}
                  className="ui-waterfall-chart__connector"
                  x1={connector.x1}
                  x2={connector.x2}
                  y1={connector.y}
                  y2={connector.y}
                />
              ))}
              <g className="ui-bar-chart__marks">
                {model.marks.map(mark => (
                  <rect
                    key={mark.key}
                    className={getLumenChartToneClassName(mark.tone)}
                    x={mark.x}
                    y={mark.y}
                    width={mark.width}
                    height={mark.height}
                  >
                    <title>
                      {mark.label}
                      :
                      {' '}
                      {formatValue(mark.value)}
                    </title>
                  </rect>
                ))}
              </g>
            </svg>
          </div>
        </>
      )}
      {showTable && hasData && (
        <details className="ui-chart__data">
          <summary>{text.viewData}</summary>
          <div aria-label={text.chartData} role="group" tabIndex={0}>
            <table>
              <thead>
                <tr>
                  <th scope="col">{text.category}</th>
                  <th scope="col">{text.start}</th>
                  <th scope="col">{text.end}</th>
                  <th scope="col">{label}</th>
                  {isDensityModel(model) && <th scope="col">{text.count}</th>}
                </tr>
              </thead>
              <tbody>
                {rows}
              </tbody>
            </table>
          </div>
        </details>
      )}
    </Chart>
  )
}

const emptyWaterfallData: readonly LumenWaterfallDatum[] = []
const emptyHistogramBins: readonly LumenHistogramBin[] = []

export interface WaterfallChartProps extends IntervalChartProps {
  data?: readonly LumenWaterfallDatum[]
}

export const WaterfallChart = ({ className, data = emptyWaterfallData, formatValue = String, ...props }: WaterfallChartProps) => <IntervalPlot {...props} className={composeClassName('ui-waterfall-chart', className)} model={createLumenWaterfallGeometry(data, { formatValue })} formatValue={formatValue} formatBoundary={formatValue} />

export interface HistogramProps extends IntervalChartProps {
  bins?: readonly LumenHistogramBin[]
  formatBoundary?: (value: number) => string
  frequency?: 'count' | 'density'
  tone?: LumenChartTone
}

export const Histogram = ({ bins = emptyHistogramBins, className, formatBoundary = String, formatValue = String, frequency = 'count', labels, tone = 'series-1', valueLabel, ...props }: HistogramProps) => <IntervalPlot {...props} {...(labels ? { labels } : {})} className={composeClassName('ui-histogram', className)} model={createLumenHistogramGeometry(bins, { formatBoundary, formatValue, frequency, tone })} formatBoundary={formatBoundary} formatValue={formatValue} valueLabel={valueLabel ?? resolveLumenChartLabels(labels)[frequency === 'density' ? 'density' : 'count']} />
