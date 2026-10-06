// @vitest-environment jsdom
import { afterEach, expect, test, vi } from 'vitest'

import { animateLumenPresence } from './motion.js'

const createFixture = (reduced = false) => {
  const preference = Object.assign(new EventTarget(), { matches: reduced })
  vi.stubGlobal('matchMedia', vi.fn(() => preference))
  const element = document.createElement('div')
  document.body.append(element)
  let finish: (() => void) | undefined
  let fail: ((reason: unknown) => void) | undefined
  const animation = {
    cancel: vi.fn(() => {
      animation.playState = 'idle'
      fail?.(new DOMException('Cancelled', 'AbortError'))
    }),
    finished: new Promise<void>((resolve, reject) => {
      finish = resolve
      fail = reject
    }),
    playState: 'running'
  }
  const animate = vi.fn(() => animation)
  Object.defineProperty(element, 'animate', { configurable: true, value: animate })
  return {
    animate,
    animation,
    element,
    fail: (reason: unknown) => fail?.(reason),
    finish: () => finish?.(),
    preference
  }
}

afterEach(() => {
  vi.unstubAllGlobals()
  document.body.replaceChildren()
})

test('uses semantic timing and preserves the resting appearance', async () => {
  const fixture = createFixture()
  fixture.element.style.cssText = '--ui-duration-slow: .4s; opacity: .6; transform: rotate(5deg);'
  const result = animateLumenPresence(fixture.element, { duration: 'slow', preset: 'slide-up' })
  expect(fixture.animate).toHaveBeenCalledWith([
    { opacity: '0', transform: 'rotate(5deg) translateY(0.75rem)' },
    { opacity: '0.6', transform: 'rotate(5deg)' }
  ], expect.objectContaining({ duration: 400 }))
  fixture.finish()
  expect(await result).toBe('finished')
  expect(fixture.element.style.opacity).toBe('0.6')
})

test('reverses the preset for exits without owning DOM removal', async () => {
  const fixture = createFixture()
  const result = animateLumenPresence(fixture.element, { phase: 'exit', preset: 'scale' })
  expect(fixture.animate).toHaveBeenCalledWith([
    { opacity: '1', transform: 'none' },
    { opacity: '0', transform: 'scale(0.96)' }
  ], expect.objectContaining({ duration: 160 }))
  fixture.finish()
  expect(await result).toBe('finished')
  expect(fixture.element.isConnected).toBe(true)
})

test.each(['reduced', 'local', 'unsupported', 'detached', 'zero'] as const)(
  'skips animation for %s while leaving content intact', async mode => {
    const fixture = createFixture(mode === 'reduced')
    if (mode === 'local') fixture.element.dataset.uiMotion = 'reduce'
    if (mode === 'unsupported') Object.defineProperty(fixture.element, 'animate', { value: undefined })
    if (mode === 'detached') fixture.element.remove()
    if (mode === 'zero') fixture.element.style.setProperty('--ui-duration', '0ms')
    expect(await animateLumenPresence(fixture.element)).toBe('skipped')
    expect(fixture.animate).not.toHaveBeenCalled()
  }
)

test.each(['auto', '-2ms', 'NaNms', '12px'])(
  'falls back to tokens for an invalid CSS duration %s', async value => {
    const fixture = createFixture()
    fixture.element.style.setProperty('--ui-duration', value)
    const result = animateLumenPresence(fixture.element)
    expect(fixture.animate).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ duration: 160 }))
    fixture.finish()
    expect(await result).toBe('finished')
  }
)

test('supports cancellation without rejecting or leaving preference listeners', async () => {
  const fixture = createFixture()
  const controller = new AbortController()
  const result = animateLumenPresence(fixture.element, { signal: controller.signal })
  controller.abort()
  expect(await result).toBe('cancelled')
  expect(fixture.animation.cancel).toHaveBeenCalledTimes(1)
  fixture.preference.dispatchEvent(Object.assign(new Event('change'), { matches: true }))
  expect(fixture.animation.cancel).toHaveBeenCalledTimes(1)
})

test('an already aborted request does not interrupt the current animation', async () => {
  const fixture = createFixture()
  const first = animateLumenPresence(fixture.element)
  const controller = new AbortController()
  controller.abort()
  expect(await animateLumenPresence(fixture.element, { signal: controller.signal })).toBe('cancelled')
  expect(fixture.animation.cancel).not.toHaveBeenCalled()
  fixture.finish()
  expect(await first).toBe('finished')
})

test('reducing motion mid-animation settles immediately', async () => {
  const fixture = createFixture()
  const result = animateLumenPresence(fixture.element)
  fixture.preference.dispatchEvent(Object.assign(new Event('change'), { matches: true }))
  expect(await result).toBe('skipped')
})

test('a new request cancels the previous animation on the same element', async () => {
  const fixture = createFixture()
  const secondAnimation = createFixture()
  const first = animateLumenPresence(fixture.element)
  fixture.animate.mockReturnValueOnce(secondAnimation.animation)
  const second = animateLumenPresence(fixture.element, { phase: 'exit' })
  expect(await first).toBe('cancelled')
  secondAnimation.finish()
  expect(await second).toBe('finished')
})

test('handles adversarial-length timing input with a finite fallback', async () => {
  const fixture = createFixture()
  fixture.element.style.setProperty('--ui-duration', `${'9'.repeat(50_000)}ms`)
  const result = animateLumenPresence(fixture.element)
  expect(fixture.animate).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ duration: 160 }))
  fixture.finish()
  expect(await result).toBe('finished')
})

test('propagates unexpected failures so the application can report them', async () => {
  const fixture = createFixture()
  const error = new Error('Unexpected animation failure')
  const result = animateLumenPresence(fixture.element)
  fixture.fail(error)
  await expect(result).rejects.toBe(error)
})
