// @vitest-environment jsdom
import { afterEach, expect, test } from 'vitest'

import { initChartActivationControllers } from './runtime/controllers/chart-activation.js'

afterEach(() => {
  document.dispatchEvent(new Event('astro:before-swap'))
  document.body.replaceChildren()
})

test('enhances once and cleans up before navigation so retained roots can initialize again', () => {
  const root = document.createElement('figure')
  root.setAttribute('data-ui-chart-activation', '')
  const button = document.createElement('button')
  button.setAttribute('data-ui-chart-datum', JSON.stringify({ kind: 'series', seriesId: 's', x: 'October', y: 0 }))
  root.append(button)
  document.body.append(root)
  let events = 0
  root.addEventListener('ui:chart-datum-activate', () => {
    events += 1
  })
  initChartActivationControllers(document)
  initChartActivationControllers(document)
  button.click()
  expect(events).toBe(1)
  expect(root.getAttribute('data-ui-chart-activation-bound')).toBe('true')
  document.dispatchEvent(new Event('astro:before-swap'))
  button.click()
  expect(events).toBe(1)
  expect(root.hasAttribute('data-ui-chart-activation-bound')).toBe(false)
  initChartActivationControllers(document)
  button.click()
  expect(events).toBe(2)
})

test('removes a disconnected controller before enhancing replacement charts', () => {
  const root = document.createElement('figure')
  root.setAttribute('data-ui-chart-activation', '')
  document.body.append(root)
  initChartActivationControllers(document)
  root.remove()
  initChartActivationControllers(document)
  expect(root.hasAttribute('data-ui-chart-activation-bound')).toBe(false)
})

test('leaves callback-driven React charts to their framework owner', () => {
  const root = document.createElement('figure')
  root.setAttribute('data-ui-chart-activation', '')
  root.setAttribute('data-ui-chart-adapter', 'react')
  document.body.append(root)
  initChartActivationControllers(document)
  expect(root.hasAttribute('data-ui-chart-activation-bound')).toBe(false)
})
