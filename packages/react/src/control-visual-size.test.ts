// @vitest-environment jsdom
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

import { expect, test } from 'vitest'

import { Input, NativeSelect, PhoneInput, Segmented, Select } from './components.js'

const requireElement = <T extends Element>(element: T | null): T => {
  if (!element) throw new Error('Expected sized form control')

  return element
}

test('visualSize applies consistently while native numeric size stays on input and select', () => {
  const root = document.createElement('div')

  root.innerHTML = renderToStaticMarkup(createElement('div', null, createElement(Input, { size: 12, visualSize: 'sm' }), createElement(NativeSelect, { size: 4, visualSize: 'lg' }, createElement('option', null, 'One')), createElement(Select, { size: 6, visualSize: 'lg', options: ['One'] }), createElement(PhoneInput, { visualSize: 'sm', inputProps: { size: 20 } }), createElement(Segmented, { visualSize: 'lg', options: ['One', 'Two'] })))
  expect(requireElement(root.querySelector<HTMLInputElement>('input.ui-input--sm')).size).toBe(12)
  expect(requireElement(root.querySelector<HTMLSelectElement>('select.ui-select--lg')).size).toBe(4)
  const enhanced = requireElement(root.querySelector<HTMLSelectElement>('select.ui-select__native'))

  expect(enhanced.size).toBe(6)
  expect(enhanced.classList.contains('ui-select--lg')).toBe(true)
  expect(root.querySelector('button.ui-select__trigger.ui-select--lg')).not.toBeNull()
  expect(requireElement(root.querySelector<HTMLInputElement>('.ui-phone-input__number')).size).toBe(20)
  expect(root.querySelector('.ui-phone-input__number.ui-input--sm')).not.toBeNull()
  expect(root.querySelector('.ui-phone-input__country.ui-select--sm')).not.toBeNull()
  expect(root.querySelector('.ui-segmented--lg')).not.toBeNull()
  expect(root.querySelector('[visualSize]')).toBeNull()
})
