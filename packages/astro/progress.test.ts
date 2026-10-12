// @vitest-environment jsdom
import { afterEach, expect, test } from 'vitest'

import { initProgress, readProgressChangeDetail } from './runtime/controllers/progress.js'

const renderProgress = (max = '100', value = '40'): { indicator: HTMLElement, root: HTMLElement } => {
  document.body.innerHTML = `
    <div data-ui-progress role="progressbar" aria-label="Upload" aria-valuemin="0" aria-valuemax="${max}" aria-valuenow="${value}">
      <span data-slot="progress-indicator"></span>
    </div>
  `

  const root = document.querySelector<HTMLElement>('[data-ui-progress]')
  const indicator = document.querySelector<HTMLElement>('[data-slot="progress-indicator"]')

  if (!root || !indicator) throw new Error('Expected progress fixture')

  initProgress(document)

  return { indicator, root }
}

const dispatch = (root: HTMLElement, detail: unknown): void => {
  root.dispatchEvent(new CustomEvent('ui:progress-change', { detail }))
}

const state = (root: HTMLElement, indicator: HTMLElement) => ({
  max: root.getAttribute('aria-valuemax'),
  value: root.getAttribute('aria-valuenow'),
  width: indicator.style.width
})

afterEach(() => {
  document.body.replaceChildren()
})

test('reads only numeric progress fields from unknown event detail', () => {
  expect(readProgressChangeDetail(null)).toEqual({})
  expect(readProgressChangeDetail('50')).toEqual({})
  expect(readProgressChangeDetail({ max: '200', value: 20 })).toEqual({ max: undefined, value: 20 })
})

test('ignores null and malformed detail without throwing or changing values', () => {
  const { indicator, root } = renderProgress()

  for (const detail of [null, undefined, 'bad', 7, { value: '60' }]) {
    expect(() => {
      dispatch(root, detail)
    }).not.toThrow()
    expect(state(root, indicator)).toEqual({ max: '100', value: '40', width: '40%' })
  }

  root.dispatchEvent(new Event('ui:progress-change'))
  expect(state(root, indicator)).toEqual({ max: '100', value: '40', width: '40%' })
})

test('rejects non-finite max and value updates while keeping finite ARIA values', () => {
  const { indicator, root } = renderProgress()

  dispatch(root, { max: Number.POSITIVE_INFINITY, value: 50 })
  expect(state(root, indicator)).toEqual({ max: '100', value: '50', width: '50%' })

  dispatch(root, { max: Number.NaN, value: Number.NaN })
  expect(state(root, indicator)).toEqual({ max: '100', value: '50', width: '50%' })

  dispatch(root, { value: Number.POSITIVE_INFINITY })
  expect(state(root, indicator)).toEqual({ max: '100', value: '50', width: '50%' })

  dispatch(root, { max: 200, value: 300 })
  expect(state(root, indicator)).toEqual({ max: '200', value: '200', width: '100%' })

  dispatch(root, { max: 50 })
  expect(state(root, indicator)).toEqual({ max: '50', value: '50', width: '100%' })
})

test('recovers finite state from invalid server-rendered attributes', () => {
  const { indicator, root } = renderProgress('Infinity', 'NaN')

  dispatch(root, {})
  expect(state(root, indicator)).toEqual({ max: '100', value: '0', width: '0%' })
})
