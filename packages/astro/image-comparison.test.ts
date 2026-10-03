// @vitest-environment jsdom
import { afterEach, expect, test, vi } from 'vitest'

import { initImageComparisonControllers } from './runtime/controllers/image-comparison.js'

afterEach(() => {
  document.body.replaceChildren()
})

const fixture = () => {
  document.body.innerHTML = `<figure data-ui-image-comparison data-after-label="Edited" data-locale="es">
    <div class="ui-image-comparison__frame"></div>
    <label>Compare photos<input data-ui-image-comparison-input type="range" min="0" max="100" value="50" disabled></label>
  </figure>`
  const root = document.querySelector<HTMLElement>('figure')
  const input = document.querySelector<HTMLInputElement>('input')
  const frame = document.querySelector<HTMLElement>('.ui-image-comparison__frame')

  if (!root || !input || !frame) throw new Error('Expected comparison fixture')

  return { root, input, frame }
}

test('enhances once, enables the native input and keeps reveal and accessible value in sync', () => {
  const { root, input, frame } = fixture()
  const onChange = vi.fn()

  root.addEventListener('ui:image-comparison-change', onChange)
  initImageComparisonControllers(document)
  initImageComparisonControllers(document)
  expect(input.disabled).toBe(false)
  input.value = '75'
  input.dispatchEvent(new Event('input', { bubbles: true }))
  expect(frame.style.getPropertyValue('--ui-image-comparison-position')).toBe('75%')
  expect(input.ariaValueText).toContain('Edited')
  expect(onChange).toHaveBeenCalledOnce()
  const event: unknown = onChange.mock.calls[0]?.[0]

  if (!(event instanceof CustomEvent)) throw new Error('Expected comparison event')

  expect(event.detail).toEqual({ value: 75 })
})

test('keeps explicitly disabled comparisons inert', () => {
  const { root, input, frame } = fixture()

  root.dataset.disabled = 'true'
  initImageComparisonControllers(document)
  expect(input.disabled).toBe(true)
  input.value = '90'
  input.dispatchEvent(new Event('input', { bubbles: true }))
  expect(frame.style.getPropertyValue('--ui-image-comparison-position')).toBe('50%')
})
