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

const isStringArray = (
  value: unknown
): value is readonly string[] => Array.isArray(value) &&
  value.every((message: unknown) => typeof message === 'string')

const isOptionalString = (value: unknown): boolean => value === undefined || typeof value === 'string'

const isLumenFieldError = (value: unknown): value is LumenFieldError => {
  if (typeof value !== 'object' || value === null) return false

  if (!('message' in value) || typeof value.message !== 'string') return false

  if (!('name' in value) || typeof value.name !== 'string') return false

  if ('code' in value && !isOptionalString(value.code)) return false

  return !('controlId' in value) || isOptionalString(value.controlId)
}

const isLumenFieldErrorArray = (
  value: unknown
): value is readonly LumenFieldError[] => Array.isArray(value) && value.every(isLumenFieldError)

const compactMessages = (
  value: readonly string[] | string | null | undefined
): string[] => {
  if (typeof value === 'string') {
    const message = value.trim()

    return message ? [message] : []
  }

  if (!isStringArray(value)) return []

  return value
    .map(message => message.trim())
    .filter(Boolean)
}

const isLumenFormErrors = (value: LumenFormErrorInput): value is LumenFormErrors => Boolean(
  value &&
  !Array.isArray(value) &&
  'fields' in value &&
  isLumenFieldErrorArray(value.fields) &&
  'form' in value &&
  isStringArray(value.form) &&
  (value.fields.length > 0 || Object.keys(value).every(name => name === 'fields' || name === 'form'))
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

  if (isLumenFieldErrorArray(input)) {
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
