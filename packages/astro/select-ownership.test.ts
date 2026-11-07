// @vitest-environment jsdom
import { afterEach, expect, test } from 'vitest'

import { closeSelect, initSelects } from './runtime/features/select.js'

afterEach(() => {
  document.body.replaceChildren()
})

test.each(['react', 'elements'])('Select enhancement leaves %s owned controls intact beside an Astro select', owner => {
  const markup = '<select data-ui-select-native><option value="mesh">mesh</option><option value="aurora">aurora</option></select>' +
    '<div data-ui-select-control hidden><button data-ui-select-trigger type="button" aria-expanded="true"><span data-ui-select-value>mesh</span></button>' +
    '<div data-ui-select-list><button role="option" data-ui-select-option="true">Owned option</button></div></div>'
  document.body.innerHTML = `<div id="owned" data-ui-select data-ui-owner="${owner}">${markup}</div><div id="astro" data-ui-select>${markup}</div>`
  const owned = document.querySelector<HTMLElement>('#owned')
  const astro = document.querySelector<HTMLElement>('#astro')
  const option = owned?.querySelector('[role="option"]')

  if (!owned || !astro || !option) throw new Error('Missing select ownership fixture')

  initSelects(document)
  initSelects(document)
  closeSelect(owned)
  expect(owned.hasAttribute('data-ui-bound')).toBe(false)
  expect(owned.querySelector('[role="option"]')).toBe(option)
  expect(owned.querySelector('[data-ui-select-trigger]')?.getAttribute('aria-expanded')).toBe('true')
  expect(astro.dataset.uiBound).toBe('true')
  expect(astro.querySelectorAll('[role="option"]')).toHaveLength(2)
  closeSelect(astro)
  expect(astro.querySelector('[data-ui-select-trigger]')?.getAttribute('aria-expanded')).toBe('false')
})
