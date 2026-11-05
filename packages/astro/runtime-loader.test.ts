// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import type { LumenRuntimeController, LumenRuntimeFeature } from './runtime/types.js'

const registry = vi.hoisted(() => {
  const features: LumenRuntimeFeature[] = []

  return { features }
})

vi.mock('./runtime/features.js', () => ({ runtimeFeatures: registry.features }))

const deferredController = () => {
  let complete: (controller: LumenRuntimeController) => void = () => {
    throw new Error('Uninitialized controller')
  }
  const promise = new Promise<LumenRuntimeController>(resolve => {
    complete = resolve
  })

  return { promise,
    resolve: (controller: LumenRuntimeController) => {
      complete(controller)
    } }
}

let listeners = vi.spyOn(document, 'addEventListener')

beforeEach(() => {
  vi.resetModules()
  registry.features.length = 0
  document.body.replaceChildren()
  delete document.documentElement.dataset.uiPrimitivesGlobalBound
  listeners = vi.spyOn(document, 'addEventListener')
})

afterEach(() => {
  for (const [type, listener, options] of listeners.mock.calls) document.removeEventListener(type, listener, options)
  vi.restoreAllMocks()
})

describe('selective runtime loading', () => {
  test('loads only present features, shares in-flight requests, and initializes in registry order', async () => {
    document.body.innerHTML = '<div data-first></div><div data-second></div>'
    const first = deferredController()
    const second = deferredController()
    const order: string[] = []
    const firstLoad = vi.fn(() => first.promise)
    const secondLoad = vi.fn(() => second.promise)
    const absentLoad = vi.fn(() => Promise.resolve({ init: () => {
      order.push('absent')
    } }))

    registry.features.push(
      { name: 'first', selector: '[data-first]', load: firstLoad },
      { name: 'second', selector: '[data-second]', load: secondLoad },
      { name: 'absent', selector: '[data-absent]', load: absentLoad }
    )
    const { initUiPrimitives } = await import('./runtime/loader.js')
    const ready = vi.fn()

    document.addEventListener('ui:ready', ready)
    const requests = [initUiPrimitives(), initUiPrimitives()]

    second.resolve({ init: () => {
      order.push('second')
    } })
    first.resolve({ init: () => {
      order.push('first')
    } })
    await Promise.all(requests)
    expect(order).toEqual(['first', 'second', 'first', 'second'])
    expect(firstLoad).toHaveBeenCalledTimes(1)
    expect(secondLoad).toHaveBeenCalledTimes(1)
    expect(absentLoad).not.toHaveBeenCalled()
    expect(ready).toHaveBeenCalledTimes(2)
  })

  test('retries a failed module and enhances newly inserted markup', async () => {
    const init = vi.fn()
    const load = vi.fn<() => Promise<LumenRuntimeController>>()
      .mockRejectedValueOnce(new Error('Offline'))
      .mockResolvedValue({ init })

    registry.features.push({ name: 'control', selector: '[data-control]', load })
    const { initUiPrimitives } = await import('./runtime/loader.js')

    await initUiPrimitives()
    expect(load).not.toHaveBeenCalled()
    document.body.innerHTML = '<button data-control>Open</button>'
    await expect(initUiPrimitives()).rejects.toBeInstanceOf(AggregateError)
    await initUiPrimitives()
    expect(load).toHaveBeenCalledTimes(2)
    expect(init).toHaveBeenCalledTimes(1)
  })

  test('initializes available controllers when an unrelated chunk fails', async () => {
    document.body.innerHTML = '<div data-good></div><div data-offline></div>'
    const init = vi.fn()
    registry.features.push(
      { name: 'good', selector: '[data-good]', load: () => Promise.resolve({ init }) },
      { name: 'offline', selector: '[data-offline]', load: () => Promise.reject(new Error('Offline')) }
    )
    const { initUiPrimitives } = await import('./runtime/loader.js')
    await expect(initUiPrimitives()).rejects.toBeInstanceOf(AggregateError)
    expect(init).toHaveBeenCalledTimes(1)
  })

  test.each(['click', 'keydown'])('replays a cold first %s once after the controller is ready', async type => {
    document.body.innerHTML = '<button data-control>Open</button>'
    const button = document.querySelector('button')

    if (!button) throw new Error('Missing test button')
    const request = deferredController()
    const action = vi.fn()
    let bound = false

    registry.features.push({ name: 'control', selector: '[data-control]', load: () => request.promise })
    const { installRuntime } = await import('./runtime/loader.js')

    installRuntime()
    const event = type === 'click' ?
      new MouseEvent('click', { bubbles: true, cancelable: true }) :
      new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true })

    button.dispatchEvent(event)
    expect(event.defaultPrevented).toBe(true)
    request.resolve({ init: () => {
      if (bound) return
      bound = true
      button.addEventListener(type, action)
    } })
    await vi.waitFor(() => {
      expect(action).toHaveBeenCalledTimes(1)
    })
  })

  test('leaves native input and link actions available during loading', async () => {
    document.body.innerHTML = '<div data-control><input><a href="#destination">Next</a></div>'
    const request = deferredController()

    registry.features.push({ name: 'control', selector: '[data-control]', load: () => request.promise })
    const { installRuntime } = await import('./runtime/loader.js')

    installRuntime()
    for (const element of document.querySelectorAll('input, a')) {
      const click = new MouseEvent('click', { bubbles: true, cancelable: true })

      element.dispatchEvent(click)
      expect(click.defaultPrevented).toBe(false)
    }
    request.resolve({ init: () => undefined })
    await Promise.resolve()
  })

  test('ignores stale loads and interactions after navigation and cleans initialized controllers', async () => {
    document.body.innerHTML = '<button data-control>Open</button>'
    const request = deferredController()
    const init = vi.fn()
    const cleanup = vi.fn()
    const action = vi.fn()
    const button = document.querySelector('button')

    if (!button) throw new Error('Missing test button')
    button.addEventListener('click', action)
    registry.features.push({ name: 'control', selector: '[data-control]', load: () => request.promise })
    const { installRuntime, initUiPrimitives } = await import('./runtime/loader.js')

    installRuntime()
    button.click()
    document.dispatchEvent(new Event('astro:before-swap'))
    request.resolve({ init, cleanup })
    await Promise.resolve()
    await Promise.resolve()
    await Promise.resolve()
    expect(init).not.toHaveBeenCalled()
    expect(action).not.toHaveBeenCalled()
    await initUiPrimitives()
    expect(init).toHaveBeenCalledTimes(1)
    document.dispatchEvent(new Event('astro:before-swap'))
    expect(cleanup).toHaveBeenCalledTimes(1)
  })
})
