'use client'

import {
  composeClassName,
  createLumenBulletGeometry,
  getLumenChartToneClassName,
  type LumenBulletOptions,
  type LumenChartLabels,
  type LumenChartTone,
  resolveLumenChartLabels
} from '@santi020k/lumen-core'

import { Chart, type ChartProps } from './components.js'

export interface BulletChartProps extends Omit<ChartProps, 'children' | 'value'>, LumenBulletOptions {
  formatValue?: (value: number) => string
  labels?: Partial<LumenChartLabels>
  showTable?: boolean
  target: number
  targetLabel?: string
  tone?: LumenChartTone
  value: number | null
  valueLabel?: string
}

type ResolvedBulletProps = BulletChartProps & Required<Pick<BulletChartProps,
  'formatValue' | 'showTable' | 'targetLabel' | 'tone'>>

const resolveBulletProps = (props: BulletChartProps): ResolvedBulletProps => ({
  ...props,
  formatValue: props.formatValue ?? String,
  showTable: props.showTable ?? true,
  targetLabel: props.targetLabel ?? 'Target',
  tone: props.tone ?? 'series-1'
})

const BulletContent = ({
  className, domain, formatValue, labels, ranges, showTable, summary,
  target, targetLabel, tone, value, valueLabel, ...props
}: ResolvedBulletProps) => {
  const text = resolveLumenChartLabels(labels)
  const model = createLumenBulletGeometry(value, target, { domain, ranges })
  const title = valueLabel ?? text.value
  const actual = value === null ? text.notAvailable : formatValue(value)
  const factual = model.valid ? `${title}: ${actual}. ${targetLabel}: ${formatValue(target)}.` : text.invalidData

  return (
    <Chart {...props} className={className} summary={summary ?? factual}>
      {model.valid ?
        (
          <>
            <div className="ui-bullet-chart__values">
              <div>
                <span>{title}</span>
                <strong>{actual}</strong>
              </div>
              <p>
                <span className="ui-bullet-chart__target-key" aria-hidden="true" />
                {targetLabel}
                <strong>{formatValue(target)}</strong>
              </p>
            </div>
            <div aria-hidden="true" className="ui-bullet-chart__plot">
              <div className="ui-bullet-chart__track">
                {model.ranges.map((range, index) => (
                  <span key={range.end} className={composeClassName('ui-bullet-chart__range', getLumenChartToneClassName(range.tone ?? 'neutral'))} style={{ left: `${range.startRatio * 100}%`, width: `${(range.endRatio - range.startRatio) * 100}%`, opacity: 0.08 + index / Math.max(1, model.ranges.length - 1) * 0.14 }} />
                ))}
                {value !== null && <span className={composeClassName('ui-bullet-chart__bar', getLumenChartToneClassName(tone))} style={{ left: `${model.valueStartRatio * 100}%`, width: `${model.valueWidthRatio * 100}%` }} />}
                <span className="ui-bullet-chart__target" style={{ left: `${model.targetRatio * 100}%` }} />
              </div>
              <div className="ui-bullet-chart__ticks">{model.ticks.map(tick => <span key={tick.position}>{formatValue(tick.value)}</span>)}</div>
            </div>
            {model.ranges.length > 0 && (
              <ul className="ui-bullet-chart__ranges">
                {model.ranges.map(range => (
                  <li className={getLumenChartToneClassName(range.tone ?? 'neutral')} key={range.end}>
                    <span>{range.label}</span>
                    <span>
                      {formatValue(range.start)}
                      –
                      {formatValue(range.end)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            {showTable && (
              <details className="ui-chart__data">
                <summary>{text.viewData}</summary>
                <div role="group" tabIndex={0} aria-label={text.chartData}>
                  <table>
                    <thead>
                      <tr>
                        <th scope="col">{text.category}</th>
                        <th scope="col">{text.value}</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <th scope="row">{title}</th>
                        <td>{actual}</td>
                      </tr>
                      <tr>
                        <th scope="row">{targetLabel}</th>
                        <td>{formatValue(target)}</td>
                      </tr>
                      {model.ranges.map(range => (
                        <tr key={range.end}>
                          <th scope="row">{range.label}</th>
                          <td>
                            {formatValue(range.start)}
                            –
                            {formatValue(range.end)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </details>
            )}
          </>
        ) :
        <p className="ui-chart__empty" role="status">{text.invalidData}</p>}
    </Chart>
  )
}

export const BulletChart = (props: BulletChartProps) => (
  <BulletContent {...resolveBulletProps(props)} className={composeClassName('ui-bullet-chart', props.className)} />
)
