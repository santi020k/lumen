// @vitest-environment jsdom
import { afterEach, expect, test, vi } from 'vitest'

import { initRovingGroups } from './runtime/features/roving.js'

const required = <T extends HTMLElement>(element: T | null): T => {
  if (!element) throw new Error('Missing roving group fixture')

  return element
}

const input = (id: string): HTMLInputElement => required(document.querySelector<HTMLInputElement>(`#${id}`))
const element = (id: string): HTMLElement => required(document.querySelector<HTMLElement>(`#${id}`))
const press = (target: HTMLElement, key: string): KeyboardEvent => {
  const event = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key })

  target.dispatchEvent(event)

  return event
}

afterEach(() => {
  document.body.replaceChildren()
})

test('radio navigation skips disabled endpoints and options while preserving form values and bubbling events', () => {
  document.body.innerHTML = `<form><fieldset data-ui-radio-group>
    <input disabled id="first" name="plan" type="radio" value="first">
    <input checked id="personal" name="plan" type="radio" value="personal">
    <input aria-disabled="true" id="unavailable" name="plan" type="radio" value="unavailable">
    <input id="team" name="plan" type="radio" value="team">
    <input disabled id="organization" name="plan" type="radio" value="organization">
  </fieldset></form>`
  const form = required(document.querySelector('form'))
  const onInput = vi.fn<(event: Event) => void>()
  const onChange = vi.fn<(event: Event) => void>()

  form.addEventListener('input', onInput)
  form.addEventListener('change', onChange)
  initRovingGroups(document)
  expect(input('first').tabIndex).toBe(-1)
  expect(input('personal').tabIndex).toBe(0)
  expect(onInput).not.toHaveBeenCalled()
  expect(onChange).not.toHaveBeenCalled()
  input('personal').focus()

  const steps = [
    ['ArrowRight', 'team'],
    ['ArrowRight', 'personal'],
    ['ArrowLeft', 'team'],
    ['ArrowUp', 'personal'],
    ['ArrowDown', 'team'],
    ['Home', 'personal'],
    ['End', 'team']
  ] as const
  let current = input('personal')

  for (const [index, [key, id]] of steps.entries()) {
    expect(press(current, key).defaultPrevented).toBe(true)
    current = input(id)
    expect(document.activeElement).toBe(current)
    expect(current.tabIndex).toBe(0)
    expect(current.checked).toBe(true)
    expect(new FormData(form).get('plan')).toBe(id)
    expect(onInput).toHaveBeenCalledTimes(index + 1)
    expect(onChange).toHaveBeenCalledTimes(index + 1)
    expect(onInput).toHaveBeenLastCalledWith(expect.objectContaining({ target: current }))
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ target: current }))
    for (const blocked of ['first', 'unavailable', 'organization']) {
      expect(input(blocked).checked).toBe(false)
      expect(input(blocked).tabIndex).toBe(-1)
    }
  }
})

test('radio navigation rechecks disabled destinations and the focused source', () => {
  document.body.innerHTML = `<form><fieldset data-ui-radio-group>
    <input checked id="first" name="plan" type="radio" value="first">
    <input id="second" name="plan" type="radio" value="second">
    <input disabled id="third" name="plan" type="radio" value="third">
  </fieldset></form>`
  const form = required(document.querySelector('form'))
  const onChange = vi.fn<(event: Event) => void>()

  form.addEventListener('change', onChange)
  initRovingGroups(document)
  input('first').focus()
  input('second').disabled = true
  input('third').disabled = false
  press(input('first'), 'ArrowRight')
  expect(document.activeElement).toBe(input('third'))
  expect(new FormData(form).get('plan')).toBe('third')

  input('third').setAttribute('aria-disabled', 'true')
  input('second').disabled = false
  press(input('third'), 'ArrowLeft')
  expect(document.activeElement).toBe(input('second'))
  expect(new FormData(form).get('plan')).toBe('second')
  expect(onChange).toHaveBeenCalledTimes(2)

  for (const radio of form.querySelectorAll('input')) radio.disabled = true
  press(input('second'), 'End')
  expect(input('second').checked).toBe(true)
  expect(new FormData(form).get('plan')).toBeNull()
  expect(onChange).toHaveBeenCalledTimes(2)
  expect([...form.querySelectorAll('input')].filter(radio => radio.tabIndex === 0 && !radio.matches(':disabled'))).toEqual([])
  expect(input('second').tabIndex).toBe(0)

  input('first').disabled = false
  press(input('second'), 'Home')
  expect(document.activeElement).toBe(input('first'))
  expect(new FormData(form).get('plan')).toBe('first')
  expect(onChange).toHaveBeenCalledTimes(3)
})

test('native fieldset disabling respects its first legend controls', () => {
  document.body.innerHTML = `<form><div data-ui-radio-group>
    <fieldset disabled id="inherited-group">
      <legend><input id="legend" name="plan" type="radio" value="legend"></legend>
      <input id="inherited" name="plan" type="radio" value="inherited">
    </fieldset>
    <input checked id="outside" name="plan" type="radio" value="outside">
  </div></form>`
  const form = required(document.querySelector('form'))
  const inheritedGroup = required(document.querySelector('fieldset'))

  initRovingGroups(document)
  expect(input('legend').tabIndex).toBe(0)
  expect(input('inherited').disabled).toBe(false)
  expect(input('inherited').matches(':disabled')).toBe(true)
  input('outside').focus()
  press(input('outside'), 'ArrowLeft')
  expect(document.activeElement).toBe(input('legend'))
  expect(new FormData(form).get('plan')).toBe('legend')
  press(input('legend'), 'ArrowRight')
  expect(document.activeElement).toBe(input('outside'))
  expect(input('inherited').checked).toBe(false)

  inheritedGroup.disabled = false
  press(input('outside'), 'ArrowLeft')
  expect(document.activeElement).toBe(input('inherited'))
  expect(new FormData(form).get('plan')).toBe('inherited')
})

