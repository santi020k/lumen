import {
  type LumenFormErrors,
  normalizeLumenFormErrors
} from '@santi020k/lumen-core'

export interface AstroActionErrorLike {
  fields?: Record<string, readonly string[] | string | null | undefined>
  message?: string
}

export type LumenControlIdMap = Readonly<Record<string, string>>

const isFieldMessages = (value: unknown): boolean => (
  value === null || value === undefined || typeof value === 'string' ||
  (Array.isArray(value) && value.every((message: unknown) => typeof message === 'string'))
)

const isActionFields = (value: unknown): value is NonNullable<AstroActionErrorLike['fields']> => (
  typeof value === 'object' && value !== null && !Array.isArray(value) &&
  Object.values(value).every(isFieldMessages)
)

const isActionErrorLike = (error: unknown): error is AstroActionErrorLike => {
  if (typeof error !== 'object' || error === null) return false

  if ('message' in error && error.message !== undefined && typeof error.message !== 'string') return false

  return !('fields' in error) || error.fields === undefined || isActionFields(error.fields)
}

export const normalizeAstroActionErrors = (
  error: unknown,
  controlIds: LumenControlIdMap = {}
): LumenFormErrors => {
  if (!isActionErrorLike(error)) return { fields: [], form: [] }

  let normalized: LumenFormErrors

  if (error.fields) {
    normalized = normalizeLumenFormErrors(error.fields)
  } else {
    normalized = {
      fields: [],
      form: error.message?.trim() ? [error.message.trim()] : []
    }
  }

  return {
    fields: normalized.fields.map(fieldError => ({
      ...fieldError,
      ...(Object.hasOwn(controlIds, fieldError.name) && controlIds[fieldError.name] ?
        {
          controlId: controlIds[fieldError.name]
        } :
        {})
    })),
    form: normalized.form
  }
}
