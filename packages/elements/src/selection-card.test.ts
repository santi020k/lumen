import { afterEach, beforeAll, expect, test } from 'vitest'

import { defineLumenCheckboxCard, defineLumenRadioCard } from './components/selection-card.js'

beforeAll(() => {
  defineLumenCheckboxCard()
  defineLumenRadioCard()
})

afterEach(() => {
  document.body.replaceChildren()
})

test('keeps the supplied checkbox and label as the native form control', () => {
  document.body.innerHTML = `<form><lumen-checkbox-card variant="soft"><label>
    <input type="checkbox" name="updates" value="product" required aria-labelledby="choice-label" aria-describedby="choice-description">
    <span data-slot="selection-card-content"><span id="choice-label" data-slot="selection-card-label">Product updates</span>
    <span id="choice-description" data-slot="selection-card-description">Monthly release notes</span></span>
  </label></lumen-checkbox-card></form>`
  const form = document.querySelector('form')
  const card = document.querySelector('lumen-checkbox-card')
  const input = document.querySelector('input')
  const label = document.querySelector('label')
  if (!form || !card || !input || !label) throw new Error('Missing checkbox fixture')

  expect(card.classList.contains('ui-selection-card--soft')).toBe(true)
  expect(input.labels?.[0]).toBe(label)
  expect(form.checkValidity()).toBe(false)
  label.click()
  expect(input.checked).toBe(true)
  expect(form.checkValidity()).toBe(true)
  expect(new FormData(form).get('updates')).toBe('product')
  card.setAttribute('variant', 'outline')
  expect(card.querySelector('input')).toBe(input)
  expect(input.checked).toBe(true)
  expect(card.classList.contains('ui-selection-card--soft')).toBe(false)
  form.reset()
  expect(input.checked).toBe(false)
})

test('preserves native radio exclusivity, form association and disabled validation', () => {
  document.body.innerHTML = `<form id="preferences"></form><fieldset><legend>Plan</legend>
    <lumen-radio-card><label><input type="radio" name="plan" value="personal" form="preferences" checked>Personal</label></lumen-radio-card>
    <lumen-radio-card><label><input type="radio" name="plan" value="team" form="preferences">Team</label></lumen-radio-card>
    <lumen-radio-card><label><input type="radio" name="plan" value="organization" form="preferences" disabled required>Organization</label></lumen-radio-card>
  </fieldset>`
  const [personal, team, organization] = document.querySelectorAll('input')
  const form = document.querySelector('form')
  if (!personal || !team || !organization || !form) throw new Error('Missing radio fixture')

  team.click()
  expect(team.checked).toBe(true)
  expect(personal.checked).toBe(false)
  expect(new FormData(form).getAll('plan')).toEqual(['team'])
  organization.click()
  expect(organization.checked).toBe(false)
  expect(team.checked).toBe(true)
  expect(form.checkValidity()).toBe(true)
  form.reset()
  expect(personal.checked).toBe(true)
  expect(team.checked).toBe(false)
})

test('does not clone children or lose form state when reconnected', () => {
  const card = document.createElement('lumen-checkbox-card')
  card.innerHTML = '<label><input type="checkbox" checked>Notifications</label>'
  document.body.append(card)
  const input = card.querySelector('input')
  if (!input) throw new Error('Missing checkbox')
  input.checked = false
  card.remove()
  document.body.append(card)
  expect(card.querySelectorAll('input')).toHaveLength(1)
  expect(card.querySelector('input')).toBe(input)
  expect(input.checked).toBe(false)
})
