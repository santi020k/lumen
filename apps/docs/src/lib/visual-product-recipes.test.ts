// @vitest-environment jsdom
import { act, createElement } from 'react'
import { createRoot } from 'react-dom/client'

import { afterEach, expect, test, vi } from 'vitest'

import { CardDetailRecipe } from '../../../../packages/lumen/templates/react/card-detail/src/lumen/card-detail.js'
import { MetricCardRecipe } from '../../../../packages/lumen/templates/react/metric-card/src/lumen/metric-card.js'
import { TaskProgressRecipe } from '../../../../packages/lumen/templates/react/task-progress/src/lumen/task-progress.js'

const required = <T extends Element>(value: T | null): T => {
  if (!value) throw new Error('Expected recipe element')
  return value
}

const interact = async (run: () => void): Promise<void> => {
  await act(async () => {
    await Promise.resolve()
    run()
  })
}

afterEach(() => {
  document.body.replaceChildren()
  vi.unstubAllGlobals()
})

test.each(['dialog', 'sheet'] as const)('card details restore trigger focus after closing the %s', async presentation => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  const container = document.createElement('div')
  document.body.append(container)
  const root = createRoot(container)
  try {
    await interact(() => {
      root.render(createElement(CardDetailRecipe, { title: 'Release scope', summary: 'Inspect the release.', presentation }, 'The application supplies these details.'))
    })
    const trigger = required(container.querySelector<HTMLButtonElement>('button'))
    await interact(() => {
      trigger.focus()
      trigger.click()
    })
    const dialog = required(container.querySelector('dialog'))
    expect(dialog.open).toBe(true)
    expect(dialog.getAttribute('aria-labelledby')).toBeTruthy()
    const close = required(dialog.querySelector<HTMLButtonElement>('button'))
    await interact(() => {
      close.focus()
      close.click()
    })
    expect(dialog.open).toBe(false)
    expect(document.activeElement).toBe(trigger)
  } finally {
    await interact(() => {
      root.unmount()
    })
  }
})

test('metric states keep the last known value visible when stale, and recover through a host callback', async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  vi.stubGlobal('matchMedia', () => ({ matches: true }))
  const container = document.createElement('div')
  const root = createRoot(container)
  const retry = vi.fn()
  try {
    await interact(() => {
      root.render(createElement(MetricCardRecipe, { label: 'Revenue', snapshot: { state: 'loading' } }))
    })
    expect(container.querySelector('[aria-busy="true"]')).not.toBeNull()
    expect(container.textContent).toContain('Loading metric')
    await interact(() => {
      root.render(createElement(MetricCardRecipe, { label: 'Revenue', prefix: '$', snapshot: { state: 'stale', value: 420, values: [120, 240, 420], change: '+12%', comparison: 'versus last month', trend: 'positive', updatedAt: 'Updated 12 minutes ago' } }))
    })
    expect(container.textContent).toContain('$420')
    expect(container.textContent).toContain('Out of date')
    expect(container.querySelector('[aria-busy="true"]')).toBeNull()
    expect(container.querySelector('[role="img"]')?.getAttribute('aria-label')).toBe('Revenue trend')
    await interact(() => {
      root.render(createElement(MetricCardRecipe, { label: 'Revenue', snapshot: { state: 'error', message: 'Revenue could not be refreshed.' }, onRetry: retry }))
    })
    expect(container.textContent).not.toContain('$420')
    required(container.querySelector<HTMLButtonElement>('button')).click()
    expect(retry).toHaveBeenCalledOnce()
  } finally {
    await interact(() => {
      root.unmount()
    })
  }
})

test('task actions wait for the application, reject duplicate requests and preserve failed state on action errors', async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  const container = document.createElement('div')
  const root = createRoot(container)
  let finishRequest: (() => void) | undefined
  const onAction = vi.fn(() => new Promise<void>(resolve => {
    finishRequest = resolve
  }))
  try {
    await interact(() => {
      root.render(createElement(TaskProgressRecipe, { title: 'Export', snapshot: { status: 'running', completed: 1, total: 3, detail: 'Rendering the second file.' }, onAction }))
    })
    const cancel = required(container.querySelector<HTMLButtonElement>('button'))
    await interact(() => {
      cancel.click()
      cancel.click()
    })
    expect(onAction).toHaveBeenCalledExactlyOnceWith('cancel')
    expect(cancel.disabled).toBe(true)
    expect(container.querySelector('[data-task-status="running"]')).not.toBeNull()
    expect(container.querySelector('[role="progressbar"]')?.getAttribute('aria-valuenow')).toBe('1')
    await act(async () => {
      finishRequest?.()
      await Promise.resolve()
    })
    const rejected = vi.fn(() => Promise.reject(new Error('Private infrastructure detail')))
    await interact(() => {
      root.render(createElement(TaskProgressRecipe, { title: 'Export', snapshot: { status: 'failed', completed: 1, total: 3, detail: 'One file could not be rendered.' }, onAction: rejected }))
    })
    await act(async () => {
      required(container.querySelector<HTMLButtonElement>('button')).click()
      await Promise.resolve()
    })
    expect(rejected).toHaveBeenCalledExactlyOnceWith('retry')
    expect(container.textContent).toContain('The action could not be completed. Try again.')
    expect(container.textContent).not.toContain('Private infrastructure detail')
    expect(container.querySelector('[data-task-status="failed"]')).not.toBeNull()
    await interact(() => {
      root.render(createElement(TaskProgressRecipe, { title: 'Export', snapshot: { status: 'complete', completed: 3, total: 3, detail: 'All files are ready.' } }))
    })
    expect(container.querySelector('button')).toBeNull()
  } finally {
    await interact(() => {
      root.unmount()
    })
  }
})
