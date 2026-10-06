// @vitest-environment jsdom
import { EventType, type RiveParameters } from '@rive-app/canvas'
import { afterEach, expect, test, vi } from 'vitest'

import { createLumenRiveController, type LumenRiveRuntime } from './rive.js'

const fixture = () => {
  const canvas = document.createElement('canvas')
  document.body.append(canvas)
  const number = { value: 0 }
  const boolean = { value: false }
  const string = { value: '' }
  const trigger = { trigger: vi.fn() }
  const runtime: LumenRiveRuntime = {
    cleanup: vi.fn(),
    pause: vi.fn(),
    play: vi.fn(),
    resizeDrawingSurfaceToCanvas: vi.fn(),
    viewModelInstance: {
      number: path => path === 'progress' ? number : null,
      boolean: path => path === 'enabled' ? boolean : null,
      string: path => path === 'label' ? string : null,
      trigger: path => path === 'confirm' ? trigger : null
    }
  }
  let parameters: RiveParameters | undefined
  const controller = createLumenRiveController({ canvas,
    src: '/owned.riv',
    stateMachine: 'Main',
    autoplay: true,
    createRuntime: value => {
      parameters = value
      return runtime
    } })
  return { canvas, controller, runtime, number, boolean, string, trigger, parameters }
}

afterEach(() => {
  document.body.replaceChildren()
  vi.unstubAllGlobals()
})

const media = () => {
  vi.stubGlobal('matchMedia', () => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }))
}

test('Rive waits for load, binds typed properties, respects local reduced motion and cleans up once', async () => {
  media()
  const fixtureValue = fixture()
  const { controller, runtime, parameters, canvas, number, boolean, string, trigger } = fixtureValue
  expect(parameters?.autoBind).toBe(true)
  expect(parameters?.autoplay).toBe(false)
  expect(controller.setValue('progress', 0.5)).toBe(false)
  parameters?.onLoad?.({ type: EventType.Load })
  await Promise.resolve()
  expect(runtime.play).toHaveBeenCalledWith('Main')
  expect(controller.setValue('progress', 0.5)).toBe(true)
  expect(number.value).toBe(0.5)
  expect(controller.setValue('enabled', true)).toBe(true)
  expect(boolean.value).toBe(true)
  expect(controller.setValue('label', 'Ready')).toBe(true)
  expect(string.value).toBe('Ready')
  expect(controller.setValue('missing', 1)).toBe(false)
  expect(controller.setValue('progress', Number.NaN)).toBe(false)
  expect(controller.trigger('confirm')).toBe(true)
  expect(trigger.trigger).toHaveBeenCalledTimes(1)
  canvas.dataset.uiMotion = 'reduce'
  await Promise.resolve()
  expect(runtime.pause).toHaveBeenCalledWith('Main')
  expect(controller.play()).toBe(false)
  expect(controller.trigger('confirm')).toBe(false)
  controller.destroy()
  controller.destroy()
  expect(runtime.cleanup).toHaveBeenCalledTimes(1)
  expect(controller.setValue('progress', 1)).toBe(false)
})

test('late loads and failed construction cannot start a disposed animation', async () => {
  media()
  const { controller, parameters, runtime } = fixture()
  controller.destroy()
  parameters?.onLoad?.({ type: EventType.Load })
  await Promise.resolve()
  expect(runtime.play).not.toHaveBeenCalled()
  const status = vi.fn()
  const failed = createLumenRiveController({ canvas: document.createElement('canvas'),
    src: '/missing.riv',
    stateMachine: 'Main',
    onStatus: status,
    createRuntime: () => {
      throw new Error('Unavailable')
    } })
  expect(status).toHaveBeenLastCalledWith('error')
  expect(failed.play()).toBe(false)
  failed.destroy()
})
