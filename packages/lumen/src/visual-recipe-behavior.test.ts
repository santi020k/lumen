// @vitest-environment jsdom
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

import { afterEach, expect, test, vi } from 'vitest'

import { bindTaskProgress, isTaskSnapshot, mountTaskProgress } from '../templates/shared/task-progress/src/lumen/task-progress-controller.js'
const required = <T extends Element>(value: T | null): T => {
  if (!value) throw new Error('Expected recipe element')
  return value
}
afterEach(() => {
  document.body.replaceChildren()
})

test.each(['failed', 'canceled'] as const)('Elements task recipe keeps %s actions disabled until the host enables them', async status => {
  const template = resolve(import.meta.dirname, '../templates/elements/task-progress/src/lumen/task-progress.html')

  document.body.innerHTML = await readFile(template, 'utf8')
  const root = required(document.querySelector<HTMLElement>('[data-task-recipe]'))
  const retry = required(root.querySelector<HTMLElement>('[data-task-action="retry"]'))
  const cancel = required(root.querySelector<HTMLElement>('[data-task-action="cancel"]'))
  const action = vi.fn<(event: Event) => void>()
  const cleanup = bindTaskProgress(root)

  root.addEventListener('ui:task-action', action)

  try {
    expect(retry.hasAttribute('disabled')).toBe(true)
    expect(cancel.hasAttribute('disabled')).toBe(true)
    root.dispatchEvent(new CustomEvent('ui:task-update', {
      detail: { status, completed: 1, total: 3, detail: 'Export did not complete.' }
    }))
    expect(root.dataset.taskStatus).toBe(status)
    expect(retry.hidden).toBe(false)
    expect(retry.hasAttribute('disabled')).toBe(true)
    expect(cancel.hidden).toBe(true)
    retry.click()
    expect(action).not.toHaveBeenCalled()

    retry.removeAttribute('disabled')
    root.dispatchEvent(new CustomEvent('ui:task-update', {
      detail: { status, completed: 1, total: 3, detail: 'Retry is available.' }
    }))
    expect(retry.hasAttribute('disabled')).toBe(false)
    retry.click()
    expect(action).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ detail: { action: 'retry' } }))
  } finally {
    cleanup()
  }
})

test('DOM task recipes use real updates, validate payloads, isolate instances and remove listeners', () => {
  document.body.innerHTML = '<section data-task-recipe data-task-status="running"><span data-task-status-label="running">In progress</span><span data-task-status-label="failed" hidden>Failed</span><p data-task-detail>Rendering</p><div data-task-progress role="progressbar" aria-valuenow="1"><span data-slot="progress-indicator"></span></div><span data-task-count>1 / 3</span><button data-task-action="cancel">Cancel</button><button data-task-action="retry" hidden>Retry</button></section>'
  const root = required(document.querySelector<HTMLElement>('section'))
  const action = vi.fn()
  root.addEventListener('ui:task-action', action)
  const cleanup = mountTaskProgress(document)
  const repeatCleanup = mountTaskProgress(document)
  required(root.querySelector<HTMLButtonElement>('[data-task-action="cancel"]')).click()
  expect(action).toHaveBeenCalledOnce()
  expect(root.dataset.taskStatus).toBe('running')
  root.dispatchEvent(new CustomEvent('ui:task-update', { detail: { status: 'failed', completed: 1, total: 3, detail: 'Unable to render.' } }))
  expect(root.dataset.taskStatus).toBe('failed')
  expect(required(root.querySelector<HTMLElement>('[data-task-status-label="failed"]')).hidden).toBe(false)
  expect(required(root.querySelector<HTMLElement>('[data-task-action="cancel"]')).hidden).toBe(true)
  required(root.querySelector<HTMLButtonElement>('[data-task-action="retry"]')).click()
  expect(action).toHaveBeenLastCalledWith(expect.objectContaining({ detail: { action: 'retry' } }))
  for (const invalid of [null, { status: 'complete', completed: Infinity, total: 3, detail: '' }, { status: 'unknown', completed: 1, total: 3, detail: '' }, { status: 'running', completed: 4, total: 3, detail: '' }]) {
    expect(isTaskSnapshot(invalid)).toBe(false)
    root.dispatchEvent(new CustomEvent('ui:task-update', { detail: invalid }))
    expect(root.dataset.taskStatus).toBe('failed')
  }
  repeatCleanup()
  cleanup()
  required(root.querySelector<HTMLButtonElement>('[data-task-action="retry"]')).click()
  expect(action).toHaveBeenCalledTimes(2)
  const rebindCleanup = bindTaskProgress(root)
  root.dispatchEvent(new CustomEvent('ui:task-update', { detail: { status: 'complete', completed: 3, total: 3, detail: 'Ready.' } }))
  expect(root.querySelector('[data-task-count]')?.textContent).toBe('3 / 3')
  expect(root.querySelector('[role="progressbar"]')?.getAttribute('aria-valuenow')).toBe('3')
  rebindCleanup()
})
