import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

import { expect, test } from 'vitest'

import { Checkbox as SelectiveCheckbox } from './entries/checkbox.js'
import { Field as SelectiveField, FieldError as SelectiveError } from './entries/field.js'
import { Checkbox, Field, FieldError } from './components.js'

test('selective fields preserve catalog identity and error and glass contracts', () => {
  expect(SelectiveCheckbox).toBe(Checkbox)
  expect(SelectiveField).toBe(Field)
  expect(SelectiveError).toBe(FieldError)
  const html = renderToStaticMarkup(createElement(Field, { glass: 'strong', invalid: true, controlId: 'name', describedBy: 'error' }, createElement(Checkbox, { name: 'accepted', defaultChecked: true }), createElement(FieldError, { id: 'error', message: 'Required' })))
  expect(html).toContain('ui-glass-strong')
  expect(html).toContain('data-ui-field-describedby="error"')
  expect(html).toContain('data-invalid="true"')
  expect(html).toContain('type="checkbox"')
  expect(html).toContain('Required')
})
