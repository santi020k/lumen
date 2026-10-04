import { createLumenBulletGeometry, getLumenChartToneClassName, type LumenBulletRange, type LumenChartLabels, lumenChartTones } from '@santi020k/lumen-core'

import { escapeChartHtml } from './chart-html.js'

export const bulletNumberAttribute = (element: HTMLElement, name: string): number => {
  const value = element.getAttribute(name)

  return value === null || value.trim() === '' ? NaN : Number(value)
}

const bulletRangeWithTone = (end: number, label: string, inputTone: unknown): LumenBulletRange => {
  const tone = lumenChartTones.find(candidate => candidate === inputTone)

  if (inputTone !== undefined && !tone) return { end: NaN, label: '' }

  return { end, label, ...(tone ? { tone } : {}) }
}

const bulletDomain = (element: HTMLElement) => {
  if (!element.hasAttribute('domain-min') && !element.hasAttribute('domain-max')) return {}

  return { domain: { min: bulletNumberAttribute(element, 'domain-min'), max: bulletNumberAttribute(element, 'domain-max') } }
}

export const parseBulletRanges = (source: string | null): readonly LumenBulletRange[] => {
  try {
    const entries: unknown = JSON.parse(source ?? '[]')

    if (!Array.isArray(entries)) return [{ end: NaN, label: '' }]

    return entries.map((entry: unknown) => {
      if (typeof entry !== 'object' || entry === null || !('end' in entry) || !('label' in entry) ||
        typeof entry.end !== 'number' || typeof entry.label !== 'string') return { end: NaN, label: '' }

      return bulletRangeWithTone(entry.end, entry.label, 'tone' in entry ? entry.tone : undefined)
    })
  } catch {
    return [{ end: NaN, label: '' }]
  }
}

export const bulletChartHtml = (
  element: HTMLElement, ranges: readonly LumenBulletRange[], text: Readonly<LumenChartLabels>,
  format: (value: number) => string
): string => {
  const value = element.hasAttribute('value') ? bulletNumberAttribute(element, 'value') : null
  const target = bulletNumberAttribute(element, 'target')
  const model = createLumenBulletGeometry(value, target, { ranges, ...bulletDomain(element) })

  if (!model.valid) return `<p class="ui-chart__empty" role="status">${escapeChartHtml(text.invalidData)}</p>`

  const actual = value === null ? text.notAvailable : format(value)
  const targetLabel = element.getAttribute('target-label') ?? 'Target'
  const tone = lumenChartTones.find(candidate => candidate === element.getAttribute('tone')) ?? 'series-1'
  const summary = element.getAttribute('summary') ?? `${text.value}: ${actual}. ${targetLabel}: ${format(target)}.`
  const bands = model.ranges.map((range, index) => `<span class="ui-bullet-chart__range ${getLumenChartToneClassName(range.tone ?? 'neutral')}" style="left:${range.startRatio * 100}%;width:${(range.endRatio - range.startRatio) * 100}%;opacity:${0.12 + index / Math.max(1, model.ranges.length - 1) * 0.2}"></span>`).join('')
  const bar = value === null ? '' : `<span class="ui-bullet-chart__bar ${getLumenChartToneClassName(tone)}" style="left:${model.valueStartRatio * 100}%;width:${model.valueWidthRatio * 100}%"></span>`
  const ticks = model.ticks.map(tick => `<span>${escapeChartHtml(format(tick.value))}</span>`).join('')
  const rangeValue = (range: typeof model.ranges[number]) => `${format(range.start)}–${format(range.end)}`
  const legend = model.ranges.length ? `<ul class="ui-bullet-chart__ranges">${model.ranges.map(range => `<li><span>${escapeChartHtml(range.label)}</span><span>${escapeChartHtml(rangeValue(range))}</span></li>`).join('')}</ul>` : ''

  const rows = [
    [text.value, actual],
    [targetLabel, format(target)],
    ...model.ranges.map(range => [range.label, rangeValue(range)])
  ]

  const table = element.getAttribute('show-table') === 'false' ? '' : `<details class="ui-chart__data"><summary>${escapeChartHtml(text.viewData)}</summary><div role="group" tabindex="0" aria-label="${escapeChartHtml(text.chartData)}"><table><thead><tr><th scope="col">${escapeChartHtml(text.category)}</th><th scope="col">${escapeChartHtml(text.value)}</th></tr></thead><tbody>${rows.map(([label, number]) => `<tr><th scope="row">${escapeChartHtml(label ?? '')}</th><td>${escapeChartHtml(number ?? '')}</td></tr>`).join('')}</tbody></table></div></details>`

  return `<p class="ui-sr-only" data-ui-chart-summary>${escapeChartHtml(summary)}</p><div class="ui-bullet-chart__values"><div><span>${escapeChartHtml(text.value)}</span><strong>${escapeChartHtml(actual)}</strong></div><p><span class="ui-bullet-chart__target-key" aria-hidden="true"></span>${escapeChartHtml(targetLabel)}<strong>${escapeChartHtml(format(target))}</strong></p></div><div class="ui-bullet-chart__plot" aria-hidden="true"><div class="ui-bullet-chart__track">${bands}${bar}<span class="ui-bullet-chart__target" style="left:${model.targetRatio * 100}%"></span></div><div class="ui-bullet-chart__ticks">${ticks}</div></div>${legend}${table}`
}
