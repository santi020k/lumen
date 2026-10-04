// @vitest-environment jsdom
import type { SyntheticEvent } from 'react'
import { act, createElement, createRef } from 'react'
import { createRoot, type Root } from 'react-dom/client'

import { createEmptyLumenPhoneNumber, getLumenPhoneCountry, getLumenPhoneFlagSource } from '@santi020k/lumen-core'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'

import { PhoneInput, PhoneNumber } from './components.js'

beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
})

let root: Root | undefined
const mounted: Root[] = []
const country = getLumenPhoneCountry('CO')
if (!country) throw new Error('Missing phone fixture country')

const mount = async (props: Parameters<typeof PhoneInput>[0]) => {
  const container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
  await act(async () => {
    await Promise.resolve()
    root?.render(createElement('form', null, createElement(PhoneInput, props)))
  })
  const input = container.querySelector('input')
  const select = container.querySelector('select')
  if (!input || !select) throw new Error('Missing phone controls')
  return { container, input, select }
}

afterEach(async () => {
  await act(async () => {
    await Promise.resolve()
    root?.unmount()

    for (const extraRoot of mounted.splice(0)) extraRoot.unmount()
  })
  root = undefined
  document.body.replaceChildren()
  vi.useRealTimers()
})

test('associates labels, input attributes and refs without DOM patches', async () => {
  const ref = createRef<HTMLInputElement>()
  const { input } = await mount({ id: 'contact-phone', required: true, inputRef: ref, inputProps: { maxLength: 30, 'aria-describedby': 'phone-hint' } })
  expect(input.id).toBe('contact-phone')
  expect(input.required).toBe(true)
  expect(input.maxLength).toBe(30)
  expect(input.getAttribute('aria-describedby')).toBe('phone-hint')
  expect(ref.current).toBe(input)
})

test.each([{ disabled: true }, { readOnly: true }, { inputProps: { disabled: true } }, { inputProps: { readOnly: true } }])('locks both controls for %j', async props => {
  const { input, select } = await mount(props)
  expect(select.disabled).toBe(true)
  expect(input.disabled || input.readOnly).toBe(true)
})

test('keeps controlled country and bundled flag in sync', async () => {
  const us = getLumenPhoneCountry('US')
  if (!us) throw new Error('Missing US fixture')
  const { container, select } = await mount({ value: createEmptyLumenPhoneNumber(us), defaultCountryValue: 'CO' })
  expect(select.value).toBe('US')
  const flag = container.querySelector('img')
  const initialSource = flag?.src
  expect(initialSource).toMatch(/^data:image\/png;base64,/)
  expect(container.querySelector('.ui-phone-input__selection')?.textContent).toBe('+1')
  await act(async () => {
    await Promise.resolve()
    root?.render(createElement('form', null, createElement(PhoneInput, { value: createEmptyLumenPhoneNumber(country) })))
  })
  expect(container.querySelector('.ui-phone-input__selection')?.textContent).toBe('+57')
  expect(container.querySelector('img')?.src).not.toBe(initialSource)
})

test('keeps errors scoped to each instance and clears validity when corrected', async () => {
  const { container, input } = await mount({ defaultCountryValue: 'CO', defaultValue: '3', inputProps: { 'aria-describedby': 'hint' } })
  const error = container.querySelector('[role="alert"]')
  expect(error?.id).toBe(input.getAttribute('aria-errormessage'))
  expect(input.getAttribute('aria-describedby')).toContain('hint')
  expect(input.validity.customError).toBe(true)
  await act(async () => {
    await Promise.resolve()
    root?.render(createElement('form', null, createElement(PhoneInput, { value: { country, e164: '+576015550123', isValid: true, nationalNumber: '(601) 5550123' } })))
  })
  expect(input.getAttribute('aria-invalid')).toBeNull()
  expect(input.validity.customError).toBe(false)
  expect(container.querySelector('[role="alert"]')).toBeNull()
})

test('restores the initial country and number on form reset', async () => {
  const { container, select, input } = await mount({ defaultCountryValue: 'CO', defaultValue: '6015550123' })
  await act(async () => {
    await Promise.resolve()
    select.value = 'US'
    select.dispatchEvent(new Event('change', { bubbles: true }))
  })
  expect(select.value).toBe('US')
  await act(async () => {
    await Promise.resolve()
    container.querySelector('form')?.reset()
    await new Promise(resolve => setTimeout(resolve, 0))
  })
  expect(select.value).toBe('CO')
  expect(input.value).toBe('(601) 5550123')
})

test('honors a cancelled reset and keeps the edited uncontrolled phone number', async () => {
  const container = document.createElement('div')

  document.body.append(container)
  const localRoot = createRoot(container)

  mounted.push(localRoot)
  const cancelReset = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault()
  }

  await act(async () => {
    await Promise.resolve()
    localRoot.render(createElement('form', { onReset: cancelReset }, createElement(PhoneInput, { defaultCountryValue: 'CO', defaultValue: '6015550123' })))
  })
  const form = container.querySelector('form')
  const select = container.querySelector('select')

  if (!form || !select) throw new Error('Missing phone controls')
  await act(async () => {
    await Promise.resolve()
    select.value = 'US'
    select.dispatchEvent(new Event('change', { bubbles: true }))
  })
  expect(select.value).toBe('US')
  await act(async () => {
    await Promise.resolve()
    form.reset()
    await new Promise(resolve => setTimeout(resolve, 0))
  })
  expect(select.value).toBe('US')
})

