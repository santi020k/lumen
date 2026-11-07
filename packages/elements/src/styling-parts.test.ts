// @vitest-environment jsdom
import { afterEach, expect, test, vi } from 'vitest'

import { defineLumenTimeline, LumenTimelineElement } from './components/timeline.js'
import { defineLumenElements } from './define.js'

afterEach(() => {
  document.body.replaceChildren()
  vi.unstubAllGlobals()
})

test('timeline compound parts preserve content, listeners, dot slots, and identity across registration', async () => {
  defineLumenTimeline()
  defineLumenElements(['Timeline'])
  expect(customElements.get('lumen-timeline')).toBe(LumenTimelineElement)
  const timeline = document.createElement('lumen-timeline')
  const item = document.createElement('li')
  const action = document.createElement('button')
  const handler = vi.fn()
  const dot = document.createElement('span')

  action.textContent = 'Read milestone'
  action.addEventListener('click', handler)
  dot.slot = 'dot'
  dot.textContent = '1'
  item.append(dot, action)
  timeline.append(item)
  document.body.append(timeline)
  expect(timeline.dataset.slot).toBe('timeline')
  expect(item.dataset.slot).toBe('timeline-item')
  expect(item.querySelector('[data-slot="timeline-item-content"]')?.firstChild).toBe(action)
  expect(dot.parentElement?.dataset.slot).toBe('timeline-item-dot')
  action.click()
  expect(handler).toHaveBeenCalledOnce()
  timeline.remove()
  document.body.append(timeline)
  expect(item.querySelectorAll('[data-slot="timeline-item-content"]')).toHaveLength(1)
  const later = document.createElement('li')

  later.textContent = 'Later milestone'
  timeline.append(later)
  await new Promise<void>(resolve => {
    queueMicrotask(resolve)
  })
  expect(later.querySelector('[data-slot="timeline-item-content"]')?.textContent).toBe('Later milestone')
})

test('the default theme toggle exposes decorative icon parts and an accessible name', () => {
  vi.stubGlobal('matchMedia', () => ({ matches: true }))
  defineLumenElements(['ThemeToggle'])
  const toggle = document.createElement('lumen-theme-toggle')

  document.body.append(toggle)
  expect(toggle.getAttribute('aria-label')).toBe('Toggle color theme')
  for (const name of ['sun', 'moon']) {
    expect(toggle.querySelector(`[data-slot="theme-toggle-${name}"]`)?.getAttribute('aria-hidden')).toBe('true')
  }
  toggle.remove()
  document.body.append(toggle)
  expect(toggle.querySelectorAll('[data-slot^="theme-toggle-"]')).toHaveLength(2)
  const changed = vi.fn()

  window.addEventListener('theme-change', changed)
  toggle.click()
  expect(changed).toHaveBeenCalledOnce()
  window.removeEventListener('theme-change', changed)
})
