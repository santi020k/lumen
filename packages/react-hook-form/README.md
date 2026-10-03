<p align="center">
  <a href="https://lumen.santi020k.com">
    <img src="https://raw.githubusercontent.com/santi020k/lumen/main/apps/docs/public/logo.svg" alt="Lumen UI" width="233" height="60">
  </a>
</p>

<h1 align="center">Lumen UI · React Hook Form</h1>

<p align="center">Composite controls · Managed field state · Typed adapters</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@santi020k/lumen-react-hook-form"><img src="https://img.shields.io/npm/v/@santi020k/lumen-react-hook-form?style=flat-square&color=0369a0" alt="npm version"></a>
  <a href="https://github.com/santi020k/lumen/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-13967e?style=flat-square" alt="MIT license"></a>
</p>

<p align="center">
  <a href="https://lumen.santi020k.com/docs/forms/react-hook-form">Documentation</a>
  ·
  <a href="https://www.npmjs.com/package/@santi020k/lumen-react-hook-form">npm</a>
  ·
  <a href="https://github.com/santi020k/lumen/tree/main/packages/react-hook-form">Source</a>
  ·
  <a href="https://github.com/santi020k/lumen/issues">Issues</a>
</p>

**Package:** `@santi020k/lumen-react-hook-form`

**On this page:** [Install](#install) · [Zod and Yup](#zod-and-yup) · [Resources](#resources)

---

Optional React Hook Form adapters for Lumen composite controls.

Use React Hook Form's `register()` directly with native-backed controls such as `Input`,
`Textarea`, `Checkbox`, `Switch`, `Slider`, `NativeSelect`, `NumberField`, `SearchField`,
`TimeField`, and `FileUpload`. Install this package only for composite controls whose public value
is managed through `Controller`.

## Install

Requires React 19 or newer, React Hook Form 7.76 or newer within major 7, and a compatible
Lumen React 3 release. Load `@santi020k/lumen-react/styles.css` once in the application entry;
this adapter does not load global styles for you.

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

## Resources

| Guide | What you will find |
| --- | --- |
| [React setup](https://github.com/santi020k/lumen/blob/main/packages/react/README.md) | Reference for react setup. |
| [Error handling](https://github.com/santi020k/lumen/blob/main/docs/error-handling.md) | Reference for error handling. |
| [Contributing](https://github.com/santi020k/lumen/blob/main/CONTRIBUTING.md) | Setup, checks, and contribution workflow. |
| [Release history](https://github.com/santi020k/lumen/releases) | Published releases and version notes. |

Part of [Lumen UI](https://lumen.santi020k.com), created by [Santiago Molina](https://santi020k.com).
Licensed under [MIT](https://github.com/santi020k/lumen/blob/main/LICENSE); third-party artwork retains its own notices.
