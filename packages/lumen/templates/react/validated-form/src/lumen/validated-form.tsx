import type { ReactNode, SyntheticEvent } from 'react'
import { useLayoutEffect, useRef, useState } from 'react'

import { type LumenFormErrorInput, type LumenFormErrors, normalizeLumenFormErrors } from '@santi020k/lumen-core'
import { Alert, ErrorSummary } from '@santi020k/lumen-react'

export interface ValidatedFormRecipeProps {
  children: (state: { errors: LumenFormErrors, pending: boolean }) => ReactNode
  id: string
  label: string
  summaryHeading: string
  failureMessage: string
  successMessage: string
  validate?: (form: HTMLFormElement) => LumenFormErrorInput
  submit: (values: FormData) => Promise<LumenFormErrorInput | undefined>
  onFailure?: (error: unknown) => void
  onReset?: (event: SyntheticEvent<HTMLFormElement>) => void
}

const emptyErrors: LumenFormErrors = { fields: [], form: [] }

const nativeErrors = (form: HTMLFormElement): LumenFormErrors => {
  const view = form.ownerDocument.defaultView
  const fields: LumenFormErrors['fields'] = []

  if (!view) return emptyErrors

  for (const control of form.elements) {
    const isControl = control instanceof view.HTMLInputElement ||
      control instanceof view.HTMLSelectElement || control instanceof view.HTMLTextAreaElement

    if (!isControl) continue

    if (control.willValidate && !control.validity.valid) {
      fields.push({ controlId: control.id, name: control.name, message: control.validationMessage })
    }
  }

  return { fields, form: [] }
}

/** Product validation, network policy and idempotency remain in the supplied callbacks. */
export const ValidatedFormRecipe = ({
  children, id, label, summaryHeading, failureMessage, successMessage, validate, submit, onFailure, onReset
}: ValidatedFormRecipeProps) => {
  const formRef = useRef<HTMLFormElement>(null)
  const activeRequestRef = useRef(false)
  const attemptedRef = useRef(false)
  const [errors, setErrors] = useState<LumenFormErrors>(emptyErrors)
  const [pending, setPending] = useState(false)
  const [succeeded, setSucceeded] = useState(false)
  const [focusErrors, setFocusErrors] = useState(false)

  const readErrors = (form: HTMLFormElement) => {
    const native = nativeErrors(form)
    const product = normalizeLumenFormErrors(validate?.(form))

    return { fields: [...native.fields, ...product.fields], form: [...native.form, ...product.form] }
  }

  useLayoutEffect(() => {
    const form = formRef.current

    if (!form || !focusErrors) return

    const targetId = errors.fields.find(item => item.controlId)?.controlId
    const target = targetId ? form.ownerDocument.getElementById(targetId) : undefined

    if (target instanceof HTMLElement && (form.contains(target) || ('form' in target && target.form === form))) target.focus()
    else form.querySelector<HTMLElement>('[data-ui-error-summary]')?.focus()

    setFocusErrors(false)
  }, [errors, focusErrors])

  const handleSubmit = async (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (activeRequestRef.current) return

    const form = event.currentTarget
    const next = readErrors(form)

    attemptedRef.current = true

    setErrors(next)

    setSucceeded(false)

    if (next.fields.length || next.form.length) {
      setFocusErrors(true)

      return
    }

    // Capture values before pending UI disables the controls.
    const values = new FormData(form)

    activeRequestRef.current = true

    setPending(true)

    try {
      const result = normalizeLumenFormErrors(await submit(values))

      setErrors(result)

      if (result.fields.length || result.form.length) setFocusErrors(true)
      else setSucceeded(true)
    } catch (error) {
      setErrors({ fields: [], form: [failureMessage] })

      setFocusErrors(true)

      onFailure?.(error)
    } finally {
      activeRequestRef.current = false

      setPending(false)
    }
  }

  return (
    <form
      ref={formRef}
      id={id}
      aria-label={label}
      aria-busy={pending}
      noValidate
      onSubmit={event => {
        void handleSubmit(event)
      }}
      onBlur={event => {
        const next = event.relatedTarget

        // Keep a focused action stationary between pointer down and click.
        if (next instanceof HTMLElement && next.closest('button') && event.currentTarget.contains(next)) return

        if (attemptedRef.current && !activeRequestRef.current) setErrors(readErrors(event.currentTarget))
      }}
      onChange={event => {
        if (attemptedRef.current && !activeRequestRef.current) setErrors(readErrors(event.currentTarget))
      }}
      onReset={event => {
        if (activeRequestRef.current) {
          event.preventDefault()

          return
        }

        onReset?.(event)

        if (event.defaultPrevented) return

        attemptedRef.current = false

        setErrors(emptyErrors)

        setSucceeded(false)
      }}
    >
      <ErrorSummary id={`${id}-errors`} heading={summaryHeading} errors={errors} />
      {children({ errors, pending })}
      {succeeded && <Alert role="status">{successMessage}</Alert>}
    </form>
  )
}