test('preserves a controlled phone value and skips onValueChange when the form resets', async () => {
  const container = document.createElement('div')

  document.body.append(container)
  const localRoot = createRoot(container)

  mounted.push(localRoot)
  const controlledValue = { country, e164: '+576015550123', isValid: true, nationalNumber: '(601) 5550123' }
  const onValueChange = vi.fn<NonNullable<Parameters<typeof PhoneInput>[0]['onValueChange']>>()

  await act(async () => {
    await Promise.resolve()
    localRoot.render(createElement('form', null, createElement(PhoneInput, { value: controlledValue, onValueChange })))
  })
  const form = container.querySelector('form')
  const input = container.querySelector('input')
  const select = container.querySelector('select')

  if (!form || !input || !select) throw new Error('Missing phone controls')
  await act(async () => {
    await Promise.resolve()
    form.reset()
    await new Promise(resolve => setTimeout(resolve, 0))
  })
  expect(input.value).toBe('(601) 5550123')
  expect(select.value).toBe('CO')
  expect(onValueChange).not.toHaveBeenCalled()
})

test('ignores a pending reset once the number control disconnects before the timer fires', async () => {
  const { container, select, input } = await mount({ defaultCountryValue: 'CO', defaultValue: '6015550123' })
  await act(async () => {
    await Promise.resolve()
    select.value = 'US'
    select.dispatchEvent(new Event('change', { bubbles: true }))
  })
  expect(select.value).toBe('US')
  await act(async () => {
    await Promise.resolve()
    container.querySelector('form')?.reset()
    input.remove()
    await new Promise(resolve => setTimeout(resolve, 0))
  })
  // The browser's native reset mutates the disconnected select's DOM value directly; that is a
  // browser effect, not a React state update, so assert the React-owned presentation instead.
  expect(container.querySelector('.ui-phone-input__selection')?.textContent).toBe('+1')
  expect(container.querySelector('img')?.src).toBe(getLumenPhoneFlagSource('US'))
})

test('clears a pending phone reset timer when the control unmounts', async () => {
  vi.useFakeTimers()
  const { container } = await mount({ defaultCountryValue: 'CO', defaultValue: '6015550123' })
  const form = container.querySelector('form')

  if (!form) throw new Error('Missing phone form')

  act(() => {
    form.reset()
  })
  expect(vi.getTimerCount()).toBe(1)
  act(() => {
    root?.unmount()
  })
  root = undefined
  expect(vi.getTimerCount()).toBe(0)
  expect(container.childNodes).toHaveLength(0)
})

test('only valid read-only numbers become telephone links', async () => {
  const { container } = await mount({})
  await act(async () => {
    await Promise.resolve()
    root?.render(createElement(PhoneNumber, { value: createEmptyLumenPhoneNumber(country), link: true }))
  })
  expect(container.querySelector('a')).toBeNull()
  await act(async () => {
    await Promise.resolve()
    root?.render(createElement(PhoneNumber, { value: { country, nationalNumber: '(601) 5550123', e164: '+576015550123', isValid: true }, link: true }))
  })
  expect(container.querySelector('a')?.href).toBe('tel:+576015550123')
})

test('read-only values retain their country in native form submission', async () => {
  const { container } = await mount({ readOnly: true, defaultCountryValue: 'CO', defaultValue: '6015550123' })
  const form = container.querySelector('form')
  if (!form) throw new Error('Missing phone form')
  const data = new FormData(form)
  expect(data.get('country')).toBe('CO')
  expect(data.get('phone')).toBe('(601) 5550123')
})

test.each([false, true])('submits number and country to an external form with readOnly=%s', async readOnly => {
  const form = document.createElement('form')
  form.id = 'external-phone-form'
  const container = document.createElement('div')
  document.body.append(form, container)
  const extraRoot = createRoot(container)
  mounted.push(extraRoot)
  const props = {
    defaultCountryValue: 'CO',
    defaultValue: '6015550123',
    readOnly,
    inputProps: { form: form.id }
  }
  await act(async () => {
    await Promise.resolve()
    extraRoot.render(createElement(PhoneInput, props))
  })
  expect(new FormData(form).get('country')).toBe('CO')
  expect(new FormData(form).get('phone')).toBe('(601) 5550123')
  await act(async () => {
    await Promise.resolve()
    extraRoot.render(createElement(PhoneInput, { ...props, disabled: true }))
  })
  expect([...new FormData(form).entries()]).toEqual([])
})

test('associates the legacy country picker with the number external form', async () => {
  const form = document.createElement('form')
  form.id = 'legacy-phone-form'
  const container = document.createElement('div')
  document.body.append(form, container)
  const extraRoot = createRoot(container)
  mounted.push(extraRoot)
  await act(async () => {
    await Promise.resolve()
    extraRoot.render(createElement(PhoneInput, {
      countries: [{ value: 'CO', label: 'Colombia' }],
      defaultCountryValue: 'CO',
      defaultValue: '6015550123',
      inputProps: { form: form.id }
    }))
  })
  expect(new FormData(form).get('country')).toBe('CO')
  expect(new FormData(form).get('phone')).toBe('6015550123')
})
