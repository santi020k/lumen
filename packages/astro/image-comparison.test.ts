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

test('resets the current form after reassignment and adoption, preserving canceled resets', async () => {
  const { root, input, frame } = fixture()
  const original = document.createElement('form')
  const destination = document.createElement('form')

  document.body.append(original, destination)
  original.append(root)
  initImageComparisonControllers(document)
  destination.append(root)
  input.value = '80'
  input.dispatchEvent(new Event('input', { bubbles: true }))
  destination.reset()
  await Promise.resolve()
  expect(frame.style.getPropertyValue('--ui-image-comparison-position')).toBe('50%')
  expect(input.ariaValueText).toContain('50')
  input.value = '80'
  input.dispatchEvent(new Event('input', { bubbles: true }))
  destination.addEventListener('reset', event => {
    event.preventDefault()
  }, { once: true })
  destination.reset()
  await Promise.resolve()
  expect(frame.style.getPropertyValue('--ui-image-comparison-position')).toBe('80%')
  const iframe = document.createElement('iframe')

  document.body.append(iframe)
  const target = iframe.contentDocument

  if (!target) throw new Error('Missing destination document')

  target.body.append(target.adoptNode(destination))
  initImageComparisonControllers(target)
  destination.reset()
  await Promise.resolve()
  expect(frame.style.getPropertyValue('--ui-image-comparison-position')).toBe('50%')
})
