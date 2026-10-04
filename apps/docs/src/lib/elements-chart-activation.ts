import { parseLumenChartDatumActivation } from '@santi020k/lumen-core'
import { defineLumenElements } from '@santi020k/lumen-elements'

const series = [{ id: 'received',
  label: 'Cobros',
  data: [
    { id: 'zero', x: '2026-10-01', xLabel: 'Oct 1', y: 0 },
    { id: 'positive', x: '2026-10-02', xLabel: 'Oct 2', y: 20 },
    { id: 'missing', x: '2026-10-03', y: null }
  ] }]

export const mountElementsChartActivation = (): void => {
  const mount = document.querySelector('[data-elements-chart-mount]')
  const result = document.querySelector<HTMLElement>('[data-elements-activation-result]')

  if (!mount || !result) return

  defineLumenElements()

  const data = series[0]?.data ?? []

  const fixtures = [
    { name: 'bar', tag: 'bar-chart', attribute: 'series', value: series },
    { name: 'line', tag: 'line-chart', attribute: 'series', value: series },
    { name: 'pie', tag: 'pie-chart', attribute: 'series', value: series },
    { name: 'scatter', tag: 'scatter-chart', attribute: 'series', value: [{ id: 'received', label: 'Cobros', data: data.map((datum, index) => ({ ...datum, x: index })) }] },
    { name: 'combo', tag: 'combo-chart', attribute: 'series', value: [{ id: 'received', label: 'Cobros', data, mark: 'bar' }, { id: 'forecast', label: 'Proyección', data, mark: 'line' }] },
    { name: 'heatmap', tag: 'heatmap', attribute: 'data', value: data.map(datum => ({ id: datum.id, x: datum.x, y: 'October', value: datum.y })) },
    { name: 'range', tag: 'range-chart', attribute: 'data', value: [{ id: 'zero', x: '2026-10-01', low: 0, high: 0 }, { id: 'positive', x: '2026-10-02', low: 10, high: 20 }, { id: 'missing', x: '2026-10-03', low: null, high: null }] }
  ]

  let count = 0

  for (const fixture of fixtures) {
    const chart = document.createElement(`lumen-${fixture.tag}`)

    chart.setAttribute('data-elements-chart-example', fixture.name)

    chart.setAttribute('aria-label', `Elements ${fixture.name}`)

    chart.setAttribute(fixture.attribute, JSON.stringify(fixture.value))

    chart.setAttribute('drilldown', '')

    chart.setAttribute('show-table', 'false')

    chart.setAttribute('markers', 'none')

    if (fixture.name === 'line') chart.setAttribute('interactive', '')

    chart.setAttribute('explore-data-label', 'Explorar datos del gráfico')

    chart.setAttribute('datum-action-prefix', 'Abrir detalles: ')

    chart.addEventListener('ui:chart-datum-activate', event => {
      if (!(event instanceof CustomEvent)) return

      const input: unknown = event.detail
      const detail = parseLumenChartDatumActivation(input)

      if (!detail) return

      count += 1

      result.dataset.count = String(count)

      result.textContent = JSON.stringify(detail)

      // Keep the mixed-adapter observer below from treating this as an Astro event.
      event.stopPropagation()
    })

    mount.append(chart)
  }

  document.querySelector('[data-elements-update]')?.addEventListener('click', () => {
    const chart = mount.querySelector('[data-elements-chart-example="bar"]')

    chart?.setAttribute('series', JSON.stringify(series.map(item => ({ ...item, data: item.data.map(datum => ({ ...datum, y: datum.id === 'positive' ? 40 : datum.y })) }))))
  })
}
