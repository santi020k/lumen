import { createLumenComparisonGeometry, formatLumenChartSummary, getLumenChartToneClassName, isLumenComparisonDatum, type LumenChartLabels, type LumenComparisonDatum } from '@santi020k/lumen-core'

import { bulletNumberAttribute } from './bullet-chart-html.js'
import { escapeChartHtml } from './chart-html.js'

export const parseComparisonData = (source: string | null): readonly LumenComparisonDatum[] => {
  try {
    const parsed: unknown = JSON.parse(source ?? '[]')

    if (Array.isArray(parsed) && parsed.every(isLumenComparisonDatum)) return parsed
  } catch { /* Invalid source is rendered as an invalid dataset. */ }

  return [{ id: '', label: '', value: NaN }]
}

const comparisonLabel = (
  element: HTMLElement, attribute: string, fallback: string
): string => element.getAttribute(attribute) ?? fallback

const comparisonSummary = (
  element: HTMLElement, rows: ReturnType<typeof createLumenComparisonGeometry>['rows'], paired: boolean,
  text: Readonly<LumenChartLabels>, formatter: (value: number) => string
): string => escapeChartHtml(element.getAttribute('summary') ?? formatLumenChartSummary([
  { id: 'values', label: comparisonLabel(element, 'value-label', text.value), data: rows.map(row => ({ x: row.label, y: row.value })) },
  ...(paired ? [{ id: 'reference', label: comparisonLabel(element, 'reference-label', 'Before'), data: rows.map(row => ({ x: row.label, y: row.reference })) }] : [])
], formatter, text))

export const comparisonChartHtml = (
  element: HTMLElement, data: readonly LumenComparisonDatum[], paired: boolean,
  text: Readonly<LumenChartLabels>, formatter: (value: number) => string
): string => {
  const domain = element.hasAttribute('domain-min') || element.hasAttribute('domain-max') ? { min: bulletNumberAttribute(element, 'domain-min'), max: bulletNumberAttribute(element, 'domain-max') } : undefined
  const model = createLumenComparisonGeometry(data, { domain, paired })

  if (!model.valid || !model.rows.length) return `<p class="ui-chart__empty" role="status">${escapeChartHtml(model.valid ? text.empty : text.invalidData)}</p>`

  const format = (value: number | null) => escapeChartHtml(value === null ? text.notAvailable : formatter(value))
  const before = escapeChartHtml(comparisonLabel(element, 'reference-label', 'Before'))
  const title = escapeChartHtml(comparisonLabel(element, 'value-label', text.value))
  const summary = comparisonSummary(element, model.rows, paired, text, formatter)

  const rows = model.rows.map((row, index) => {
    const connector = row.valuePosition !== null && row.referencePosition !== null ? `<span class="ui-comparison-chart__connector" style="left:${row.start * 100}%;width:${row.width * 100}%"></span>` : ''
    const reference = paired && row.referencePosition !== null ? `<span class="ui-comparison-chart__reference" style="left:${row.referencePosition * 100}%"></span>` : ''
    const dot = row.valuePosition !== null ? `<span class="ui-comparison-chart__dot" style="left:${row.valuePosition * 100}%"></span>` : ''

    return `<li class="${getLumenChartToneClassName(row.tone, index)}"><div class="ui-comparison-chart__label"><span>${escapeChartHtml(row.label)}</span><span>${paired ? `${format(row.reference)} <span aria-hidden="true">→</span> ` : ''}<strong>${format(row.value)}</strong></span></div><div class="ui-comparison-chart__track" aria-hidden="true">${connector}${reference}${dot}</div></li>`
  }).join('')

  const tableRows = model.rows.map(row => `<tr><th scope="row">${escapeChartHtml(row.label)}</th>${paired ? `<td>${format(row.reference)}</td>` : ''}<td>${format(row.value)}</td></tr>`).join('')
  const table = element.getAttribute('show-table') === 'false' ? '' : `<details class="ui-chart__data"><summary>${escapeChartHtml(text.viewData)}</summary><div role="group" tabindex="0" aria-label="${escapeChartHtml(text.chartData)}"><table><thead><tr><th scope="col">${escapeChartHtml(text.category)}</th>${paired ? `<th scope="col">${before}</th>` : ''}<th scope="col">${title}</th></tr></thead><tbody>${tableRows}</tbody></table></div></details>`

  return `<p class="ui-sr-only" data-ui-chart-summary>${summary}</p><div class="ui-comparison-chart__legend"><span>${escapeChartHtml(text.category)}</span><span>${paired ? `${before} → ` : ''}${title}</span></div><ul class="ui-comparison-chart__rows">${rows}</ul><div class="ui-bullet-chart__ticks" aria-hidden="true">${model.ticks.map(tick => `<span>${format(tick)}</span>`).join('')}</div>${table}`
}
