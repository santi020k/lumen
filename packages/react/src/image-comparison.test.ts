// @vitest-environment jsdom
import { act, createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'

import { afterEach, beforeEach, expect, test, vi } from 'vitest'

import { ImageComparison } from './image-comparison.js'

let container: HTMLDivElement
let root: Root
const media = {
  after: createElement('img', { alt: 'Edited landscape', src: '/edited.jpg' }),
  before: createElement('img', { alt: 'Original landscape', src: '/original.jpg' }),
  label: 'Compare photos'
}

beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
})

afterEach(() => {
  act(() => {
    root.unmount()
  })
  container.remove()
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

const range = (): HTMLInputElement => {
  const input = container.querySelector('input')

  if (!input) throw new Error('Expected native comparison range')

  return input
}

const setRange = (value: string): void => {
  const input = range()
  const descriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')

  if (!descriptor?.set) throw new Error('Expected native input value setter')

  act(() => {
    descriptor.set?.call(input, value)
    input.dispatchEvent(new Event('input', { bubbles: true }))
  })
}

test('updates an uncontrolled reveal without replacing either media node', () => {
  const onValueChange = vi.fn()

  act(() => {
    root.render(createElement(ImageComparison, { ...media, defaultValue: 25, onValueChange }))
  })
  const images = Array.from(container.querySelectorAll('img'))

  expect(range().value).toBe('25')
  setRange('75')
  expect(range().value).toBe('75')
  expect(onValueChange).toHaveBeenCalledWith(75)
  expect(container.querySelector<HTMLElement>('.ui-image-comparison__frame')?.style.getPropertyValue('--ui-image-comparison-position')).toBe('75%')
  expect(Array.from(container.querySelectorAll('img'))).toEqual(images)
})

test('keeps a controlled value until its owner updates it and exposes localized labels', () => {
  const onValueChange = vi.fn()
  const props = { ...media, afterLabel: 'Edited', locale: 'es', onValueChange, value: 20 }

  act(() => {
    root.render(createElement(ImageComparison, props))
  })
  setRange('80')
  expect(onValueChange).toHaveBeenCalledWith(80)
  expect(range().value).toBe('20')
  act(() => {
    root.render(createElement(ImageComparison, { ...props, value: 80 }))
  })
  expect(range().value).toBe('80')
  expect(range().ariaValueText).toContain('Edited')
})

test('normalizes invalid values and keeps disabled input inert', () => {
  const onValueChange = vi.fn()

  act(() => {
    root.render(createElement(ImageComparison, {
      ...media, disabled: true, onValueChange, ratio: 0, value: 200
    }))
  })
  expect(range().disabled).toBe(true)
  expect(range().value).toBe('100')
  setRange('10')
  expect(onValueChange).not.toHaveBeenCalled()
  expect(container.querySelector<HTMLElement>('.ui-image-comparison__frame')?.style.getPropertyValue('--ui-image-comparison-ratio')).toBe(String(16 / 9))
})

test('form reset restores the uncontrolled default and respects cancellation', async () => {
  const onValueChange = vi.fn()

  act(() => {
    root.render(createElement('form', null, createElement(ImageComparison, { ...media, defaultValue: 25, name: 'reveal', onValueChange })))
  })
  const form = container.querySelector('form')

  if (!form) throw new Error('Expected comparison form')

  setRange('75')
  form.addEventListener('reset', event => {
    event.preventDefault()
  }, { once: true })
  await act(async () => {
    form.reset()

    await new Promise(resolve => window.setTimeout(resolve))
  })
  expect(range().value).toBe('75')
  await act(async () => {
    form.reset()

    await new Promise(resolve => window.setTimeout(resolve))
  })
  expect(range().value).toBe('25')
  expect(new FormData(form).get('reveal')).toBe('25')
  expect(container.querySelector<HTMLElement>('.ui-image-comparison__frame')?.style.getPropertyValue('--ui-image-comparison-position')).toBe('25%')
  expect(onValueChange).toHaveBeenCalledOnce()
})

test('form reset preserves the controlled comparison value', async () => {
  act(() => {
    root.render(createElement('form', null, createElement(ImageComparison, { ...media, defaultValue: 25, value: 70 })))
  })
  const form = container.querySelector('form')

  if (!form) throw new Error('Expected comparison form')

  await act(async () => {
    form.reset()

    await new Promise(resolve => window.setTimeout(resolve))
  })
  expect(range().value).toBe('70')
  expect(container.querySelector<HTMLElement>('.ui-image-comparison__frame')?.style.getPropertyValue('--ui-image-comparison-position')).toBe('70%')
})

for (const cancellations of [[false, true], [true, false], [true, true]]) {
  test(`batched resets preserve uncanceled events with cancellation order ${cancellations.join(', ')}`, async () => {
    act(() => {
      root.render(createElement('form', null, createElement(ImageComparison, { ...media, defaultValue: 25 })))
    })
    const form = container.querySelector('form')

    if (!form) throw new Error('Expected comparison form')

    setRange('75')
    let resetIndex = 0

    form.addEventListener('reset', event => {
      if (cancellations[resetIndex]) event.preventDefault()

      resetIndex += 1
    })
    await act(async () => {
      form.reset()
      form.reset()

      await new Promise(resolve => window.setTimeout(resolve))
    })
    const expected = cancellations.every(Boolean) ? '75' : '25'

    expect(range().value).toBe(expected)
    expect(container.querySelector<HTMLElement>('.ui-image-comparison__frame')?.style.getPropertyValue('--ui-image-comparison-position')).toBe(`${expected}%`)
  })
}

test('unmount cancels pending reset work before the timer runs', () => {
  act(() => {
    root.render(createElement('form', null, createElement(ImageComparison, { ...media, defaultValue: 25 })))
  })
  const form = container.querySelector('form')

  if (!form) throw new Error('Expected comparison form')

  setRange('75')
  vi.useFakeTimers()
  const initialTimers = vi.getTimerCount()

  act(() => {
    form.reset()
    form.reset()
  })
  expect(vi.getTimerCount()).toBe(initialTimers + 1)
  act(() => {
    root.render(null)
  })
  expect(vi.getTimerCount()).toBe(initialTimers)
})