test('an entirely disabled native group has no tab stop or selection events and can be enabled later', () => {
  document.body.innerHTML = `<form><fieldset data-ui-radio-group disabled>
    <input checked id="first" name="plan" type="radio" value="first">
    <input id="second" name="plan" type="radio" value="second">
  </fieldset></form>`
  const form = required(document.querySelector('form'))
  const group = required(document.querySelector('fieldset'))
  const onInput = vi.fn<(event: Event) => void>()
  const onChange = vi.fn<(event: Event) => void>()

  form.addEventListener('input', onInput)
  form.addEventListener('change', onChange)
  initRovingGroups(document)
  expect([...form.querySelectorAll('input')].filter(radio => radio.tabIndex === 0 && !radio.matches(':disabled'))).toEqual([])
  for (const key of ['Home', 'End', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown']) press(input('first'), key)
  expect(input('first').checked).toBe(true)
  expect(input('second').checked).toBe(false)
  expect(onInput).not.toHaveBeenCalled()
  expect(onChange).not.toHaveBeenCalled()

  group.disabled = false
  // Availability changes restore the entry point before any navigation event.
  expect(input('first').tabIndex).toBe(0)
  expect([...form.querySelectorAll('input')].filter(radio => radio.tabIndex === 0 && !radio.matches(':disabled')))
    .toEqual([input('first')])
  expect(onInput).not.toHaveBeenCalled()
  expect(onChange).not.toHaveBeenCalled()
  press(input('first'), 'End')
  expect(document.activeElement).toBe(input('second'))
  expect(new FormData(form).get('plan')).toBe('second')
  expect(onInput).toHaveBeenCalledOnce()
  expect(onChange).toHaveBeenCalledOnce()
})

test('ARIA radios skip disabled roles and native buttons while retaining their change event contract', () => {
  document.body.innerHTML = `<div data-ui-radio-group id="roles">
    <span aria-checked="false" aria-disabled="true" id="blocked" role="radio">Unavailable</span>
    <span aria-checked="true" id="first" role="radio">Personal</span>
    <button aria-checked="false" disabled id="second" role="radio" type="button">Team</button>
    <span aria-checked="false" id="third" role="radio">Organization</span>
  </div>`
  const onInput = vi.fn<(event: Event) => void>()
  const onChange = vi.fn<(event: Event) => void>()

  element('roles').addEventListener('input', onInput)
  element('roles').addEventListener('change', onChange)
  initRovingGroups(document)
  expect(element('blocked').tabIndex).toBe(-1)
  expect(element('first').tabIndex).toBe(0)
  element('first').focus()
  press(element('first'), 'ArrowRight')
  expect(document.activeElement).toBe(element('third'))
  expect(element('third').getAttribute('aria-checked')).toBe('true')
  expect(element('first').getAttribute('aria-checked')).toBe('false')
  expect(element('second').getAttribute('aria-checked')).toBe('false')

  element('third').setAttribute('aria-disabled', 'true')
  element('second').removeAttribute('disabled')
  press(element('third'), 'ArrowLeft')
  expect(document.activeElement).toBe(element('second'))
  expect(element('second').getAttribute('aria-checked')).toBe('true')
  expect(onChange).toHaveBeenCalledTimes(2)
  expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ target: element('second') }))
  expect(onInput).not.toHaveBeenCalled()
})

test.each(['toolbar', 'menubar', 'toggle-group'])('%s preserves focus-only navigation through eligible buttons and links', kind => {
  document.body.innerHTML = `<div data-ui-${kind}>
    <button disabled id="blocked" type="button">Unavailable</button>
    <button id="first" type="button">First</button>
    <span aria-disabled="true" id="blocked-role" role="menuitem">Unavailable action</span>
    <a href="#last" id="last">Last</a>
    <button disabled id="blocked-end" type="button">Unavailable end</button>
  </div>`
  const group = required(document.querySelector('div'))
  const onClick = vi.fn<(event: Event) => void>()
  const onChange = vi.fn<(event: Event) => void>()

  group.addEventListener('click', onClick)
  group.addEventListener('change', onChange)
  initRovingGroups(document)
  expect(element('blocked').tabIndex).toBe(-1)
  expect(element('first').tabIndex).toBe(0)
  element('first').focus()
  press(element('first'), 'End')
  expect(document.activeElement).toBe(element('last'))
  press(element('last'), 'ArrowRight')
  expect(document.activeElement).toBe(element('first'))
  press(element('first'), 'ArrowLeft')
  expect(document.activeElement).toBe(element('last'))
  press(element('last'), 'Home')
  expect(document.activeElement).toBe(element('first'))
  expect(press(element('first'), 'Escape').defaultPrevented).toBe(false)
  expect(onClick).not.toHaveBeenCalled()
  expect(onChange).not.toHaveBeenCalled()
})

test('RTL radio arrows retain their direction while skipping disabled choices', () => {
  document.body.innerHTML = `<fieldset data-ui-radio-group dir="rtl">
    <input checked id="first" name="plan" type="radio">
    <input disabled id="blocked" name="plan" type="radio">
    <input id="second" name="plan" type="radio">
    <input id="last" name="plan" type="radio">
  </fieldset>`
  initRovingGroups(document)
  input('first').focus()
  press(input('first'), 'ArrowRight')
  expect(document.activeElement).toBe(input('last'))
  press(input('last'), 'ArrowLeft')
  expect(document.activeElement).toBe(input('first'))
  press(input('first'), 'ArrowLeft')
  expect(document.activeElement).toBe(input('second'))
  expect(input('blocked').checked).toBe(false)
})
