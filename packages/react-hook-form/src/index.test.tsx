import { renderToStaticMarkup } from 'react-dom/server'
import type { ResolverOptions } from 'react-hook-form'
import { useForm } from 'react-hook-form'

import { yupResolver } from '@hookform/resolvers/yup'
import { zodResolver } from '@hookform/resolvers/zod'
import { describe, expect, test } from 'vitest'
import * as yup from 'yup'
import * as z from 'zod'

import {
  LumenDatePickerController,
  LumenInputOTPController,
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
  code: string
  members: string[]
  role: string
  startDate: string
}

const AdapterFixture = () => {
  const { control } = useForm<AdapterValues>({
    defaultValues: {
      code: '123456',
      members: ['amina'],
      role: 'engineer',
      startDate: '2026-08-27'
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
      <LumenDatePickerController control={control} name="startDate" />
      <LumenInputOTPController control={control} length={6} name="code" />
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
    expect(markup).toContain('name="startDate"')
    expect(markup).toContain('value="2026-08-27"')
    expect(markup).toContain('name="code"')
    expect(markup).toContain('value="123456"')
  })

  test('maps Zod resolver errors into Lumen field state', async () => {
    const schema = z.object({
      role: z.string().trim().min(1, 'Choose a role')
    })
    const options: ResolverOptions<z.input<typeof schema>> = {
      fields: {},
      names: ['role'],
      shouldUseNativeValidation: false
    }
    const result = await zodResolver(schema)(
      { role: '' },
      undefined,
      options
    )
    const state = getLumenManagedFieldState({
      error: result.errors.role,
      invalid: Boolean(result.errors.role)
    }, 'role')

    expect(state.errorMessage).toBe('Choose a role')
    expect(state['aria-invalid']).toBe(true)
  })

  test('maps Yup resolver errors into Lumen field state', async () => {
    const schema = yup.object({
      role: yup.string().required('Choose a role')
    })
    const options: ResolverOptions<yup.InferType<typeof schema>> = {
      fields: {},
      names: ['role'],
      shouldUseNativeValidation: false
    }
    const result = await yupResolver(schema)(
      { role: '' },
      undefined,
      options
    )
    const state = getLumenManagedFieldState({
      error: result.errors.role,
      invalid: Boolean(result.errors.role)
    }, 'role')

    expect(state.errorMessage).toBe('Choose a role')
    expect(state['aria-invalid']).toBe(true)
  })
})
