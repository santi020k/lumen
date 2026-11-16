// @vitest-environment jsdom
import { defineLumenElements } from '@santi020k/lumen-elements'
import { afterEach, expect, test, vi } from 'vitest'

import { type MetricSnapshot, renderMetricCard } from '../templates/elements/metric-card/src/lumen/metric-card.js'

afterEach(() => {
  document.body.replaceChildren()
  vi.unstubAllGlobals()
})

test('Elements metric keeps a visible label in every state and preserves untrusted messages as text', () => {
  vi.stubGlobal('matchMedia', () => ({ matches: true, addEventListener: () => undefined, removeEventListener: () => undefined }))
  defineLumenElements(['Card', 'Stat', 'StatLabel', 'AnimatedNumber', 'Sparkline', 'Skeleton', 'Badge', 'Button'])
  const root = document.createElement('section')
  document.body.append(root)
  const snapshots: MetricSnapshot[] = [
    { state: 'loading' },
    { state: 'ready', value: 420, values: [120, 240, 420], change: '+12%', comparison: 'versus last month', trend: 'positive', updatedAt: 'Updated now' },
    { state: 'stale', value: 420, values: [120, 240, 420], change: '+12%', comparison: 'versus last month', trend: 'positive', updatedAt: 'Updated 12 minutes ago' },
    { state: 'error', message: '<img src=x onerror=alert(1)>' }
  ]
  const retry = vi.fn()
  for (const snapshot of snapshots) {
    renderMetricCard(root, { label: 'Monthly revenue', snapshot }, retry)
    const label = root.querySelector('lumen-stat-label')
    expect(label?.textContent).toBe('Monthly revenue')
    expect(label?.closest('[hidden]')).toBeNull()
  }
  expect(root.querySelector('img')).toBeNull()
  expect(root.textContent).toContain('<img src=x onerror=alert(1)>')
  root.querySelector<HTMLElement>('lumen-button')?.click()
  expect(retry).toHaveBeenCalledOnce()
})
