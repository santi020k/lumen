import { afterEach, beforeAll, expect, test } from 'vitest'

import { defineLumenElements } from './index.js'

beforeAll(() => {
  defineLumenElements()
})

afterEach(() => {
  document.body.replaceChildren()
})

const getTab = (id: string): HTMLButtonElement => {
  const tab = document.getElementById(id)
  if (!(tab instanceof HTMLButtonElement)) throw new Error(`Expected tab ${id}`)
  return tab
}

test('keeps outer and nested Elements tab state independent', () => {
  document.body.innerHTML = `<lumen-tabs>
    <div role="tablist"><button role="tab" id="first" aria-controls="first-panel">First</button><button role="tab" id="second" aria-selected="true" aria-controls="second-panel">Second</button></div>
    <section role="tabpanel" id="first-panel">First panel</section>
    <section role="tabpanel" id="second-panel"><lumen-code-tabs>
      <div role="tablist"><button role="tab" id="nested" aria-selected="true" aria-controls="nested-panel">Nested</button></div>
      <section role="tabpanel" id="nested-panel">Nested panel</section>
    </lumen-code-tabs></section>
  </lumen-tabs>`
  getTab('second').focus()
  getTab('second').dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }))
  expect(document.activeElement).toBe(getTab('first'))
  expect(getTab('first').getAttribute('aria-selected')).toBe('true')
  expect(getTab('nested').getAttribute('aria-selected')).toBe('true')
  expect(document.getElementById('nested-panel')?.hidden).toBe(false)
})

test.each(['ArrowRight', 'End'])('skips disabled Elements tabs with %s', key => {
  document.body.innerHTML = `<lumen-tabs>
    <div role="tablist"><button role="tab" id="first" aria-selected="true" aria-controls="first-panel">First</button><button role="tab" id="disabled" disabled>Disabled</button><button role="tab" id="last" aria-controls="last-panel">Last</button><button role="tab" id="disabled-last" aria-disabled="true">Disabled last</button></div>
    <section role="tabpanel" id="first-panel">First panel</section><section role="tabpanel" id="last-panel">Last panel</section>
  </lumen-tabs>`
  getTab('first').focus()
  getTab('first').dispatchEvent(new KeyboardEvent('keydown', { key }))
  expect(document.activeElement).toBe(getTab('last'))
  expect(getTab('last').getAttribute('aria-selected')).toBe('true')
  expect(getTab('disabled').getAttribute('aria-selected')).toBe('false')
})

test('does not activate disabled, aria-disabled, or canceled-click tabs or emit ui:tabs-change', () => {
  document.body.innerHTML = `<lumen-tabs>
    <div role="tablist">
      <button role="tab" id="first" aria-selected="true" aria-controls="first-panel">First</button>
      <button role="tab" id="second" aria-selected="false" aria-controls="second-panel">Second</button>
      <button role="tab" id="aria-disabled" aria-selected="false" aria-disabled="true" aria-controls="aria-disabled-panel">Aria disabled</button>
      <button role="tab" id="native-disabled" aria-selected="false" disabled aria-controls="native-disabled-panel">Native disabled</button>
    </div>
    <section role="tabpanel" id="first-panel">First panel</section>
    <section role="tabpanel" id="second-panel" hidden>Second panel</section>
    <section role="tabpanel" id="aria-disabled-panel" hidden>Aria disabled panel</section>
    <section role="tabpanel" id="native-disabled-panel" hidden>Native disabled panel</section>
  </lumen-tabs>`

  const tabs = document.querySelector('lumen-tabs')
  if (!tabs) throw new Error('Expected tabs')
  const events: Event[] = []

  tabs.addEventListener('ui:tabs-change', event => {
    events.push(event)
  })

  tabs.addEventListener('click', event => {
    if (event.target === getTab('second')) event.preventDefault()
  }, { capture: true, once: true })

  getTab('second').click()
  getTab('aria-disabled').click()
  getTab('native-disabled').dispatchEvent(new MouseEvent('click', { bubbles: true }))

  expect(getTab('first').getAttribute('aria-selected')).toBe('true')
  expect(getTab('second').getAttribute('aria-selected')).toBe('false')
  expect(getTab('aria-disabled').getAttribute('aria-selected')).toBe('false')
  expect(getTab('native-disabled').getAttribute('aria-selected')).toBe('false')
  expect(document.getElementById('first-panel')?.hidden).toBe(false)
  expect(document.getElementById('second-panel')?.hidden).toBe(true)
  expect(document.getElementById('aria-disabled-panel')?.hidden).toBe(true)
  expect(events).toHaveLength(0)

  getTab('first').click()
  expect(events).toHaveLength(1)
})

