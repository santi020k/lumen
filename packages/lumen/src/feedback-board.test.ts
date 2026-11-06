// @vitest-environment jsdom
import { afterEach, expect, test, vi } from 'vitest'

import { type FeedbackActions, type FeedbackItem, initializeFeedbackBoard } from '../templates/astro/feedback-board/src/lumen/feedback-board.js'

const mount = () => {
  document.body.innerHTML = '<section data-loading="Loading" data-empty="Empty" data-failure="Failed" data-success="Saved"><form><fieldset data-feedback-fields><input name="title" value="Draft"><button type="submit">Submit</button></fieldset></form><select data-feedback-sort><option value="newest">Newest</option><option value="popular">Popular</option></select><p data-feedback-status tabindex="-1"></p><button data-feedback-retry>Retry</button><ol data-feedback-list></ol><template><li><span data-item-title></span><button data-item-id></button></li></template></section>'
  const root = document.querySelector('section')
  if (!root) throw new Error('Missing fixture')
  return root
}

afterEach(() => {
  document.body.replaceChildren()
})

test('reinitialization removes old listeners and disposed loads cannot replace newer content', async () => {
  const root = mount()
  let resolveOld: ((items: Awaited<ReturnType<FeedbackActions['load']>>) => void) | undefined
  const oldLoad = new Promise<Awaited<ReturnType<FeedbackActions['load']>>>(resolve => {
    resolveOld = resolve
  })
  const old = { load: vi.fn(() => oldLoad), submit: vi.fn(async () => {}), vote: vi.fn(async () => {}) }
  const firstDispose = initializeFeedbackBoard(root, old)
  const current = { load: vi.fn(() => Promise.resolve([])), submit: vi.fn(async () => {}), vote: vi.fn(async () => {}) }
  const dispose = initializeFeedbackBoard(root, current)
  await vi.waitFor(() => {
    expect(root.querySelector('[data-feedback-status]')?.textContent).toBe('Empty')
  })
  const staleItem: FeedbackItem = { id: 'old', title: 'Stale', description: '', status: '', votes: '', voted: false }
  resolveOld?.([staleItem])
  await oldLoad
  expect(root.textContent).not.toContain('Stale')
  root.querySelector('form')?.dispatchEvent(new Event('submit', { cancelable: true }))
  await vi.waitFor(() => {
    expect(current.submit).toHaveBeenCalledTimes(1)
  })
  expect(old.submit).not.toHaveBeenCalled()
  firstDispose()
  dispose()
})

test('a failed mutation retains the draft and exposes a focused recovery message', async () => {
  const root = mount()
  const dispose = initializeFeedbackBoard(root, {
    load: () => Promise.resolve([]),
    submit: () => Promise.reject(new Error('Offline')),
    vote: async () => {}
  })
  root.querySelector('form')?.dispatchEvent(new Event('submit', { cancelable: true }))
  await vi.waitFor(() => {
    expect(root.querySelector('[data-feedback-status]')?.textContent).toBe('Failed')
  })
  expect(document.activeElement).toBe(root.querySelector('[data-feedback-status]'))
  expect(root.querySelector('input')?.value).toBe('Draft')
  dispose()
})
