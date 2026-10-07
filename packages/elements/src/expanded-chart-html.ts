import { createLumenBoxPlotGeometry, createLumenCalendarHeatmapGeometry, createLumenFunnelGeometry, getLumenChartToneClassName, isLumenBoxPlotDatum, isLumenCalendarHeatmapDatum, isLumenFunnelDatum, type LumenBoxPlotDatum, type LumenBoxPlotStatisticLabels, type LumenCalendarHeatmapDatum, type LumenChartLabels, type LumenFunnelDatum } from '@santi020k/lumen-core'

import { bulletNumberAttribute } from './bullet-chart-html.js'
import { escapeChartHtml as escape } from './chart-html.js'

const parseData = <T>(source: string | null, guard: (value: unknown) => value is T, invalid: T): readonly T[] => {
  try {
    const value: unknown = JSON.parse(source ?? '[]')

    if (Array.isArray(value) && value.every(guard)) return value
  } catch { /* Invalid input fails closed in geometry. */ }

  return [invalid]
}

export const parseCalendarHeatmapData = (source: string | null) => parseData(source, isLumenCalendarHeatmapDatum, { date: '', value: NaN })
export const parseFunnelData = (source: string | null) => parseData(source, isLumenFunnelDatum, { id: '', label: '', value: NaN })
export const parseBoxPlotData = (source: string | null) => parseData(source, isLumenBoxPlotDatum, { id: '', label: '', min: NaN, q1: NaN, median: NaN, q3: NaN, max: NaN })

const domainFor = (element: HTMLElement) => element.hasAttribute('domain-min') || element.hasAttribute('domain-max') ? { min: bulletNumberAttribute(element, 'domain-min'), max: bulletNumberAttribute(element, 'domain-max') } : undefined
const calendarRange = (element: HTMLElement, formatter: (date: string) => string) => `${formatter(element.getAttribute('start-date') ?? '')} – ${formatter(element.getAttribute('end-date') ?? '')}`
const status = (message: string) => `<p class="ui-chart__empty" role="status">${escape(message)}</p>`
const summary = (element: HTMLElement, value: string) => `<p class="ui-sr-only" data-ui-chart-summary>${escape(element.getAttribute('summary') ?? value)}</p>`
const table = (element: HTMLElement, text: Readonly<LumenChartLabels>, headings: readonly string[], rows: readonly (readonly string[])[]) => element.getAttribute('show-table') === 'false' ? '' : `<details class="ui-chart__data"><summary>${escape(text.viewData)}</summary><div role="group" tabindex="0" aria-label="${escape(text.chartData)}"><table><thead><tr>${headings.map(heading => `<th scope="col">${escape(heading)}</th>`).join('')}</tr></thead><tbody>${rows.map(row => `<tr>${row.map((cell, index) => index === 0 ? `<th scope="row">${escape(cell)}</th>` : `<td>${escape(cell)}</td>`).join('')}</tr>`).join('')}</tbody></table></div></details>`

export const calendarHeatmapHtml = (
  element: HTMLElement,
  data: readonly LumenCalendarHeatmapDatum[],
  text: Readonly<LumenChartLabels>,
  formatter: (value: number) => string,
  dateFormatter: (date: string) => string,
  weekdays: readonly string[]
): string => {
  const weekStartsOn = element.hasAttribute('week-starts-on') ? bulletNumberAttribute(element, 'week-starts-on') : 0

  if (weekStartsOn !== 0 && weekStartsOn !== 1) return status(text.invalidData)

  const model = createLumenCalendarHeatmapGeometry(data, { startDate: element.getAttribute('start-date') ?? '', endDate: element.getAttribute('end-date') ?? '', weekStartsOn, domain: domainFor(element) })

  if (!model.valid) return status(text.invalidData)

  const format = (value: number | null) => value === null ? text.notAvailable : formatter(value)
  const available = model.cells.filter(cell => cell.value !== null).length
  const weekdayNames = Array.from({ length: 7 }, (_, day) => `<text class="ui-calendar-heatmap__weekday" x="0" y="${day * 18 + 16}">${escape(weekdays[(day + weekStartsOn) % 7] ?? '')}</text>`).join('')
  const cells = model.cells.map(cell => `<g><rect class="ui-calendar-heatmap__cell ui-chart-tone--series-1"${cell.value === null ? ' data-missing="true"' : ''} x="${cell.week * 18 + 36}" y="${cell.day * 18 + 4}" width="14" height="14" rx="3" style="fill-opacity:${cell.ratio === null ? 1 : 0.15 + cell.ratio * 0.85}"><title>${escape(`${dateFormatter(cell.date)}: ${format(cell.value)}`)}</title></rect>${cell.value === null ? `<text class="ui-calendar-heatmap__missing" x="${cell.week * 18 + 43}" y="${cell.day * 18 + 15}" text-anchor="middle">×</text>` : ''}</g>`).join('')
  const dates = model.cells.filter(cell => cell.day === 0 && cell.week % 4 === 0).map(cell => `<text class="ui-calendar-heatmap__weekday" x="${cell.week * 18 + 36}" y="142">${escape(cell.date.slice(5))}</text>`).join('')

  return summary(element, text.formatHeatmapSummary(available)) + (available === 0 ? status(text.empty) : '') + `<p class="ui-calendar-heatmap__range">${escape(calendarRange(element, dateFormatter))}</p><div class="ui-calendar-heatmap__plot" role="group" tabindex="0" aria-label="${escape(text.chartData)}"><svg aria-hidden="true" width="${model.weekCount * 18 + 36}" height="146" viewBox="0 0 ${model.weekCount * 18 + 36} 146">${weekdayNames}${cells}${dates}</svg></div><div class="ui-calendar-heatmap__legend"><span>${escape(text.low)}: ${escape(formatter(model.domain.min))}</span><span>${escape(text.high)}: ${escape(formatter(model.domain.max))}</span><span class="ui-calendar-heatmap__scale" aria-hidden="true"></span><span>× ${escape(text.notAvailable)}</span></div>` + (element.getAttribute('show-table') === 'false' ? `<ul class="ui-sr-only">${model.cells.map(cell => `<li>${escape(dateFormatter(cell.date))}: ${escape(format(cell.value))}</li>`).join('')}</ul>` : '') + table(element, text, [text.category, text.value], model.cells.map(cell => [dateFormatter(cell.date), format(cell.value)]))
}

