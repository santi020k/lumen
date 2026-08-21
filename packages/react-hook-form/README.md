# @santi020k/lumen-react-hook-form

Optional React Hook Form adapters for Lumen composite controls.

Use React Hook Form's `register()` directly with native-backed controls such as `Input`,
`Textarea`, `Checkbox`, `Switch`, `Slider`, `NativeSelect`, `NumberField`, `SearchField`,
`TimeField`, and `FileUpload`. Install this package only for composite controls whose public value
is managed through `Controller`.

```bash
pnpm add @santi020k/lumen-react @santi020k/lumen-react-hook-form react-hook-form
```

```tsx
import { Button, Field, FieldError, Form, Label } from '@santi020k/lumen-react'
import {
  getLumenManagedFieldState,
  LumenSelectController
} from '@santi020k/lumen-react-hook-form'
import { useForm } from 'react-hook-form'

type ProfileValues = {
  role: string
}

export function ProfileForm() {
  const {
    control,
    formState: { errors },
    handleSubmit
  } = useForm<ProfileValues>({ defaultValues: { role: '' } })
  const state = getLumenManagedFieldState({
    error: errors.role,
    invalid: Boolean(errors.role)
  }, 'role')

  return (
    <Form onSubmit={handleSubmit(console.log)} status="idle">
      <Field invalid={state.invalid}>
        <Label htmlFor={state.controlId}>Role</Label>
        <LumenSelectController
          aria-describedby={state['aria-describedby']}
          aria-invalid={state['aria-invalid']}
          control={control}
          id={state.controlId}
          name="role"
          options={[
            { label: 'Designer', value: 'designer' },
            { label: 'Engineer', value: 'engineer' }
          ]}
          placeholder="Choose a role"
          rules={{ required: 'Choose a role' }}
        />
        <FieldError id={state.errorId} message={state.errorMessage} />
      </Field>
      <Button type="submit">Save</Button>
    </Form>
  )
}
```

The package also exports `LumenDatePickerController`, `LumenInputOTPController`, and
`LumenListBoxController`. Schema resolvers, field arrays, authorization, and persistence remain
application concerns.

## Zod and Yup

Use the official React Hook Form resolvers for schema validation. Zod and Yup stay optional and are
not bundled by Lumen.

```bash
# Zod
pnpm add @hookform/resolvers zod

# Yup
pnpm add @hookform/resolvers yup
```

```tsx
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'

const schema = z.object({
  email: z.string().trim().email('Enter a valid email'),
  role: z.string().trim().min(1, 'Choose a role')
})

const form = useForm<z.input<typeof schema>, unknown, z.output<typeof schema>>({
  defaultValues: { email: '', role: '' },
  resolver: zodResolver(schema)
})
```

```tsx
import { yupResolver } from '@hookform/resolvers/yup'
import { useForm } from 'react-hook-form'
import * as yup from 'yup'

const schema = yup.object({
  email: yup.string().trim().email('Enter a valid email').required('Email is required'),
  role: yup.string().trim().required('Choose a role')
})

const form = useForm<yup.InferType<typeof schema>>({
  defaultValues: { email: '', role: '' },
  resolver: yupResolver(schema)
})
```

Read errors from `form.formState.errors` and pass them through `getLumenManagedFieldState` as in
the adapter example above. React Hook Form remains the only validation owner; do not also mount
Lumen's `useFormValidation` on the same form.
