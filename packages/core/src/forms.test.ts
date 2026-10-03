import { describe, expect, test } from 'vitest'

import {
  createLumenFormFailure,
  createLumenFormSuccess,
  getLumenFieldErrors,
  normalizeLumenFormErrors
} from './forms.js'

describe('form contracts', () => {
  test('distinguishes field names fields and form from structured error arrays', () => {
    const errors: Record<string, string[]> = { fields: [' Name error '], form: [' Global error '] }

    expect(normalizeLumenFormErrors(errors)).toEqual({
      fields: [{ message: 'Name error', name: 'fields' }],
      form: ['Global error']
    })
    expect(normalizeLumenFormErrors({
      fields: [{ message: ' Name error ', name: ' fields ' }],
      form: [' Global error ']
    })).toEqual({
      fields: [{ message: 'Name error', name: 'fields' }],
      form: ['Global error']
    })
  })

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

test('retains other field errors when record discriminator arrays are empty', () => {
  const input: Record<string, readonly string[] | string> = {
    email: ' Email is invalid ', fields: [], form: []
  }
  expect(normalizeLumenFormErrors(input)).toEqual({
    fields: [{ name: 'email', message: 'Email is invalid' }], form: []
  })
})

test('retains populated structured errors when extra metadata is present', () => {
  const input = { fields: [{ name: 'email', message: 'Invalid' }], form: [], metadata: 'ignored' }
  expect(normalizeLumenFormErrors(input)).toEqual({
    fields: [{ name: 'email', message: 'Invalid' }], form: []
  })
})
