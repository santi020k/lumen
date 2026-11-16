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

const variants = { positive: 'success', negative: 'destructive', neutral: 'outline' } as const

const node = (tag: string, text?: string, attributes: Record<string, string> = {}): HTMLElement => {
  const element = document.createElement(tag)

  if (text !== undefined) element.textContent = text

  for (const [name, value] of Object.entries(attributes)) element.setAttribute(name, value)

  return element
}

const appendData = (card: HTMLElement, stat: HTMLElement, { label, snapshot, locale, prefix, suffix, decimals, trendLabel = `${label} trend` }: MetricCardOptions): void => {
  if (snapshot.state !== 'ready' && snapshot.state !== 'stale') return

  const value = node('lumen-animated-number', undefined, { class: 'lumen-metric-card__value', value: String(snapshot.value) })

  for (const [name, option] of Object.entries({ locale, prefix, suffix, decimals })) {
    if (option !== undefined) value.setAttribute(name, String(option))
  }

  stat.append(value)

  const trend = node('div', undefined, { class: 'lumen-metric-card__trend' })

  trend.append(node('lumen-badge', snapshot.change, { variant: variants[snapshot.trend] }), node('span', snapshot.comparison, { class: 'lumen-metric-card__note' }))

  const chart = node('lumen-sparkline', undefined, { class: 'lumen-metric-card__chart', values: snapshot.values.join(','), label: trendLabel, tone: snapshot.trend === 'negative' ? 'danger' : 'brand' })

  card.append(trend, chart, node('p', snapshot.updatedAt, { class: 'lumen-metric-card__note' }))
}

const metricStatus = ({ snapshot, loadingLabel = 'Loading metric', staleLabel = 'Out of date' }: MetricCardOptions): string => {
  if (snapshot.state === 'loading') return loadingLabel

  if (snapshot.state === 'error') return snapshot.message

  if (snapshot.state === 'stale') return staleLabel

  return ''
}

/** Register Lumen Elements once in the host. Render again when application data changes. */
export const renderMetricCard = (root: HTMLElement, options: MetricCardOptions, onRetry?: () => void): void => {
  const { label, snapshot, retryLabel = 'Try again' } = options
  const card = node('lumen-card', undefined, { class: 'lumen-metric-card', 'data-state': snapshot.state, 'aria-busy': String(snapshot.state === 'loading') })
  const stat = node('lumen-stat', undefined, { variant: 'bare' })

  stat.append(node('lumen-stat-label', label))

  card.append(stat)

  if (snapshot.state === 'loading') stat.append(node('lumen-skeleton', undefined, { height: '3rem', width: '70%' }))

  appendData(card, stat, options)

  card.append(node('p', metricStatus(options), { class: 'lumen-metric-card__status', role: 'status' }))

  if (snapshot.state === 'error' && onRetry) {
    const retry = node('lumen-button', retryLabel, { variant: 'outline' })

    retry.addEventListener('click', onRetry)

    card.append(retry)
  }

  root.replaceChildren(card)
}
