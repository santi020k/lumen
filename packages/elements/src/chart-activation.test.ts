import { afterEach, beforeAll, expect, test } from 'vitest'

import { defineLumenElements } from './index.js'

beforeAll(() => {
  defineLumenElements()
})
afterEach(() => {
  document.body.replaceChildren()
})

const series = [{ id: 'received',
  label: 'Cobros',
  data: [
    { id: 'zero', x: '2026-10-01', y: 0 },
    { id: 'positive', x: '2026-10-02', y: 20 },
    { id: 'missing', x: '2026-10-03', y: null }
  ] }]

const fixtures = [
  { name: 'bar-chart', attribute: 'series', data: series, count: 2 },
  { name: 'line-chart', attribute: 'series', data: series, count: 2 },
  { name: 'pie-chart', attribute: 'series', data: series, count: 1 },
  { name: 'scatter-chart', attribute: 'series', data: series.map(item => ({ ...item, data: item.data.map((datum, index) => ({ ...datum, x: index })) })), count: 2 },
  { name: 'combo-chart', attribute: 'series', data: [...series.map(item => ({ ...item, mark: 'bar' })), ...series.map(item => ({ ...item, id: 'forecast', mark: 'line' }))], count: 4 },
  { name: 'heatmap', attribute: 'data', data: series[0]?.data.map(datum => ({ id: datum.id, x: datum.x, y: 'October', value: datum.y })) ?? [], count: 2 },
  { name: 'range-chart',
    attribute: 'data',
    data: [
      { id: 'zero', x: '2026-10-01', low: 0, high: 0 },
      { id: 'positive', x: '2026-10-02', low: 10, high: 20 },
      { id: 'missing', x: '2026-10-03', low: null, high: null },
      { id: 'invalid', x: '2026-10-04', low: 20, high: 10 }
    ],
    count: 2 }
]

const mount = (fixture: typeof fixtures[number], enabled = true): HTMLElement => {
  const root = document.createElement(`lumen-${fixture.name}`)
  root.setAttribute(fixture.attribute, JSON.stringify(fixture.data))
  root.setAttribute('show-table', 'false')
  root.setAttribute('markers', 'none')
  root.setAttribute('explore-data-label', 'Explorar datos')
  root.setAttribute('datum-action-prefix', 'Abrir detalles: ')
  if (enabled) root.setAttribute('drilldown', '')
  document.body.append(root)
  return root
}

for (const fixture of fixtures) {
  test(`${fixture.name} shares valid pointer and native button payloads without a table`, () => {
    const root = mount(fixture)
    const received: unknown[] = []
    root.addEventListener('ui:chart-datum-activate', event => {
      if (event instanceof CustomEvent) received.push(event.detail)
    })
    const buttons = root.querySelectorAll<HTMLButtonElement>('[data-ui-chart-actions] button')
    expect(buttons).toHaveLength(fixture.count)
    expect(root.querySelector('.ui-chart__data')).toBeNull()
    expect(root.querySelector('summary')?.textContent).toBe('Explorar datos')
    const button = buttons[0]
    if (!button) throw new Error('Expected a datum action')
    expect(button.textContent).toMatch(/^Abrir detalles:/)
    const expected: unknown = JSON.parse(button.getAttribute('data-ui-chart-datum') ?? 'null')
    button.click()
    const mark = [...root.querySelectorAll('svg [data-ui-chart-datum]')].find(element => element.getAttribute('data-ui-chart-datum') === button.getAttribute('data-ui-chart-datum'))
    if (!mark) throw new Error('Expected a matching plotted mark')
    mark.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    expect(received).toEqual([expected, expected])
    expect(root.querySelector('[data-ui-chart-datum*="missing"]')).toBeNull()
    expect(root.querySelector('[data-ui-chart-datum*="invalid"]')).toBeNull()
  })

  test(`${fixture.name} remains static until drilldown is enabled`, () => {
    const root = mount(fixture, false)
    expect(root.querySelector('[data-ui-chart-datum]')).toBeNull()
    expect(root.querySelector('[data-ui-chart-actions]')).toBeNull()
    root.setAttribute('drilldown', '')
    expect(root.querySelectorAll('[data-ui-chart-actions] button')).toHaveLength(fixture.count)
    root.setAttribute('drilldown', 'false')
    expect(root.querySelector('[data-ui-chart-actions]')).toBeNull()
    expect(root.hasAttribute('data-ui-chart-activation')).toBe(false)
  })
}

test('preserves destination-realm action focus through repeated adopted chart updates', () => {
  const fixture = fixtures[0]

  if (!fixture) throw new Error('Missing chart fixture')

  const chart = mount(fixture)
  const iframe = document.createElement('iframe')

  document.body.append(iframe)
  const destination = iframe.contentDocument

  if (!destination) throw new Error('Missing destination document')

  destination.body.append(destination.adoptNode(chart))
  chart.setAttribute('series', JSON.stringify(series))
  const disclosure = chart.querySelector<HTMLDetailsElement>('[data-ui-chart-actions]')
  const action = chart.querySelector('button')

  if (!disclosure || !action) throw new Error('Missing chart actions')

  disclosure.open = true
  action.focus()
  expect(destination.activeElement).toBe(action)
  const key = action.getAttribute('data-ui-chart-action-key')

  chart.setAttribute('datum-action-prefix', 'Details: ')
  expect(destination.activeElement?.getAttribute('data-ui-chart-action-key')).toBe(key)
  expect(destination.activeElement?.textContent).toContain('Details: ')
  expect(chart.querySelector<HTMLDetailsElement>('[data-ui-chart-actions]')?.open).toBe(true)
})

