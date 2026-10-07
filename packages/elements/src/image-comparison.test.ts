import { afterEach, beforeAll, expect, test, vi } from 'vitest'

import { defineLumenImageComparison, LumenImageComparisonElement } from './components/image-comparison.js'

beforeAll(() => {
  defineLumenImageComparison()
})
afterEach(() => {
  document.body.replaceChildren()
})

const fixture = (value = 50) => {
  const element = new LumenImageComparisonElement()
  const before = document.createElement('img')
  const after = document.createElement('img')

  before.slot = 'before'
  before.alt = 'Original landscape'
  after.slot = 'after'
  after.alt = 'Edited landscape'
  element.setAttribute('label', 'Compare photos')
  element.setAttribute('value', String(value))
  element.append(before, after)
  document.body.append(element)
  const input = element.querySelector('input')
  const frame = element.querySelector<HTMLElement>('.ui-image-comparison__frame')

  if (!input || !frame) throw new Error('Expected enhanced comparison')

  return { element, input, frame, before, after }
}

test('preserves consumer media nodes and responds to attributes and value properties', () => {
  const { element, input, frame, before, after } = fixture()

  expect(element.querySelector('.ui-image-comparison__before')?.firstElementChild).toBe(before)
  expect(element.querySelector('.ui-image-comparison__after')?.firstElementChild).toBe(after)
  element.value = 200
  expect(input.value).toBe('100')
  expect(frame.style.getPropertyValue('--ui-image-comparison-position')).toBe('100%')
  element.setAttribute('ratio', '0')
  expect(frame.style.getPropertyValue('--ui-image-comparison-ratio')).toBe(String(16 / 9))
  element.setAttribute('after-label', 'Edited')
  element.setAttribute('locale', 'es')
  expect(input.ariaValueText).toContain('Edited')
  element.setAttribute('label', 'Compare photos')
  expect(element.querySelector('label')?.textContent).toBe('Compare photos')
})

test('dispatches one typed value per interaction after reconnecting and respects disabled', () => {
  const { element, input, frame } = fixture()
  const listener = vi.fn()

  element.addEventListener('ui:image-comparison-change', listener)
  element.remove()
  document.body.append(element)
  expect(element.querySelectorAll('input')).toHaveLength(1)
  input.value = '75'
  input.dispatchEvent(new Event('input', { bubbles: true }))
  expect(listener).toHaveBeenCalledOnce()
  expect(element.value).toBe(75)
  expect(frame.style.getPropertyValue('--ui-image-comparison-position')).toBe('75%')
  element.setAttribute('disabled', '')
  expect(input.disabled).toBe(true)
  input.value = '30'
  input.dispatchEvent(new Event('input', { bubbles: true }))
  expect(element.value).toBe(75)
  expect(listener).toHaveBeenCalledOnce()
})

test('waits for parser-provided slots without replacing fallback content', async () => {
  const element = new LumenImageComparisonElement()

  document.body.append(element)
  element.innerHTML = '<img slot="before" alt="Original"><img slot="after" alt="Edited"><p>Media credit</p>'
  await Promise.resolve()
  expect(element.querySelector('input')).not.toBeNull()
  expect(element.querySelector('p')?.textContent).toBe('Media credit')
})

test('form reset restores the initial reveal after moving to another parent and respects cancellation', async () => {
  const { element, input, frame } = fixture(25)
  const form = document.createElement('form')
  const listener = vi.fn()

  form.append(element)
  document.body.append(form)
  element.setAttribute('name', 'reveal')
  element.addEventListener('ui:image-comparison-change', listener)
  input.value = '75'
  input.dispatchEvent(new Event('input', { bubbles: true }))
  form.addEventListener('reset', event => {
    event.preventDefault()
  }, { once: true })
  form.reset()
  await new Promise(resolve => window.setTimeout(resolve))
  expect(element.value).toBe(75)
  expect(input.value).toBe('75')
  form.reset()
  await new Promise(resolve => window.setTimeout(resolve))
  expect(element.value).toBe(25)
  expect(input.value).toBe('25')
  expect(new FormData(form).get('reveal')).toBe('25')
  expect(frame.style.getPropertyValue('--ui-image-comparison-position')).toBe('25%')
  expect(listener).toHaveBeenCalledOnce()
})

test.each(['attribute', 'property', 'removed'])('reset uses the latest external %s baseline without retaining user edits', async mode => {
  const { element, input } = fixture(25)
  const form = document.createElement('form')
  form.append(element)
  document.body.append(form)
  element.setAttribute('name', 'reveal')
  input.value = '75'
  input.dispatchEvent(new Event('input', { bubbles: true }))
  if (mode === 'attribute') element.setAttribute('value', '40')
  else if (mode === 'property') element.value = 40
  else element.removeAttribute('value')
  element.setAttribute('label', 'Updated label')
  input.value = '90'
  input.dispatchEvent(new Event('input', { bubbles: true }))
  form.reset()
  await new Promise(resolve => window.setTimeout(resolve))
  expect(element.value).toBe(mode === 'removed' ? 50 : 40)
  expect(input.value).toBe(mode === 'removed' ? '50' : '40')
  expect(new FormData(form).get('reveal')).toBe(input.value)
})

test('switches display modes without replacing slotted media or changing the reveal', () => {
  const { element, input, before, after } = fixture(75)

  for (const mode of ['side-by-side', 'before', 'after', 'reveal']) {
    element.setAttribute('mode', mode)
    expect(element.dataset.mode).toBe(mode)
    expect(input.disabled).toBe(mode !== 'reveal')
    expect(input.closest('label')?.hidden).toBe(mode !== 'reveal')
    expect(element.querySelector<HTMLElement>('.ui-image-comparison__before')?.hidden).toBe(mode === 'after')
    expect(element.querySelector<HTMLElement>('.ui-image-comparison__after')?.hidden).toBe(mode === 'before')
    expect(element.querySelector('[slot="before"]')).toBe(before)
    expect(element.querySelector('[slot="after"]')).toBe(after)
    expect(element.value).toBe(75)
  }
  element.setAttribute('mode', 'unknown')
  expect(element.dataset.mode).toBe('reveal')
  element.setAttribute('disabled', '')
  expect(input.disabled).toBe(true)
})
