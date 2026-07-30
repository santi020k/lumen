import { renderToStaticMarkup } from 'react-dom/server'
import { useForm } from 'react-hook-form'

import { describe, expect, test } from 'vitest'

import {
  LumenListBoxController,
  LumenSelectController
} from './components.js'
import { getLumenManagedFieldState } from './state.js'

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

interface AdapterValues {
  members: string[]
  role: string
}

const AdapterFixture = () => {
  const { control } = useForm<AdapterValues>({
    defaultValues: {
      members: ['amina'],
      role: 'engineer'
    }
  })

  return (
    <form>
      <LumenSelectController
        control={control}
        name="role"
        options={[
          { label: 'Designer', value: 'designer' },
          { label: 'Engineer', value: 'engineer' }
        ]}
      />
      <LumenListBoxController
        control={control}
        multiple
        name="members"
        options={[
          { label: 'Amina', value: 'amina' },
          { label: 'Theo', value: 'theo' }
        ]}
      />
    </form>
  )
}

describe('React Hook Form adapters', () => {
  test('renders controlled composite values into submitted native controls', () => {
    const markup = renderToStaticMarkup(<AdapterFixture />)

    expect(markup).toContain('name="role"')
    expect(markup).toContain('<option value="engineer" selected="">Engineer</option>')
    expect(markup).toContain('name="members"')
    expect(markup).toContain('<option value="amina" selected="">Amina</option>')
  })
})
