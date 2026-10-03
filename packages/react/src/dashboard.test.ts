// @vitest-environment jsdom
import { act, createElement } from 'react'
import { createRoot } from 'react-dom/client'
import { renderToStaticMarkup } from 'react-dom/server'

import { describe, expect, test } from 'vitest'

import { ChangeSummary } from './change-summary.js'
import { FilterBar } from './dashboard.js'

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })

describe('dashboard composition', () => {
  test('labels before, after and unchanged values without inferring equality', () => {
    const html = renderToStaticMarkup(createElement(ChangeSummary, {
      label: 'Review',
      beforeLabel: 'Current',
      afterLabel: 'Proposed',
      unchangedLabel: 'Same',
      items: [{ id: 'balance', label: 'Balance', before: '0', after: '0.00', changed: false }]
    }))
    const container = document.createElement('div')

    container.innerHTML = html
    expect(container.querySelector('section')?.getAttribute('aria-label')).toBe('Review')
    expect(container.querySelector('[data-changed]')?.textContent).toBe('BalanceSameCurrent0Proposed0.00')
  })
  test('requests removals and reset without mutating controlled filter state', async () => {
    const container = document.createElement('div')
    const root = createRoot(container)
    const calls: string[] = []

    await act(async () => {
      root.render(createElement(FilterBar, {
        label: 'Filters',
        resultLabel: '0 records',
        filters: [{ id: 'status', label: 'Status', value: 'Active' }],
        onRemoveFilter: id => calls.push(id),
        onReset: () => calls.push('reset')
      }))
      await Promise.resolve()
    })
    const buttons = container.querySelectorAll('button')

    await act(async () => {
      buttons[0]?.click()
      buttons[1]?.click()
      await Promise.resolve()
    })
    expect(calls).toEqual(['status', 'reset'])
    expect(container.querySelectorAll('button')).toHaveLength(2)
    expect(container.querySelector('[role="status"]')?.textContent).toBe('0 records')
    await act(async () => {
      root.unmount()
      await Promise.resolve()
    })
  })
})