export const funnelChartHtml = (
  element: HTMLElement,
  data: readonly LumenFunnelDatum[],
  text: Readonly<LumenChartLabels>,
  formatter: (value: number) => string
): string => {
  const model = createLumenFunnelGeometry(data)

  if (!model.valid || !model.rows.length) return status(model.valid ? text.empty : text.invalidData)

  const format = (value: number | null) => value === null ? text.notAvailable : formatter(value)
  const rows = model.rows.map((row, index) => `<li class="${getLumenChartToneClassName(row.tone, index)}"><div class="ui-funnel-chart__label"><span>${escape(row.label)}</span><strong>${escape(format(row.value))}</strong></div><div class="ui-funnel-chart__track" aria-hidden="true">${row.ratio === null ? '' : `<span class="ui-funnel-chart__bar" style="width:${row.ratio * 100}%"></span>`}</div></li>`).join('')

  return summary(element, model.rows.map(row => `${row.label}: ${format(row.value)}`).join('. ')) + `<ol class="ui-funnel-chart__rows">${rows}</ol>` + table(element, text, [text.category, text.value], model.rows.map(row => [row.label, format(row.value)]))
}

export type BoxPlotStatisticLabels = LumenBoxPlotStatisticLabels

const defaultBoxPlotStatistics: Readonly<BoxPlotStatisticLabels> = { min: 'Lower whisker', q1: 'First quartile', median: 'Median', q3: 'Third quartile', max: 'Upper whisker', outliers: 'Outliers' }

export const boxPlotHtml = (
  element: HTMLElement,
  data: readonly LumenBoxPlotDatum[],
  text: Readonly<LumenChartLabels>,
  formatter: (value: number) => string,
  statisticLabels: Partial<BoxPlotStatisticLabels>
): string => {
  const model = createLumenBoxPlotGeometry(data, { domain: domainFor(element) })

  if (!model.valid || !model.rows.length) return status(model.valid ? text.empty : text.invalidData)

  const stats = { ...defaultBoxPlotStatistics, ...statisticLabels }
  const keys = ['min', 'q1', 'median', 'q3', 'max'] as const
  const format = (value: number | null) => value === null ? text.notAvailable : formatter(value)
  const exactRows = model.rows.map(row => `${row.label}: ${keys.map(key => `${stats[key]}: ${format(row[key])}`).join(', ')}. ${stats.outliers}: ${(row.outliers ?? []).map(formatter).join(', ') || '—'}`)

  const rows = model.rows.map((row, index) => {
    const whisker = row.minPosition !== null && row.maxPosition !== null ? `<span class="ui-box-plot__whisker" style="left:${row.minPosition * 100}%;width:${(row.maxPosition - row.minPosition) * 100}%"></span>` : ''
    const box = row.q1Position !== null && row.q3Position !== null ? `<span class="ui-box-plot__box" style="left:${row.q1Position * 100}%;width:${(row.q3Position - row.q1Position) * 100}%"></span>` : ''
    const median = row.medianPosition === null ? '' : `<span class="ui-box-plot__median" style="left:${row.medianPosition * 100}%"></span>`
    const caps = [row.minPosition, row.maxPosition].map(position => position === null ? '' : `<span class="ui-box-plot__cap" style="left:${position * 100}%"></span>`).join('')
    const outliers = row.outlierPositions.map(position => `<span class="ui-box-plot__outlier" style="left:${position * 100}%"></span>`).join('')

    return `<li class="${getLumenChartToneClassName(row.tone, index)}"><div class="ui-box-plot__label"><span>${escape(row.label)}</span><strong>${escape(stats.median)}: ${escape(format(row.median))}</strong></div><div class="ui-box-plot__track" aria-hidden="true">${whisker}${box}${median}${caps}${outliers}</div></li>`
  }).join('')

  return summary(element, exactRows.join('. ')) + `<ul class="ui-box-plot__rows">${rows}</ul><div class="ui-bullet-chart__ticks" aria-hidden="true">${model.ticks.map(tick => `<span>${escape(formatter(tick))}</span>`).join('')}</div>` + (element.getAttribute('show-table') === 'false' ? `<ul class="ui-sr-only">${exactRows.map(row => `<li>${escape(row)}</li>`).join('')}</ul>` : '') + table(element, text, [text.category, ...keys.map(key => stats[key]), stats.outliers], model.rows.map(row => [row.label, ...keys.map(key => format(row[key])), (row.outliers ?? []).map(formatter).join(', ') || '—']))
}
