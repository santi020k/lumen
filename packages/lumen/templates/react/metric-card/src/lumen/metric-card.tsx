'use client'

import { AnimatedNumber, Badge, Button, Card, Skeleton, Sparkline, Stack, Stat } from '@santi020k/lumen-react'

export type MetricSnapshot =
  | { state: 'loading' } |
  { state: 'error', message: string } |
  { state: 'ready' | 'stale', value: number, values: readonly number[], change: string, comparison: string, trend: 'positive' | 'negative' | 'neutral', updatedAt: string }

export interface MetricCardOptions {
  label: string
  snapshot: MetricSnapshot
  locale?: string
  prefix?: string
  suffix?: string
  decimals?: number
  loadingLabel?: string
  staleLabel?: string
  retryLabel?: string
  trendLabel?: string
}

export interface MetricCardRecipeProps extends MetricCardOptions { onRetry?: () => void }

const variants = { positive: 'success', negative: 'destructive', neutral: 'outline' } as const

const MetricValue = ({ snapshot, locale, prefix, suffix, decimals }: MetricCardOptions) => {
  if (snapshot.state === 'loading') return <Skeleton height="3rem" width="70%" />

  if (snapshot.state === 'error') return null

  return (
    <AnimatedNumber
      className="lumen-metric-card__value"
      value={snapshot.value}
      {...(locale === undefined ? {} : { locale })}
      {...(prefix === undefined ? {} : { prefix })}
      {...(suffix === undefined ? {} : { suffix })}
      {...(decimals === undefined ? {} : { decimals })}
    />
  )
}

const MetricData = ({ label, snapshot, trendLabel = `${label} trend` }: MetricCardOptions) => {
  if (snapshot.state !== 'ready' && snapshot.state !== 'stale') return null

  return (
    <>
      <div className="lumen-metric-card__trend">
        <Badge variant={variants[snapshot.trend]}>{snapshot.change}</Badge>
        <span className="lumen-metric-card__note">
          {snapshot.comparison}
        </span>
      </div>
      <Sparkline className="lumen-metric-card__chart" values={snapshot.values} label={trendLabel} tone={snapshot.trend === 'negative' ? 'danger' : 'brand'} />
      <p className="lumen-metric-card__note">{snapshot.updatedAt}</p>
    </>
  )
}

const metricStatus = ({ snapshot, loadingLabel = 'Loading metric', staleLabel = 'Out of date' }: MetricCardOptions): string => {
  if (snapshot.state === 'loading') return loadingLabel

  if (snapshot.state === 'error') return snapshot.message

  if (snapshot.state === 'stale') return staleLabel

  return ''
}

export const MetricCardRecipe = (props: MetricCardRecipeProps) => (
  <Card className="lumen-metric-card" data-state={props.snapshot.state} aria-busy={props.snapshot.state === 'loading'}>
    <Stat label={props.label} variant="bare"><MetricValue {...props} /></Stat>
    <MetricData {...props} />
    <p className="lumen-metric-card__status" role="status">{metricStatus(props)}</p>
    {props.snapshot.state === 'error' && props.onRetry ? <Stack direction="horizontal"><Button variant="outline" onClick={props.onRetry}>{props.retryLabel ?? 'Try again'}</Button></Stack> : null}
  </Card>
)