test('keeps action focus, open disclosure, current values and single dispatch across updates and reconnection', () => {
  const fixture = fixtures[0]
  if (!fixture) throw new Error('Missing bar fixture')
  const root = mount(fixture)
  const result: unknown[] = []
  root.addEventListener('ui:chart-datum-activate', event => {
    if (event instanceof CustomEvent) result.push(event.detail)
  })
  const disclosure = root.querySelector('details')
  const button = root.querySelectorAll<HTMLButtonElement>('button')[1]
  if (!disclosure || !button) throw new Error('Missing actions')
  disclosure.open = true
  button.focus()
  root.setAttribute('series', JSON.stringify(series.map(item => ({ ...item, data: item.data.map(datum => ({ ...datum, y: datum.id === 'positive' ? 40 : datum.y })) }))))
  expect(root.querySelector('details')?.open).toBe(true)
  const focused = document.activeElement
  expect(focused?.textContent).toContain('40')
  if (!(focused instanceof HTMLButtonElement)) throw new Error('Focus was not restored to an action')
  focused.click()
  expect(result).toEqual([{ kind: 'series', seriesId: 'received', datumId: 'positive', x: '2026-10-02', y: 40 }])
  root.remove()
  focused.click()
  expect(result).toHaveLength(1)
  document.body.append(root)
  root.querySelector<HTMLButtonElement>('button')?.click()
  expect(result).toHaveLength(2)
})

test('honors caller prevention, disabled roots, nested owners, malformed payloads, and raw combo axes', () => {
  const fixture = fixtures.find(item => item.name === 'combo-chart')
  if (!fixture) throw new Error('Missing combo fixture')
  const root = mount(fixture)
  const result: unknown[] = []
  root.addEventListener('ui:chart-datum-activate', event => {
    if (event instanceof CustomEvent) result.push(event.detail)
  })
  const button = root.querySelector<HTMLButtonElement>('button[data-ui-chart-datum*="forecast"][data-ui-chart-datum*="positive"]')
  if (!button) throw new Error('Missing forecast action')
  button.click()
  expect(result).toEqual([{ kind: 'series', seriesId: 'forecast', datumId: 'positive', x: '2026-10-02', y: 20 }])
  const cancel = (event: Event) => {
    event.preventDefault()
  }
  button.addEventListener('click', cancel)
  button.click()
  expect(result).toHaveLength(1)
  button.removeEventListener('click', cancel)
  root.setAttribute('aria-disabled', 'true')
  button.click()
  expect(result).toHaveLength(1)
  root.removeAttribute('aria-disabled')
  button.setAttribute('data-ui-chart-datum', '{broken')
  button.click()
  expect(result).toHaveLength(1)
  const innerFixture = fixtures[0]
  if (!innerFixture) throw new Error('Missing bar fixture')
  const inner = mount(innerFixture)
  root.append(inner)
  inner.querySelector<HTMLButtonElement>('button')?.click()
  expect(result).toHaveLength(2)
})

test('escapes untrusted long identities and localized labels without inventing HTML', () => {
  const fixture = fixtures[0]
  if (!fixture) throw new Error('Missing bar fixture')
  const root = mount(fixture)
  const identity = '<img src=x onerror=alert(1)>"&'.repeat(1000)
  root.setAttribute('series', JSON.stringify([{ id: identity, label: identity, data: [{ id: identity, x: identity, y: 0 }] }]))
  root.setAttribute('datum-action-prefix', '<b>Abrir</b> ')
  expect(root.querySelector('img')).toBeNull()
  expect(root.querySelector('b')).toBeNull()
  const button = root.querySelector<HTMLButtonElement>('button')
  if (!button) throw new Error('Missing localized action')
  expect(button.textContent).toContain('<b>Abrir</b>')
  const result: unknown[] = []
  root.addEventListener('ui:chart-datum-activate', event => {
    if (event instanceof CustomEvent) result.push(event.detail)
  })
  button.click()
  expect(result).toEqual([{ kind: 'series', seriesId: identity, x: identity, y: 0, datumId: identity }])
  if (!('datumActionFormatter' in root)) throw new Error('Missing formatter property')
  root.datumActionFormatter = (context: string) => `Abrir: ${context}`
  expect(root.querySelector('button')?.textContent).toMatch(/^Abrir:/)
})

test('empty data has no actions and removing focused observations releases obsolete focus', () => {
  const fixture = fixtures[0]
  if (!fixture) throw new Error('Missing bar fixture')
  const root = mount(fixture)
  root.querySelector<HTMLButtonElement>('button')?.focus()
  root.setAttribute('series', '[]')
  expect(root.querySelector('[data-ui-chart-actions]')).toBeNull()
  expect(root.querySelector('[data-ui-chart-datum]')).toBeNull()
  expect(root.contains(document.activeElement)).toBe(false)
})
