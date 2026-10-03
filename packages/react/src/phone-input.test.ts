// @vitest-environment jsdom
import { act, createElement, createRef } from 'react'
import { createRoot, type Root } from 'react-dom/client'

import { createEmptyLumenPhoneNumber, getLumenPhoneCountry } from '@santi020k/lumen-core'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'

import { PhoneInput, PhoneNumber } from './components.js'

beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
})

let root: Root | undefined
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
  })
  root = undefined
  document.body.replaceChildren()
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
  })
  expect(select.value).toBe('CO')
  expect(input.value).toBe('(601) 5550123')
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
