export interface LumenManagedFieldState {
  'aria-describedby'?: string | undefined
  'aria-invalid': boolean
  controlId: string
  errorId: string
  errorMessage?: string | undefined
  invalid: boolean
}

export interface LumenFieldStateInput {
  error?: {
    message?: unknown
  } | undefined
  invalid: boolean
}

export const getLumenManagedFieldState = (
  fieldState: LumenFieldStateInput,
  controlId: string,
  describedBy?: string
): LumenManagedFieldState => {
  const errorId = `${controlId}-error`

  const errorMessage = typeof fieldState.error?.message === 'string' ?
    fieldState.error.message :
    undefined

  const descriptionIds = [
    describedBy,
    fieldState.invalid ? errorId : undefined
  ].filter((value): value is string => Boolean(value))

  return {
    'aria-describedby': descriptionIds.length ? descriptionIds.join(' ') : undefined,
    'aria-invalid': fieldState.invalid,
    controlId,
    errorId,
    errorMessage,
    invalid: fieldState.invalid
  }
}
