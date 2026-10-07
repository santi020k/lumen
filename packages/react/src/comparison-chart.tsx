'use client'

import { composeClassName, createLumenComparisonGeometry, getLumenChartToneClassName, type LumenChartLabels, type LumenComparisonDatum, type LumenComparisonOptions, resolveLumenChartLabels } from '@santi020k/lumen-core'

import { Chart, type ChartProps } from './components.js'

export interface ComparisonChartProps extends Omit<ChartProps, 'children'>, Omit<LumenComparisonOptions, 'paired'> {
  data: readonly LumenComparisonDatum[]
  formatValue?: (value: number) => string
  labels?: Partial<LumenChartLabels>
  referenceLabel?: string
  valueLabel?: string
  showTable?: boolean
}

type ResolvedComparisonProps = ComparisonChartProps & Required<Pick<ComparisonChartProps, 'formatValue' | 'referenceLabel' | 'showTable'>>

const resolveComparisonProps = (props: ComparisonChartProps): ResolvedComparisonProps => ({
  ...props, formatValue: props.formatValue ?? String, referenceLabel: props.referenceLabel ?? 'Before', showTable: props.showTable ?? true
})

const ComparisonChart = ({
  data, domain, paired, formatValue, labels, referenceLabel, valueLabel, showTable, ...props
}: ResolvedComparisonProps & { paired: boolean }) => {
  const text = resolveLumenChartLabels(labels)
  const title = valueLabel ?? text.value
  const model = createLumenComparisonGeometry(data, { domain, paired })
  const format = (value: number | null) => value === null ? text.notAvailable : formatValue(value)

  return (
    <Chart {...props}>
      {!model.valid || model.rows.length === 0 ?
        <p className="ui-chart__empty" role="status">{model.valid ? text.empty : text.invalidData}</p> :
        (
          <>
            <div className="ui-comparison-chart__legend">
              <span>{text.category}</span>
              <span>{paired ? `${referenceLabel} → ${title}` : title}</span>
            </div>
            <ul className="ui-comparison-chart__rows">
              {model.rows.map((row, index) => (
                <li key={row.id} className={getLumenChartToneClassName(row.tone, index)}>
                  <div className="ui-comparison-chart__label">
                    <span>{row.label}</span>
                    <span>
                      {paired && (
                        <>
                          {format(row.reference)}
                          {' '}
                          <span aria-hidden="true">→</span>
                          {' '}
                        </>
                      )}
                      <strong>{format(row.value)}</strong>
                    </span>
                  </div>
                  <div className="ui-comparison-chart__track" aria-hidden="true">
                    {row.valuePosition !== null && row.referencePosition !== null && (
                      <span
                        className="ui-comparison-chart__connector"
                        style={{ left: `${row.start * 100}%`, width: `${row.width * 100}%` }}
                      />
                    )}
                    {paired && row.referencePosition !== null && (
                      <span
                        className="ui-comparison-chart__reference"
                        style={{ left: `${row.referencePosition * 100}%` }}
                      />
                    )}
                    {row.valuePosition !== null && (
                      <span
                        className="ui-comparison-chart__dot"
                        style={{ left: `${row.valuePosition * 100}%` }}
                      />
                    )}
                  </div>
                </li>
              ))}
            </ul>
            <div className="ui-bullet-chart__ticks" aria-hidden="true">{model.ticks.map(tick => <span key={tick}>{formatValue(tick)}</span>)}</div>
            {showTable && (
              <details className="ui-chart__data">
                <summary>{text.viewData}</summary>
                <div role="group" tabIndex={0} aria-label={text.chartData}>
                  <table>
                    <thead>
                      <tr>
                        <th scope="col">{text.category}</th>
                        {paired && <th scope="col">{referenceLabel}</th>}
                        <th scope="col">{title}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {model.rows.map(row => (
                        <tr key={row.id}>
                          <th scope="row">{row.label}</th>
                          {paired && <td>{format(row.reference)}</td>}
                          <td>{format(row.value)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </details>
            )}
          </>
        )}
    </Chart>
  )
}

export const LollipopChart = (props: ComparisonChartProps) => <ComparisonChart {...resolveComparisonProps(props)} paired={false} className={composeClassName('ui-comparison-chart', 'ui-lollipop-chart', props.className)} />
export const DumbbellChart = (props: ComparisonChartProps) => <ComparisonChart {...resolveComparisonProps(props)} paired className={composeClassName('ui-comparison-chart', 'ui-dumbbell-chart', props.className)} />
