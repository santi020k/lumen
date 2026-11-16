import { afterEach, beforeAll, expect, test, vi } from 'vitest'

import { defineLumenElements } from './index.js'

beforeAll(() => {
  defineLumenElements()
})

afterEach(() => {
  document.body.replaceChildren()
  document.documentElement.removeAttribute('data-theme')
  document.documentElement.classList.remove('dark')
  localStorage.clear()
  vi.useRealTimers()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

test('Rating and BackToTop do not duplicate click callbacks across 1/2/3 reconnects', () => {
  const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined)
  const backToTop = document.createElement('lumen-back-to-top')
  document.body.append(backToTop)
  for (let i = 0; i < 3; i += 1) {
    backToTop.remove()
    document.body.append(backToTop)
  }
  backToTop.click()
  expect(scrollTo).toHaveBeenCalledTimes(1)

  const rating = document.createElement('lumen-rating')
  rating.innerHTML = '<button type="button" class="ui-rating__star">1</button><button type="button" class="ui-rating__star">2</button>'
  let changes = 0
  rating.addEventListener('change', () => {
    changes += 1
  })
  document.body.append(rating)
  for (let i = 0; i < 3; i += 1) {
    rating.remove()
    document.body.append(rating)
  }
  rating.querySelectorAll<HTMLButtonElement>('.ui-rating__star')[1]?.click()
  expect(changes).toBe(1)
})

test('Select and DataTable ignore stale reset timers after disconnect, reconnect, or canceled reset', () => {
  vi.useFakeTimers()

  const form = document.createElement('form')
  form.innerHTML = `<lumen-select><select name="city"><option value="a" selected>A</option><option value="b">B</option></select></lumen-select>
    <lumen-data-table selectable><table><thead><tr><th>Name</th></tr></thead><tbody><tr><td>Row 1</td></tr></tbody></table></lumen-data-table>`
  document.body.append(form)

  const selectHost = form.querySelector('lumen-select')
  const nativeSelect = selectHost?.querySelector('select')
  const triggerText = selectHost?.querySelector('[data-ui-select-value]')
  const tableHost = form.querySelector('lumen-data-table')
  const rowCheckbox = tableHost?.querySelector<HTMLInputElement>('[data-ui-datatable-row-select]')
  if (!selectHost || !nativeSelect || !triggerText || !tableHost || !rowCheckbox) {
    throw new Error('Missing form fixture')
  }

  nativeSelect.value = 'b'
  nativeSelect.dispatchEvent(new Event('change', { bubbles: true }))
  rowCheckbox.checked = true
  rowCheckbox.dispatchEvent(new Event('change', { bubbles: true }))

  let tableSelectionEvents = 0
  tableHost.addEventListener('ui:data-table-selection-change', () => {
    tableSelectionEvents += 1
  })

  form.addEventListener('reset', event => {
    event.preventDefault()
  }, { once: true })
  form.reset()
  vi.runAllTimers()
  expect(triggerText.textContent).toBe('B')
  expect(tableSelectionEvents).toBe(0)

  form.reset()
  selectHost.remove()
  tableHost.remove()
  triggerText.textContent = 'detached-sentinel'
  vi.runAllTimers()
  expect(triggerText.textContent).toBe('detached-sentinel')
  expect(tableSelectionEvents).toBe(0)

  document.body.append(selectHost, tableHost)
  nativeSelect.value = 'b'
  nativeSelect.dispatchEvent(new Event('change', { bubbles: true }))
  form.reset()
  selectHost.remove()
  tableHost.remove()
  document.body.append(selectHost, tableHost)
  triggerText.textContent = 'reconnect-sentinel'
  vi.runAllTimers()
  expect(triggerText.textContent).toBe('reconnect-sentinel')
  expect(tableSelectionEvents).toBe(0)
})

test('ThemeToggle cleans up pending circular reveal on disconnect without affecting committed theme or next reveal', () => {
  vi.useFakeTimers()
  vi.stubGlobal('matchMedia', () => ({
    addEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
    matches: false,
    media: '',
    onchange: null,
    removeEventListener: vi.fn()
  }))

  let nextFrameId = 1
  const frames = new Map<number, FrameRequestCallback>()
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation(callback => {
    const id = nextFrameId++
    frames.set(id, callback)
    return id
  })
  const cancelAnimationFrameSpy = vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(id => {
    frames.delete(id)
  })

  const toggle = document.createElement('lumen-theme-toggle')
  document.body.append(toggle)
  toggle.click()

  expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
  expect(localStorage.getItem('theme')).toBe('dark')
  expect(document.body.querySelectorAll('div[aria-hidden="true"]')).toHaveLength(1)

  toggle.remove()
  expect(cancelAnimationFrameSpy).toHaveBeenCalledTimes(1)
  expect(document.body.querySelectorAll('div[aria-hidden="true"]')).toHaveLength(0)

  document.body.append(toggle)
  toggle.click()
  expect(document.documentElement.getAttribute('data-theme')).toBe('light')
  expect(document.body.querySelectorAll('div[aria-hidden="true"]')).toHaveLength(1)

  const pendingCallbacks = [...frames.values()]
  frames.clear()
  for (const callback of pendingCallbacks) callback(16)
  const secondFrameCallbacks = [...frames.values()]
  frames.clear()
  for (const callback of secondFrameCallbacks) callback(32)

  vi.advanceTimersByTime(750)
  expect(document.body.querySelectorAll('div[aria-hidden="true"]')).toHaveLength(0)

  const syncListener = () => {
    toggle.remove()
  }
  window.addEventListener('theme-change', syncListener, { once: true })
  toggle.click()
  expect(frames.size).toBe(0)
  expect(document.body.querySelectorAll('div[aria-hidden="true"]')).toHaveLength(0)

  document.body.append(toggle)
  toggle.click()
  expect(document.body.querySelectorAll('div[aria-hidden="true"]')).toHaveLength(1)
})

test.each(['open', 'closed'] as const)('Popover resolves aria-controls panel within %s shadow root, keeps inside clicks open, and dismisses outside', mode => {
  const outsidePanel = document.createElement('div')
  outsidePanel.id = 'popover-panel'
  outsidePanel.hidden = true
  document.body.append(outsidePanel)

  const host = document.createElement('div')
  const shadow = host.attachShadow({ mode })
  shadow.innerHTML = `<lumen-popover>
    <button type="button" data-ui-trigger aria-controls="popover-panel" aria-expanded="false">Open popover</button>
    <div id="popover-panel" hidden><button type="button" id="inside-item">Item</button></div>
  </lumen-popover>`
  document.body.append(host)

  const trigger = shadow.querySelector<HTMLButtonElement>('[data-ui-trigger]')
  const shadowPanel = shadow.querySelector<HTMLElement>('#popover-panel')
  const insideItem = shadow.querySelector<HTMLButtonElement>('#inside-item')
  if (!trigger || !shadowPanel || !insideItem) throw new Error('Missing shadow popover fixture')

  trigger.click()
  expect(trigger.getAttribute('aria-expanded')).toBe('true')
  expect(shadowPanel.hidden).toBe(false)
  expect(outsidePanel.hidden).toBe(true)

  insideItem.dispatchEvent(new Event('pointerdown', { bubbles: true, composed: true }))
  expect(trigger.getAttribute('aria-expanded')).toBe('true')
  expect(shadowPanel.hidden).toBe(false)

  document.body.dispatchEvent(new Event('pointerdown', { bubbles: true, composed: true }))
  expect(trigger.getAttribute('aria-expanded')).toBe('false')
  expect(shadowPanel.hidden).toBe(true)
})
