import {
  type createLumenHistogramGeometry,
  type createLumenLineChartModel,
  type createLumenWaterfallGeometry,
  formatLumenChartSummary,
  getLumenChartCategoryLabel,
  getLumenChartToneClassName,
  type LumenChartAnnotation,
  type LumenChartLabels,
  type LumenChartSeries,
  lumenChartTones,  type LumenHistogramBin,
  type LumenWaterfallDatum } from '@santi020k/lumen-core'

export const escapeChartHtml = (value: number | string): string => String(value)
  .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;').replaceAll('\'', '&#39;')

const jsonArray = (value: string | null): unknown[] | null => {
  try {
    const parsed: unknown = JSON.parse(value ?? '[]')

    return Array.isArray(parsed) ? parsed : null
  } catch {
    return null
  }
}

const chartRecord = (entry: unknown): Record<string, unknown> => entry !== null && typeof entry === 'object' ? { ...entry } : {}

export const parseHistogramBins = (value: string | null): LumenHistogramBin[] => {
  const entries = jsonArray(value)
  const result: LumenHistogramBin[] = []

  for (const raw of entries ?? [null]) {
    const entry = chartRecord(raw)

    if (typeof entry.start !== 'number' || typeof entry.end !== 'number' || typeof entry.count !== 'number') {
      return [{ start: NaN, end: NaN, count: NaN }]
    }

    result.push({ start: entry.start,
      end: entry.end,
      count: entry.count,
      ...(typeof entry.label === 'string' ? { label: entry.label } : {}) })
  }

  return result
}

const chartTone = (value: unknown) => lumenChartTones.find(tone => tone === value)

export const parseWaterfallData = (value: string | null): LumenWaterfallDatum[] => {
  const entries = jsonArray(value)
  const result: LumenWaterfallDatum[] = []

  for (const raw of entries ?? [null]) {
    const entry = chartRecord(raw)

    if (typeof entry.id !== 'string' || typeof entry.label !== 'string' || typeof entry.value !== 'number' ||
      !new Set<unknown>([undefined, 'delta', 'total']).has(entry.kind)) return [{ id: 'invalid', label: '', value: NaN }]

    const tone = chartTone(entry.tone)
    const kind = entry.kind === 'total' ? 'total' : 'delta'

    result.push({ id: entry.id, label: entry.label, value: entry.value, kind, ...(tone ? { tone } : {}) })
  }

  return result
}

export const parseChartAnnotations = (value: string | null): LumenChartAnnotation[] => {
  const result: LumenChartAnnotation[] = []

  for (const raw of jsonArray(value) ?? []) {
    const entry = chartRecord(raw)

    if (typeof entry.id !== 'string' || typeof entry.label !== 'string' ||
      (typeof entry.value !== 'number' && typeof entry.value !== 'string')) continue

    const axis = entry.axis === 'x' ? 'x' : 'y'
    const tone = chartTone(entry.tone)

    result.push({ id: entry.id, label: entry.label, value: entry.value, axis, ...(tone ? { tone } : {}) })
  }

  return result
}

export const chartNumberAttribute = (element: HTMLElement, name: string): number | undefined => {
  const value = element.getAttribute(name)

  return value !== null && value.trim() !== '' && Number.isFinite(Number(value)) ? Number(value) : undefined
}

export const chartDomainAttributes = (element: HTMLElement, minName = 'domain-min', maxName = 'domain-max') => {
  const min = chartNumberAttribute(element, minName)
  const max = chartNumberAttribute(element, maxName)

  return { ...(min === undefined ? {} : { min }), ...(max === undefined ? {} : { max }) }
}

export const chartInspectionHtml = (
  model: ReturnType<typeof createLumenLineChartModel>, labels: Readonly<LumenChartLabels>,
  formatValue: (value: number) => string, formatCategory?: (value: number | string) => string
): string => {
  const lookup = model.series.map(series => new Map(series.data.map(datum => [datum.x, datum])))

  const points = model.categories.map((category, index) => {
    const values = model.series.map((series, seriesIndex) => {
      const value = lookup[seriesIndex]?.get(category)?.y

      const label = value === null || value === undefined || !Number.isFinite(value) ?
        labels.notAvailable :
        formatValue(value)

      return `<span class="${getLumenChartToneClassName(series.tone, seriesIndex)}" data-ui-chart-series-value="${escapeChartHtml(series.id)}"><i aria-hidden="true"></i>${escapeChartHtml(series.label)} <b>${escapeChartHtml(label)}</b></span>`
    }).join('')

    return `<div hidden data-ui-chart-point="${escapeChartHtml(JSON.stringify(category))}" data-ui-chart-position="${model.positions[index] ?? model.paddingLeft}"><strong>${escapeChartHtml(getLumenChartCategoryLabel(model.series, category, formatCategory, 'detail'))}</strong>${values}</div>`
  }).join('')

  return `<div class="ui-chart__inspection" data-ui-chart-inspection hidden>${points}</div><p class="ui-sr-only" aria-live="polite" aria-atomic="true" data-ui-chart-announcement></p>`
}