test.each([
  { altKey: true },
  { ctrlKey: true },
  { metaKey: true },
  { isComposing: true }
])('tabs ignore modified or composing keydown %o', options => {
  document.body.innerHTML = `<lumen-tabs>
    <div role="tablist">
      <button role="tab" id="first" aria-selected="true" aria-controls="first-panel">First</button>
      <button role="tab" id="second" aria-controls="second-panel">Second</button>
    </div>
    <section role="tabpanel" id="first-panel">First panel</section>
    <section role="tabpanel" id="second-panel" hidden>Second panel</section>
  </lumen-tabs>`

  const first = getTab('first')
  first.focus()
  const event = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'ArrowRight', ...options })
  first.dispatchEvent(event)

  expect(event.defaultPrevented).toBe(false)
  expect(first.getAttribute('aria-selected')).toBe('true')
  expect(getTab('second').getAttribute('aria-selected')).toBe('false')
  expect(document.activeElement).toBe(first)
})

test('tabs ignore canceled keydown events', () => {
  document.body.innerHTML = `<lumen-tabs>
    <div role="tablist">
      <button role="tab" id="first" aria-selected="true" aria-controls="first-panel">First</button>
      <button role="tab" id="second" aria-controls="second-panel">Second</button>
    </div>
    <section role="tabpanel" id="first-panel">First panel</section>
    <section role="tabpanel" id="second-panel" hidden>Second panel</section>
  </lumen-tabs>`

  const first = getTab('first')
  first.focus()
  first.addEventListener('keydown', event => {
    event.preventDefault()
  }, { capture: true })

  first.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'ArrowRight' }))
  expect(first.getAttribute('aria-selected')).toBe('true')
  expect(getTab('second').getAttribute('aria-selected')).toBe('false')
})

test.each(['open', 'closed'] as const)('activates panels by aria-controls inside %s shadow roots without leaking to duplicate outside IDs', mode => {
  const outsidePanel = document.createElement('section')
  outsidePanel.id = 'panel-a'
  outsidePanel.hidden = false
  document.body.append(outsidePanel)

  const host = document.createElement('div')
  const shadow = host.attachShadow({ mode })
  shadow.innerHTML = `<lumen-tabs>
    <div role="tablist">
      <button role="tab" id="tab-a" aria-selected="true" aria-controls="panel-a">A</button>
      <button role="tab" id="tab-b" aria-selected="false" aria-controls="panel-b">B</button>
    </div>
    <section role="tabpanel" id="panel-a">Shadow A</section>
    <section role="tabpanel" id="panel-b" hidden>
      Shadow B
      <lumen-tabs>
        <div role="tablist">
          <button role="tab" id="nested-tab" aria-selected="true" aria-controls="panel-a">Nested</button>
        </div>
        <section role="tabpanel" id="panel-a">Nested A</section>
      </lumen-tabs>
    </section>
  </lumen-tabs>`
  document.body.append(host)

  const tabB = shadow.querySelector<HTMLButtonElement>('#tab-b')
  const shadowPanelA = shadow.querySelector<HTMLElement>('#panel-a')
  const shadowPanelB = shadow.querySelector<HTMLElement>('#panel-b')
  const nestedPanel = shadow.querySelector<HTMLElement>('lumen-tabs lumen-tabs #panel-a')
  if (!tabB || !shadowPanelA || !shadowPanelB || !nestedPanel) {
    throw new Error('Missing shadow tabs fixture')
  }

  tabB.click()
  expect(shadowPanelA.hidden).toBe(true)
  expect(shadowPanelB.hidden).toBe(false)
  expect(outsidePanel.hidden).toBe(false)
  expect(nestedPanel.hidden).toBe(false)
})
