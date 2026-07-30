export const lumenFormStatuses = [
  'idle',
  'validating',
  'submitting',
  'success',
  'error'
] as const

export type LumenFormStatus = typeof lumenFormStatuses[number]

export interface LumenFieldError {
  code?: string
  controlId?: string
  message: string
  name: string
}

export interface LumenFormErrors {
  fields: LumenFieldError[]
  form: string[]
}

export interface LumenFormSuccess<Data = unknown> {
  data: Data
  errors?: never
  success: true
}

export interface LumenFormFailure {
  data?: never
  errors: LumenFormErrors
  success: false
}

export type LumenFormResult<Data = unknown> = LumenFormFailure | LumenFormSuccess<Data>

export type LumenFormErrorInput =
  | LumenFormErrors |
  Record<string, readonly string[] | string | null | undefined> |
  readonly LumenFieldError[] |
  null |
  undefined

const compactMessages = (
  value: readonly string[] | string | null | undefined
): string[] => {
  if (typeof value === 'string') {
    const message = value.trim()

    return message ? [message] : []
  }

  if (!Array.isArray(value)) return []

  return value
    .map(message => message.trim())
    .filter(Boolean)
}

const isLumenFormErrors = (value: LumenFormErrorInput): value is LumenFormErrors => Boolean(
  value &&
  !Array.isArray(value) &&
  'fields' in value &&
  Array.isArray(value.fields) &&
  'form' in value &&
  Array.isArray(value.form)
)

const normalizeFieldError = (error: LumenFieldError): LumenFieldError | undefined => {
  const message = error.message.trim()
  const name = error.name.trim()

  if (!message || !name) return undefined

  return {
    ...(error.code ? { code: error.code } : {}),
    ...(error.controlId ? { controlId: error.controlId } : {}),
    message,
    name
  }
}

export const normalizeLumenFormErrors = (
  input: LumenFormErrorInput
): LumenFormErrors => {
  if (!input) return { fields: [], form: [] }

  if (Array.isArray(input)) {
    return {
      fields: input
        .map(normalizeFieldError)
        .filter((error): error is LumenFieldError => Boolean(error)),
      form: []
    }
  }

  if (isLumenFormErrors(input)) {
    return {
      fields: input.fields
        .map(normalizeFieldError)
        .filter((error): error is LumenFieldError => Boolean(error)),
      form: compactMessages(input.form)
    }
  }

  const fields: LumenFieldError[] = []
  const form: string[] = []

  for (const [name, value] of Object.entries(input)) {
    const messages = compactMessages(value)

    if (name === 'form' || name === 'root') {
      form.push(...messages)

      continue
    }

    fields.push(...messages.map(message => ({ message, name })))
  }

  return { fields, form }
}

export const getLumenFieldErrors = (
  errors: LumenFormErrors,
  name: string
): LumenFieldError[] => errors.fields.filter(error => error.name === name)

export const createLumenFormSuccess = <Data>(
  data: Data
): LumenFormSuccess<Data> => ({ data, success: true })

export const createLumenFormFailure = (
  errors: LumenFormErrorInput
): LumenFormFailure => ({
  errors: normalizeLumenFormErrors(errors),
  success: false
})