export const chartAnnotationHtml = (
  model: ReturnType<typeof createLumenLineChartModel>
): string => model.annotationMarks.map(mark => {
  const line = mark.axis === 'x' ?
    `<line x1="${mark.coordinate}" x2="${mark.coordinate}" y1="${model.padding}" y2="${model.height - model.padding}"></line><text x="${mark.coordinate + 4}" y="${model.padding - 8}">${escapeChartHtml(mark.label)}</text>` :
    `<line x1="${model.paddingLeft}" x2="${model.width - model.padding}" y1="${mark.coordinate}" y2="${mark.coordinate}"></line><text text-anchor="end" x="${model.width - model.padding}" y="${mark.coordinate - 8}">${escapeChartHtml(mark.label)}</text>`

  return `<g class="ui-chart__annotation ${getLumenChartToneClassName(mark.tone)}">${line}</g>`
}).join('')

export const interactiveChartLegendHtml = (series: readonly LumenChartSeries[], labels: Readonly<LumenChartLabels>): string => `<ul class="ui-chart__legend" aria-label="${escapeChartHtml(labels.chartLegend)}">${series.map((item, index) => `<li class="${getLumenChartToneClassName(item.tone, index)}"><button type="button" class="ui-button ui-button--ghost ui-button--sm" aria-pressed="true" data-ui-chart-toggle="${escapeChartHtml(item.id)}">${escapeChartHtml(item.label)}</button></li>`).join('')}</ul>`

export const intervalChartHtml = (
  model: ReturnType<typeof createLumenWaterfallGeometry> | ReturnType<typeof createLumenHistogramGeometry>,
  labels: Readonly<LumenChartLabels>, formatValue: (value: number) => string,
  formatBoundary: (value: number) => string, valueLabel: string,
  showTable: boolean, summaryOverride: string | null = null
): string => {
  if (model.marks.length === 0) return `<p class="ui-chart__empty" role="status">${escapeChartHtml(model.valid ? labels.empty : labels.invalidData)}</p>`

  const grid = model.ticks.map(tick => `<line x1="${model.left}" x2="${model.right}" y1="${model.y(tick)}" y2="${model.y(tick)}"></line><text x="${model.left - 8}" y="${model.y(tick)}">${escapeChartHtml(formatValue(tick))}</text>`).join('')
  const axis = model.categoryTicks.map(tick => `<text text-anchor="${tick.textAnchor}" x="${tick.position}" y="${model.height - 16}">${escapeChartHtml(tick.label)}</text>`).join('')
  const connectors = 'connectors' in model ? model.connectors.map(line => `<line class="ui-waterfall-chart__connector" x1="${line.x1}" x2="${line.x2}" y1="${line.y}" y2="${line.y}"></line>`).join('') : ''
  const marks = model.marks.map(mark => `<rect class="${getLumenChartToneClassName(mark.tone)}" x="${mark.x}" y="${mark.y}" width="${mark.width}" height="${mark.height}"><title>${escapeChartHtml(mark.label)}: ${escapeChartHtml(formatValue(mark.value))}</title></rect>`).join('')
  const rows = model.marks.map((mark, index) => `<tr><th scope="row">${escapeChartHtml(mark.label)}</th><td>${escapeChartHtml(formatBoundary(mark.start))}</td><td>${escapeChartHtml(formatBoundary(mark.end))}</td><td>${escapeChartHtml(formatValue(mark.value))}</td>${'bins' in model && model.frequency === 'density' ? `<td>${model.bins[index]?.count ?? 0}</td>` : ''}</tr>`).join('')
  const table = showTable ? `<details class="ui-chart__data"><summary>${escapeChartHtml(labels.viewData)}</summary><div role="group" tabindex="0" aria-label="${escapeChartHtml(labels.chartData)}"><table><thead><tr><th scope="col">${escapeChartHtml(labels.category)}</th><th scope="col">${escapeChartHtml(labels.start)}</th><th scope="col">${escapeChartHtml(labels.end)}</th><th scope="col">${escapeChartHtml(valueLabel)}</th>${'bins' in model && model.frequency === 'density' ? `<th scope="col">${escapeChartHtml(labels.count)}</th>` : ''}</tr></thead><tbody>${rows}</tbody></table></div></details>` : ''
  const summary = summaryOverride ?? formatLumenChartSummary([{ id: 'values', label: valueLabel, data: model.marks.map(mark => ({ x: mark.key, y: mark.value })) }], formatValue, labels)

  return `<p class="ui-sr-only" data-ui-chart-summary>${escapeChartHtml(summary)}</p><p class="ui-chart__axis-title">${escapeChartHtml(valueLabel)}</p><div class="ui-chart__plot" role="region" tabindex="0" aria-label="${escapeChartHtml(labels.chartData)}"><svg aria-hidden="true" viewBox="0 0 ${model.width} ${model.height}"><g class="ui-chart__grid">${grid}</g><g class="ui-chart__axis-labels">${axis}</g>${connectors}<g class="ui-bar-chart__marks">${marks}</g></svg></div>${table}`
}
