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
