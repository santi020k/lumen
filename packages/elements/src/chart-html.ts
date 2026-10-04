import {
  alignLumenChartSeries,
  type createLumenHistogramGeometry,
  type createLumenLineChartModel,
  createLumenScatterReferences,
  type createLumenWaterfallGeometry,
  formatLumenChartSummary,
  getLumenChartCategoryLabel,
  getLumenChartToneClassName,
  type LumenChartAnnotation,
  type LumenChartLabels,
  type LumenChartSeries,
  lumenChartTones,    type LumenHeatmapDatum,
  type LumenHistogramBin,
  type LumenRangeDatum,
  type LumenScatterGeometry,
  type LumenScatterGeometryPoint,
  type LumenScatterReference,
  type LumenScatterScaleType,
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

export const scatterPlotHtml = (
  geometry: LumenScatterGeometry, referenceItems: readonly LumenScatterReference[], xScale: LumenScatterScaleType,
  plotId: string, formatX: (value: number | string) => string,
  formatY: (value: number) => string, labels: LumenChartLabels, datumMarks?: string
): string => {
  const referenceGeometry = createLumenScatterReferences(referenceItems, geometry, xScale)

  const references = referenceGeometry.map(reference => reference.region ?
    `<rect x="${Math.min(reference.x1, reference.x2)}" y="${Math.min(reference.y1, reference.y2)}" width="${Math.abs(reference.x2 - reference.x1)}" height="${Math.abs(reference.y2 - reference.y1)}"><title>${escapeChartHtml(reference.label)}</title></rect>` :
    `<line x1="${reference.x1}" x2="${reference.x2}" y1="${reference.y1}" y2="${reference.y2}"><title>${escapeChartHtml(reference.label)}</title></line>`).join('')

  const marks = datumMarks ?? geometry.points.map(point => [
    `<circle class="ui-chart-tone--${point.tone}" cx="${point.xCoordinate}"`,
    ` cy="${point.yCoordinate}" r="${point.radius}"><title>`,
    `${escapeChartHtml(point.xLabel ?? formatX(point.x))} · ${escapeChartHtml(point.seriesLabel)}: `,
    `${escapeChartHtml(point.label ?? formatY(point.y ?? 0))}</title></circle>`
  ].join('')).join('')

  return [
    `<div class="ui-chart__plot" role="region" tabindex="0" aria-label="${escapeChartHtml(labels.chartData)}"><svg aria-hidden="true" viewBox="0 0 ${geometry.width} ${geometry.height}">`,
    `<defs><clipPath id="${plotId}"><rect x="44" y="44" width="${geometry.width - 88}" height="${geometry.height - 88}"></rect></clipPath></defs>`,
    `<g class="ui-scatter-chart__references" clip-path="url(#${plotId})">${references}</g><g class="ui-scatter-chart__marks" clip-path="url(#${plotId})">${marks}</g></svg></div>`,
    `<ul class="ui-scatter-chart__reference-labels">${referenceGeometry.map(item => `<li>${escapeChartHtml(item.label)}</li>`).join('')}</ul>`
  ].join('')
}

export const chartDataTableHtml = (
  categories: readonly (number | string)[],
  series: readonly LumenChartSeries[],
  formatCategory: ((category: number | string) => string) | undefined,
  formatValue: (value: number) => string = String,
  labels: Readonly<LumenChartLabels>
): string => {
  const alignedSeries = series.map(item => alignLumenChartSeries(item, categories))

  const headers = alignedSeries
    .map(item => `<th scope="col">${escapeChartHtml(item.label)}</th>`)
    .join('')

  const rows = categories
    .map(category => {
      const cells = alignedSeries
        .map(item => {
          const datum = item.data.find(candidate => candidate.x === category)

          const value =
            datum?.label ??
            (datum?.y === undefined || datum.y === null || !Number.isFinite(datum.y) ?
              labels.notAvailable :
              formatValue(datum.y))

          return `<td>${escapeChartHtml(value)}</td>`
        })
        .join('')

      const label = getLumenChartCategoryLabel(alignedSeries, category, formatCategory, 'detail')

      return `<tr><th scope="row">${escapeChartHtml(label)}</th>${cells}</tr>`
    })
    .join('')

  return [
    `<details class="ui-chart__data"><summary>${escapeChartHtml(labels.viewData)}</summary>`,
    `<div role="group" tabindex="0" aria-label="${escapeChartHtml(labels.chartData)}"><table><thead><tr><th scope="col">${escapeChartHtml(labels.category)}</th>`,
    `${headers}</tr></thead><tbody>${rows}</tbody></table></div></details>`
  ].join('')
}

export const scatterDataTableHtml = (
  points: readonly LumenScatterGeometryPoint[],
  formatCategory: (category: number | string) => string = String,
  formatValue: (value: number) => string = String,
  labels: Readonly<LumenChartLabels>
): string => {
  const rows = points
    .map(point => [
      `<tr><th scope="row">${escapeChartHtml(point.xLabel ?? formatCategory(point.x))}</th>`,
      `<td>${escapeChartHtml(point.seriesLabel)}</td>`,
      `<td>${escapeChartHtml(point.label ?? formatValue(point.y ?? 0))}</td>`,
      `<td>${escapeChartHtml(point.size === undefined || point.size === null || !Number.isFinite(point.size) ? labels.notAvailable : formatValue(point.size))}</td></tr>`
    ].join(''))
    .join('')

  return [
    `<details class="ui-chart__data"><summary>${escapeChartHtml(labels.viewData)}</summary>`,
    `<div role="group" tabindex="0" aria-label="${escapeChartHtml(labels.chartData)}"><table><thead><tr><th scope="col">${escapeChartHtml(labels.x)}</th>`,
    `<th scope="col">${escapeChartHtml(labels.series)}</th><th scope="col">${escapeChartHtml(labels.value)}</th>`,
    `<th scope="col">${escapeChartHtml(labels.size)}</th></tr></thead>`,
    `<tbody>${rows}</tbody></table></div></details>`
  ].join('')
}

export const heatmapDataTableHtml = (
  data: readonly LumenHeatmapDatum[], labels: Readonly<LumenChartLabels>,
  formatValue: (value: number) => string = String
): string => {
  const rows = data
    .map(cell => {
      const value =
        cell.label ??
        (cell.value === null || !Number.isFinite(cell.value) ?
          labels.notAvailable :
          formatValue(cell.value))

      return [
        `<tr><th scope="row">${escapeChartHtml(cell.xLabel ?? cell.x)}</th>`,
        `<td>${escapeChartHtml(cell.yLabel ?? cell.y)}</td>`,
        `<td>${escapeChartHtml(value)}</td></tr>`
      ].join('')
    })
    .join('')

  return [
    `<details class="ui-chart__data"><summary>${escapeChartHtml(labels.viewData)}</summary>`,
    `<div role="group" tabindex="0" aria-label="${escapeChartHtml(labels.chartData)}"><table><thead><tr><th scope="col">${escapeChartHtml(labels.column)}</th>`,
    `<th scope="col">${escapeChartHtml(labels.row)}</th><th scope="col">${escapeChartHtml(labels.value)}</th></tr></thead>`,
    `<tbody>${rows}</tbody></table></div></details>`
  ].join('')
}

export const rangeDataTableHtml = (
  data: readonly LumenRangeDatum[], labels: Readonly<LumenChartLabels>
): string => {
  const rows = data
    .map(item => [
      `<tr><th scope="row">${escapeChartHtml(item.xLabel ?? item.x)}</th>`,
      `<td>${escapeChartHtml(item.low ?? labels.notAvailable)}</td>`,
      `<td>${escapeChartHtml(item.high ?? labels.notAvailable)}</td></tr>`
    ].join(''))
    .join('')

  return [
    `<details class="ui-chart__data"><summary>${escapeChartHtml(labels.viewData)}</summary>`,
    `<div role="group" tabindex="0" aria-label="${escapeChartHtml(labels.chartData)}"><table><thead><tr><th scope="col">${escapeChartHtml(labels.category)}</th>`,
    `<th scope="col">${escapeChartHtml(labels.low)}</th><th scope="col">${escapeChartHtml(labels.high)}</th></tr></thead>`,
    `<tbody>${rows}</tbody></table></div></details>`
  ].join('')
}

export const chartHeaderHtml = (element: HTMLElement, showValue = true): string => {
  const heading = element.getAttribute('heading')
  const description = element.getAttribute('description')
  const value = showValue ? element.getAttribute('value') : null

  if (!heading && !description && !value) return ''

  return `<header><div class="ui-chart__heading">${heading ? `<h3>${escapeChartHtml(heading)}</h3>` : ''}${description ? `<p>${escapeChartHtml(description)}</p>` : ''}</div>${value ? `<strong data-ui-chart-value>${escapeChartHtml(value)}</strong>` : ''}</header>`
}

export const chartCaptionHtml = (element: HTMLElement): string => {
  const caption = element.getAttribute('caption')

  return caption ? `<figcaption>${escapeChartHtml(caption)}</figcaption>` : ''
}

const isChartCoordinate = (value: unknown): value is number | string => typeof value === 'string' || typeof value === 'number'

export const parseHeatmapData = (value: string | null): LumenHeatmapDatum[] => {
  if (!value) return []

  try {
    const parsed: unknown = JSON.parse(value)

    if (!Array.isArray(parsed)) return []

    return parsed.flatMap(candidate => {
      const record = chartRecord(candidate)

      if (
        !isChartCoordinate(record.x) ||
        !isChartCoordinate(record.y) ||
        (record.value !== null &&
          (typeof record.value !== 'number' || !Number.isFinite(record.value)))
      ) return []

      return [{
        ...(typeof record.id === 'string' ? { id: record.id } : {}),
        ...(typeof record.label === 'string' ? { label: record.label } : {}),
        value: record.value,
        x: record.x,
        ...(typeof record.xLabel === 'string' ? { xLabel: record.xLabel } : {}),
        y: record.y,
        ...(typeof record.yLabel === 'string' ? { yLabel: record.yLabel } : {})
      }]
    })
  } catch {
    return []
  }
}

export const parseRangeData = (value: string | null): LumenRangeDatum[] => {
  if (!value) return []

  try {
    const parsed: unknown = JSON.parse(value)

    if (!Array.isArray(parsed)) return []

    return parsed.flatMap(candidate => {
      if (typeof candidate !== 'object' || candidate === null) return []

      const record = chartRecord(candidate)
      const validBound = (bound: unknown): bound is number | null => bound === null || (typeof bound === 'number' && Number.isFinite(bound))

      if (
        (typeof record.x !== 'string' && typeof record.x !== 'number') ||
        !validBound(record.low) ||
        !validBound(record.high)
      ) return []

      return [{
        high: record.high,
        ...(typeof record.id === 'string' ? { id: record.id } : {}),
        ...(typeof record.label === 'string' ? { label: record.label } : {}),
        low: record.low,
        x: record.x,
        ...(typeof record.xLabel === 'string' ? { xLabel: record.xLabel } : {})
      }]
    })
  } catch {
    return []
  }
}
