// @vitest-environment jsdom
import { afterEach, expect, test } from 'vitest'

import {
  createLumenChartActivationController,
  createLumenChartDatumActivation,
  createLumenHeatmapDatumActivation,
  createLumenRangeDatumActivation,
  parseLumenChartDatumActivation
} from './charts.js'

const controllers: ReturnType<typeof createLumenChartActivationController>[] = []

afterEach(() => {
  for (const controller of controllers.splice(0)) controller.destroy()
  document.body.replaceChildren()
})

const fixture = () => {
  const root = document.createElement('figure')
  root.setAttribute('data-ui-chart-activation', '')
  const button = document.createElement('button')
  button.type = 'button'
  button.textContent = 'Open details: Payments, January, 0'
  button.setAttribute('data-ui-chart-datum', JSON.stringify({ datumId: 'payment-1', kind: 'series', seriesId: 'payments', x: 'January', y: 0 }))
  root.append(button)
  document.body.append(root)
  const events: unknown[] = []
  root.addEventListener('ui:chart-datum-activate', event => {
    if (event instanceof CustomEvent) events.push(event.detail)
  })
  const controller = createLumenChartActivationController(root)
  controllers.push(controller)
  return { root, button, events, controller }
}

test('preserves raw identities, typed axes, zero and negative observations', () => {
  expect(createLumenChartDatumActivation('payments', { id: 'p1', x: '2026-10-03', y: 0 })).toEqual({ datumId: 'p1', kind: 'series', seriesId: 'payments', x: '2026-10-03', y: 0 })
  expect(createLumenChartDatumActivation('refunds', { x: 42, y: -10 })).toEqual({ kind: 'series', seriesId: 'refunds', x: 42, y: -10 })
  expect(createLumenHeatmapDatumActivation({ id: 'cell', value: 0, x: 1, y: 'Monday' })).toEqual({ datumId: 'cell', kind: 'heatmap', value: 0, x: 1, y: 'Monday' })
  expect(createLumenRangeDatumActivation({ high: -2, id: 'range', low: -2, x: 'October' })).toEqual({ datumId: 'range', high: -2, kind: 'range', low: -2, x: 'October' })
})

test('rejects missing observations and invalid ranges without fabricating zero values', () => {
  for (const y of [null, NaN, Infinity, -Infinity]) expect(createLumenChartDatumActivation('s', { x: 1, y })).toBeNull()
  expect(createLumenHeatmapDatumActivation({ value: null, x: 1, y: 2 })).toBeNull()
  expect(createLumenRangeDatumActivation({ high: 1, low: 2, x: 1 })).toBeNull()
  expect(createLumenRangeDatumActivation({ high: null, low: 1, x: 1 })).toBeNull()
  expect(createLumenRangeDatumActivation({ high: 2, low: null, x: 1 })).toBeNull()
  expect(createLumenRangeDatumActivation({ high: Infinity, low: 1, x: 1 })).toBeNull()
})

test('validates untrusted payloads and removes unrelated application data', () => {
  const invalid: unknown[] = [null,
    [],
    1,
    'text',
    {},
    { kind: 'series', seriesId: 's', x: 1, y: '2' },
    { kind: 'series', seriesId: 1, x: 1, y: 2 },
    { kind: 'series', seriesId: 's', x: Infinity, y: 2 },
    { kind: 'heatmap', value: 1, x: 1, y: null },
    { kind: 'range', low: 1, high: 2, x: {}, datumId: 'id' },
    { kind: 'series', seriesId: 's', x: 1, y: 2, datumId: 1 },
    { kind: 'other', x: 1, y: 2 }]
  for (const value of invalid) expect(parseLumenChartDatumActivation(value)).toBeNull()
  expect(parseLumenChartDatumActivation({ kind: 'series', seriesId: 's', x: 1, y: 2, href: '/private', label: 'Display only', xCoordinate: 100 })).toEqual({ kind: 'series', seriesId: 's', x: 1, y: 2 })
})

test('native button and SVG activation emit the same bubbling detail exactly once', () => {
  const { root, button, events } = fixture()
  const outerEvents: unknown[] = []
  const receive = (event: Event) => {
    if (event instanceof CustomEvent) outerEvents.push(event.detail)
  }
  document.body.addEventListener('ui:chart-datum-activate', receive)
  button.click()
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  const mark = document.createElementNS(svg.namespaceURI, 'circle')
  mark.setAttribute('data-ui-chart-datum', button.getAttribute('data-ui-chart-datum') ?? '')
  const title = document.createElementNS(svg.namespaceURI, 'title')
  mark.append(title)
  svg.append(mark)
  root.append(svg)
  title.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  expect(events).toHaveLength(2)
  expect(events[0]).toEqual(events[1])
  expect(outerEvents).toEqual(events)
  document.body.removeEventListener('ui:chart-datum-activate', receive)
})

test('reads replacements at activation time and rejects malformed or missing payloads', () => {
  const { button, events } = fixture()
  button.setAttribute('data-ui-chart-datum', '{broken')
  button.click()
  button.setAttribute('data-ui-chart-datum', JSON.stringify({ kind: 'range', low: 3, high: 1, x: 'January' }))
  button.click()
  button.removeAttribute('data-ui-chart-datum')
  button.click()
  expect(events).toHaveLength(0)
  button.setAttribute('data-ui-chart-datum', JSON.stringify({ kind: 'heatmap', value: 10, x: 'October', y: 'Friday' }))
  button.click()
  expect(events).toEqual([{ kind: 'heatmap', value: 10, x: 'October', y: 'Friday' }])
})

test('isolates nested charts and releases listeners on destruction', () => {
  const outer = fixture()
  const inner = fixture()
  outer.root.append(inner.root)
  inner.button.click()
  // The outer application receives the inner bubbling event, without emitting it again.
  expect(inner.events).toHaveLength(1)
  expect(outer.events).toHaveLength(1)
  inner.controller.destroy()
  inner.controller.destroy()
  inner.button.click()
  expect(outer.events).toHaveLength(1)
  outer.root.remove()
  outer.button.click()
  expect(outer.events).toHaveLength(1)
})

test('honors prevented activation, hidden, inert and disabled controls and secondary clicks', () => {
  const { root, button, events } = fixture()
  const prevent = (event: Event) => {
    event.preventDefault()
  }
  button.addEventListener('click', prevent)
  button.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
  button.removeEventListener('click', prevent)
  for (const attribute of ['disabled', 'hidden', 'inert', 'aria-disabled']) {
    root.setAttribute(attribute, 'true')
    button.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    root.removeAttribute(attribute)
  }
  button.dispatchEvent(new MouseEvent('click', { bubbles: true, button: 2 }))
  expect(events).toHaveLength(0)
  button.click()
  expect(events).toHaveLength(1)
})
