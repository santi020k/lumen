// @vitest-environment jsdom
import { afterEach, beforeAll, expect, test } from 'vitest'

import { defineLumenElements } from './index.js'

beforeAll(() => {
  defineLumenElements(['Select', 'Segmented'])
})
afterEach(() => {
  document.body.replaceChildren()
})

test('enhanced select keeps numeric size separate from dynamic visual-size', () => {
  document.body.innerHTML = '<lumen-select size="4" visual-size="sm"><option>One</option></lumen-select>'
  const host = document.querySelector('lumen-select')
  const select = host?.querySelector('select')
  const trigger = host?.querySelector('button[data-ui-select-trigger]')

  if (!host || !select || !trigger) throw new Error('Expected enhanced select')

  expect(select.size).toBe(4)
  expect(select.classList.contains('ui-select--sm')).toBe(true)
  expect(trigger.classList.contains('ui-select--sm')).toBe(true)
  host.setAttribute('visual-size', 'lg')
  expect(select.classList.contains('ui-select--sm')).toBe(false)
  expect(trigger.classList.contains('ui-select--lg')).toBe(true)
  host.setAttribute('size', '6')
  expect(select.size).toBe(6)
  host.removeAttribute('visual-size')
  expect(trigger.classList.contains('ui-select--lg')).toBe(false)
})

test('segmented visual-size switches its semantic control density', () => {
  const host = document.createElement('lumen-segmented')

  host.setAttribute('visual-size', 'sm')
  document.body.append(host)
  expect(host.classList.contains('ui-segmented--sm')).toBe(true)
  host.setAttribute('visual-size', 'lg')
  expect(host.classList.contains('ui-segmented--sm')).toBe(false)
  expect(host.classList.contains('ui-segmented--lg')).toBe(true)
})

test('enhanced select adopts a supplied native child with the same hidden fallback and density', () => {
  document.body.innerHTML = '<lumen-select visual-size="lg"><select size="4" aria-label="State"><option>One</option></select></lumen-select>'
  const select = document.querySelector('select')

  expect(select?.size).toBe(4)
  expect(select?.classList.contains('ui-select__native')).toBe(true)
  expect(select?.classList.contains('ui-select--lg')).toBe(true)
  expect(select?.dataset.uiEnhanced).toBe('true')
  expect(select?.getAttribute('aria-hidden')).toBe('true')
})
