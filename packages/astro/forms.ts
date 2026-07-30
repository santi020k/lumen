import {
  type LumenFormErrors,
  normalizeLumenFormErrors
} from '@santi020k/lumen-core'

export interface AstroActionErrorLike {
  fields?: Record<string, readonly string[] | string | null | undefined>
  message?: string
}

export type LumenControlIdMap = Readonly<Record<string, string>>

const isActionErrorLike = (error: unknown): error is AstroActionErrorLike => (
  typeof error === 'object' &&
  error !== null
)

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
      ...(controlIds[fieldError.name] ?
        {
          controlId: controlIds[fieldError.name]
        } :
        {})
    })),
    form: normalized.form
  }
}
