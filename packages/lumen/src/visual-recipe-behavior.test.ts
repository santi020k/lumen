// @vitest-environment jsdom
import { afterEach, expect, test, vi } from 'vitest'

import { bindTaskProgress, isTaskSnapshot, mountTaskProgress } from '../templates/shared/task-progress/src/lumen/task-progress-controller.js'
const required = <T extends Element>(value: T | null): T => {
  if (!value) throw new Error('Expected recipe element')
  return value
}
afterEach(() => {
  document.body.replaceChildren()
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
