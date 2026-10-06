// @vitest-environment jsdom
import { afterEach, beforeEach, expect, test, vi } from 'vitest'

import { bindLumenMotionGroup, createLumenMotionGroupController, getLumenWorkflowTiming, runLumenViewTransition } from './motion-workflows.js'

const preference = {
  addEventListener: vi.fn(),
  addListener: vi.fn(),
  dispatchEvent: vi.fn(),
  matches: false,
  media: '(prefers-reduced-motion: reduce)',
  onchange: null,
  removeEventListener: vi.fn(),
  removeListener: vi.fn()
}
const animations: { cancel: ReturnType<typeof vi.fn>, finished: Promise<void>, finish: () => void }[] = []
const animate = vi.fn(() => {
  let finish = (): void => {
    throw new Error('Animation not initialized')
  }
  const finished = new Promise<void>(resolve => {
    finish = resolve
  })
  const animation = { cancel: vi.fn(), finish, finished }
  animations.push(animation)
  return animation
})

beforeEach(() => {
  preference.matches = false
  vi.stubGlobal('matchMedia', () => preference)
  Object.defineProperty(HTMLElement.prototype, 'animate', { configurable: true, value: animate })
  animations.length = 0
  animate.mockClear()
})

afterEach(() => {
  document.body.replaceChildren()
  Reflect.deleteProperty(HTMLElement.prototype, 'animate')
  Reflect.deleteProperty(document, 'startViewTransition')
  vi.unstubAllGlobals()
})

const fixture = (): HTMLDivElement => {
  const root = document.createElement('div')
  root.innerHTML = '<button data-ui-motion-key="one" id="one">One</button><button data-ui-motion-key="two">Two</button>'
  document.body.append(root)
  for (const child of root.querySelectorAll<HTMLElement>('button')) {
    vi.spyOn(child, 'getBoundingClientRect').mockImplementation(() => new DOMRect(0, [...root.children].indexOf(child) * 40, 100, 40))
  }
  return root
}

test('moves stable keyed nodes without replacing them or losing keyboard focus', () => {
  const root = fixture()
  const first = root.querySelector('button')
  if (!first) throw new Error('Expected first item')
  first.focus()
  const controller = createLumenMotionGroupController(root)
  controller.update(() => {
    root.append(first)
  })
  expect(document.activeElement).toBe(first)
  expect(root.lastElementChild).toBe(first)
  expect(animate).toHaveBeenCalledTimes(2)
  expect(animate).toHaveBeenCalledWith([{ translate: '0px -40px' }, { translate: '0px 0px' }], expect.objectContaining({ duration: 160 }))
  controller.destroy()
  expect(animations.every(animation => animation.cancel.mock.calls.length === 1)).toBe(true)
})

test('exiting ghosts are inert, hidden from assistive technology, and removed on completion', async () => {
  const root = fixture()
  const item = root.querySelector('button')
  if (!item) throw new Error('Expected item')
  item.innerHTML = '<input id="draft" name="draft" autofocus>'
  const controller = createLumenMotionGroupController(root)
  controller.update(() => {
    item.remove()
  })
  const ghost = root.querySelector<HTMLElement>('[data-ui-motion-ghost]')
  expect(ghost?.inert).toBe(true)
  expect(ghost?.getAttribute('aria-hidden')).toBe('true')
  expect(ghost?.querySelector('[id], [name], [autofocus]')).toBeNull()
  expect(ghost?.hasAttribute('id')).toBe(false)
  for (const animation of animations) animation.finish()
  await Promise.resolve()
  expect(root.querySelector('[data-ui-motion-ghost]')).toBeNull()
  controller.destroy()
})

test('reduced motion and missing animation support preserve the final DOM immediately', () => {
  const root = fixture()
  preference.matches = true
  const controller = createLumenMotionGroupController(root)
  controller.update(() => {
    root.replaceChildren(document.createElement('button'))
  })
  expect(animate).not.toHaveBeenCalled()
  expect(root.querySelector('[data-ui-motion-ghost]')).toBeNull()
  preference.matches = false
  Reflect.deleteProperty(HTMLElement.prototype, 'animate')
  controller.update(() => {
    root.replaceChildren()
  })
  expect(root.children).toHaveLength(0)
  controller.destroy()
})

test('duplicate identities skip ambiguous animation and application exceptions still propagate', () => {
  const root = fixture()
  const items = [...root.querySelectorAll<HTMLElement>('button')]
  for (const item of items) item.dataset.uiMotionKey = 'duplicate'
  const controller = createLumenMotionGroupController(root)
  expect(() => {
    controller.update(() => {
      root.replaceChildren()
      throw new Error('Application update failed')
    })
  }).toThrow('Application update failed')
  expect(animate).not.toHaveBeenCalled()
  controller.destroy()
})

test('observed child changes animate once and internal ghosts do not cancel their own exits', async () => {
  const root = fixture()
  const cleanup = bindLumenMotionGroup(root)
  root.firstElementChild?.remove()
  await Promise.resolve()
  await Promise.resolve()
  expect(animations).toHaveLength(2)
  expect(animations.every(animation => animation.cancel.mock.calls.length === 0)).toBe(true)
  cleanup()
  expect(root.querySelector('[data-ui-motion-ghost]')).toBeNull()
  root.replaceChildren()
  await Promise.resolve()
  expect(animations).toHaveLength(2)
})

test('duration tokens accept milliseconds, seconds and zero while rejecting invalid values', () => {
  const root = fixture()
  root.style.setProperty('--ui-duration', '.25s')
  expect(getLumenWorkflowTiming(root).duration).toBe(250)
  root.style.setProperty('--ui-duration', '0ms')
  expect(getLumenWorkflowTiming(root).duration).toBe(0)
  root.style.setProperty('--ui-duration', '-1ms')
  expect(getLumenWorkflowTiming(root).duration).toBe(160)
  root.style.setProperty('--ui-duration', '200')
  expect(getLumenWorkflowTiming(root).duration).toBe(160)
})

test('view changes execute once when unsupported, reduced, or synchronously rejected', async () => {
  const update = vi.fn()
  await runLumenViewTransition(document, update)
  expect(update).toHaveBeenCalledTimes(1)
  Object.defineProperty(document, 'startViewTransition', { configurable: true,
    value: () => {
      throw new Error('Unavailable')
    } })
  await runLumenViewTransition(document, update)
  expect(update).toHaveBeenCalledTimes(2)
  preference.matches = true
  await runLumenViewTransition(document, update)
  expect(update).toHaveBeenCalledTimes(3)
})

test('view transition rendering failure preserves successful updates and application errors propagate', async () => {
  Object.defineProperty(document, 'startViewTransition', {
    configurable: true,
    value: (update: () => Promise<void>) => ({
      finished: Promise.reject(new Error('Animation canceled')),
      ready: Promise.reject(new Error('Duplicate transition names')),
      updateCallbackDone: update()
    })
  })
  const update = vi.fn()
  await runLumenViewTransition(document, update)
  expect(update).toHaveBeenCalledTimes(1)
  await expect(runLumenViewTransition(document, () => {
    throw new Error('Application error')
  })).rejects.toThrow('Application error')
})
