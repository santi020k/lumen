import { expect, test } from 'vitest'

import { normalizeAstroActionErrors } from './forms.js'

test.each([{ message: { code: 'NOT_FOUND' } }, { message: 42 }, { fields: 42 }])(
  'ignores malformed action errors without throwing', error => {
    expect(normalizeAstroActionErrors(error)).toEqual({ fields: [], form: [] })
  }
)

test('trims valid global action messages', () => {
  expect(normalizeAstroActionErrors({ message: ' Failed ' })).toEqual({ fields: [], form: ['Failed'] })
})

test('does not inherit control IDs from object prototype fields', () => {
  expect(normalizeAstroActionErrors({ fields: { constructor: ['Invalid'] } })).toEqual({
    fields: [{ name: 'constructor', message: 'Invalid' }], form: []
  })
})
