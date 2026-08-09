import { describe, expect, test } from 'vitest'

import {
  createLumenFormFailure,
  createLumenFormSuccess,
  getLumenFieldErrors,
  normalizeLumenFormErrors
} from './forms.js'

describe('form contracts', () => {
  test('normalizes field and form errors in stable input order', () => {
    expect(normalizeLumenFormErrors({
      email: ['Email is required', 'Email is invalid'],
      form: 'Unable to save',
      name: 'Name is required',
      root: ['Try again later']
    })).toEqual({
      fields: [
        { message: 'Email is required', name: 'email' },
        { message: 'Email is invalid', name: 'email' },
        { message: 'Name is required', name: 'name' }
      ],
      form: ['Unable to save', 'Try again later']
    })
  })

  test('removes empty errors and preserves optional field metadata', () => {
    const errors = normalizeLumenFormErrors([
      { code: 'required', controlId: 'email', message: ' Email is required ', name: ' email ' },
      { message: ' ', name: 'ignored' }
    ])

    expect(errors).toEqual({
      fields: [{
        code: 'required',
        controlId: 'email',
        message: 'Email is required',
        name: 'email'
      }],
      form: []
    })
    expect(getLumenFieldErrors(errors, 'email')).toHaveLength(1)
  })

  test('creates discriminated success and failure results', () => {
    expect(createLumenFormSuccess({ id: 'profile-1' })).toEqual({
      data: { id: 'profile-1' },
      success: true
    })
    expect(createLumenFormFailure({ email: 'Email is required' })).toEqual({
      errors: {
        fields: [{ message: 'Email is required', name: 'email' }],
        form: []
      },
      success: false
    })
  })
})
