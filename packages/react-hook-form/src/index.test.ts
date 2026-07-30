import { describe, expect, test } from 'vitest'

import { getLumenManagedFieldState } from './index.js'

describe('getLumenManagedFieldState', () => {
  test('connects invalid controls to their error and existing help text', () => {
    expect(getLumenManagedFieldState({
      error: { message: 'Choose a team' },
      invalid: true
    }, 'team', 'team-hint')).toEqual({
      'aria-describedby': 'team-hint team-error',
      'aria-invalid': true,
      controlId: 'team',
      errorId: 'team-error',
      errorMessage: 'Choose a team',
      invalid: true
    })
  })

  test('does not announce an inactive error', () => {
    expect(getLumenManagedFieldState({
      invalid: false
    }, 'email')).toEqual({
      'aria-describedby': undefined,
      'aria-invalid': false,
      controlId: 'email',
      errorId: 'email-error',
      errorMessage: undefined,
      invalid: false
    })
  })
})
