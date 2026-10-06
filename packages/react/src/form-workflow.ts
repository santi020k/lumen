'use client'

import type { RefObject, SyntheticEvent } from 'react'
import { useCallback, useEffect, useId, useRef, useState } from 'react'

export type LumenFormControl = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement

export interface LumenFormIssue {
  name: string
  controlId: string
  message: string
  label?: string
}

export const isLumenFormControl = (element: EventTarget): element is LumenFormControl => {
  if (!('ownerDocument' in element)) return false

  const owner = element.ownerDocument

  if (typeof owner !== 'object' || owner === null || !('defaultView' in owner)) return false

  const view = owner.defaultView ?? globalThis

  if (typeof view !== 'object') return false

  return ['HTMLInputElement', 'HTMLSelectElement', 'HTMLTextAreaElement'].some(name => {
    const Constructor: unknown = Reflect.get(view, name)

    return typeof Constructor === 'function' && element instanceof Constructor
  })
}

const controlsOf = (form: HTMLFormElement): LumenFormControl[] => Array.from(form.elements).filter(isLumenFormControl)

const fingerprintInput = (control: HTMLInputElement): unknown[] => {
  if (['submit', 'button', 'reset'].includes(control.type)) return []

  if (control.type === 'file') {
    return [control.name, Array.from(control.files ?? [], file => [file.name, file.size, file.lastModified])]
  }

  if (['checkbox', 'radio'].includes(control.type)) return [control.name, control.value, control.checked]

  return [control.name, control.value]
}

const fingerprintControl = (control: LumenFormControl): unknown[] => {
  const view = control.ownerDocument.defaultView
  const Input = view?.HTMLInputElement
  const Select = view?.HTMLSelectElement

  if (Input && control instanceof Input) return fingerprintInput(control)

  if (Select && control instanceof Select && control.multiple) {
    return [control.name, Array.from(control.selectedOptions, option => option.value)]
  }

  return [control.name, control.value]
}

/** An in-memory comparison only. Applications must never log or persist this snapshot. */
const fingerprint = (form: HTMLFormElement): string => JSON.stringify(controlsOf(form).map(fingerprintControl))
const nativeMessage = (control: LumenFormControl): string => control.validity.valid ? '' : control.validationMessage
const defaultControlName = (control: LumenFormControl): string => control.name || control.id

const ensureControlId = (control: LumenFormControl): void => {
  if (!control.id) control.id = `lumen-field-${crypto.randomUUID()}`
}

const appendValueIssues = (
  controls: readonly LumenFormControl[], issues: LumenFormIssue[], additional: readonly LumenFormIssue[],
  getName: (control: LumenFormControl) => string
): void => {
  for (const issue of additional) {
    const control = controls.find(item => item.id === issue.controlId || getName(item) === issue.name)

    if (!control) continue

    if (issues.some(item => item.controlId === control.id)) continue

    issues.push({ ...issue, controlId: control.id })
  }
}

const controlLabel = (control: LumenFormControl, fallback: string): string => {
  const label = control.labels?.[0]

  if (label?.textContent) return label.textContent.trim()

  return control.getAttribute('aria-label') || fallback
}

const collectIssues = (form: HTMLFormElement, options: LumenFormWorkflowOptions): LumenFormIssue[] => {
  const controls = controlsOf(form).filter(control => control.willValidate)
  const getName = options.getControlName ?? defaultControlName
  const getMessage = options.validateControl ?? nativeMessage
  const issues: LumenFormIssue[] = []

  for (const control of controls) {
    ensureControlId(control)

    const message = getMessage(control)

    if (message) issues.push({
      name: getName(control),
      controlId: control.id,
      message,
      label: controlLabel(control, getName(control))
    })
  }

  appendValueIssues(controls, issues, options.validateValues?.(form) ?? [], getName)

  return issues
}

export interface LumenFormWorkflowOptions {
  getControlName?: (control: LumenFormControl) => string
  validateControl?: (control: LumenFormControl) => string
  validateValues?: (form: HTMLFormElement) => readonly LumenFormIssue[]
  /** Map a changed field name to the other field names that need validation. */
  dependencies?: Readonly<Record<string, readonly string[]>>
}

export interface LumenFormWorkflow {
  formRef: RefObject<HTMLFormElement | null>
  errors: readonly LumenFormIssue[]
  dirty: boolean
  attempted: boolean
  validate: (form?: HTMLFormElement | null, names?: readonly string[]) => boolean
  refresh: (form?: HTMLFormElement | null, changedName?: string) => void
  setErrors: (errors: readonly LumenFormIssue[]) => void
  markSaved: () => void
  formProps: {
    ref: RefObject<HTMLFormElement | null>
    noValidate: true
    onBlur: (event: SyntheticEvent<HTMLFormElement>) => void
    onChange: (event: SyntheticEvent<HTMLFormElement>) => void
    onInput: (event: SyntheticEvent<HTMLFormElement>) => void
    onReset: (event: SyntheticEvent<HTMLFormElement>) => void
  }
}

/** Validation and edit state; schemas, requests, draft storage and business policy remain application-owned. */
export const useLumenFormWorkflow = ({
  getControlName = defaultControlName, validateControl, validateValues, dependencies = {}
}: LumenFormWorkflowOptions = {}): LumenFormWorkflow => {
  const formRef = useRef<HTMLFormElement | null>(null)
  const baselineRef = useRef<string | null>(null)
  const mountedRef = useRef(false)
  const handledEventsRef = useRef(new WeakSet<Event>())
  const attemptedRef = useRef(false)
  const touchedRef = useRef(new Set<string>())
  const [errors, setErrors] = useState<readonly LumenFormIssue[]>([])
  const [dirty, setDirty] = useState(false)
  const [attempted, setAttempted] = useState(false)

  useEffect(() => {
    mountedRef.current = true

    if (formRef.current && baselineRef.current === null) baselineRef.current = fingerprint(formRef.current)

    return () => {
      mountedRef.current = false
    }
  }, [])

  const collect = useCallback((form: HTMLFormElement): LumenFormIssue[] => collectIssues(form, {
    getControlName,
    ...(validateControl ? { validateControl } : {}),
    ...(validateValues ? { validateValues } : {})
  }), [getControlName, validateControl, validateValues])

  const validate = useCallback((form = formRef.current, names?: readonly string[]): boolean => {
    if (!form) return false

    const all = collect(form)

    if (!names) {
      attemptedRef.current = true

      setAttempted(true)

      setErrors(all)
    } else {
      for (const name of names) touchedRef.current.add(name)

      setErrors(previous => {
        const visible = new Set([...previous.map(issue => issue.name), ...names])

        return all.filter(issue => visible.has(issue.name))
      })
    }

    const invalid = names ? all.filter(issue => names.includes(issue.name)) : all
    const first = invalid[0]

    if (!names && first) controlsOf(form).find(control => control.id === first.controlId)?.focus()

    return invalid.length === 0
  }, [collect])

  const refresh = useCallback((form = formRef.current, changedName?: string): void => {
    if (!form || !mountedRef.current) return

    baselineRef.current ??= fingerprint(form)

    setDirty(fingerprint(form) !== baselineRef.current)

    const names = new Set(touchedRef.current)

    if (changedName && Object.hasOwn(dependencies, changedName)) {
      for (const name of dependencies[changedName] ?? []) names.add(name)
    }

    const all = collect(form)

    setErrors(all.filter(issue => attemptedRef.current || names.has(issue.name)))
  }, [collect, dependencies])

  useEffect(() => {
    const form = formRef.current

    if (!form) return

    const owner = form.ownerDocument

    const externalControl = (event: Event): LumenFormControl | undefined => {
      const target = event.target

      return target && isLumenFormControl(target) && target.form === form && !form.contains(target) ? target : undefined
    }

    const updateExternal = (event: Event): void => {
      const control = externalControl(event)

      if (!control) return

      const name = getControlName(control)

      queueMicrotask(() => {
        if (!handledEventsRef.current.has(event)) refresh(form, name)
      })
    }

    const blurExternal = (event: Event): void => {
      const control = externalControl(event)

      if (!control) return

      queueMicrotask(() => {
        if (handledEventsRef.current.has(event) || !mountedRef.current) return

        ensureControlId(control)

        validate(form, [getControlName(control)])
      })
    }

    owner.addEventListener('input', updateExternal)

    owner.addEventListener('change', updateExternal)

    owner.addEventListener('focusout', blurExternal)

    return () => {
      owner.removeEventListener('input', updateExternal)

      owner.removeEventListener('change', updateExternal)

      owner.removeEventListener('focusout', blurExternal)
    }
  })

  const markSaved = useCallback(() => {
    if (formRef.current) baselineRef.current = fingerprint(formRef.current)

    setDirty(false)

    setErrors([])

    setAttempted(false)

    attemptedRef.current = false

    touchedRef.current.clear()
  }, [])

  const update = (event: SyntheticEvent<HTMLFormElement>) => {
    handledEventsRef.current.add(event.nativeEvent)

    const form = event.currentTarget
    const name = isLumenFormControl(event.target) ? getControlName(event.target) : undefined

    queueMicrotask(() => {
      refresh(form, name)
    })
  }

  return {
    formRef,
    errors,
    dirty,
    attempted,
    validate,
    refresh,
    setErrors,
    markSaved,
    formProps: {
      ref: formRef,
      noValidate: true,
      onInput: update,
      onChange: update,
      onBlur: event => {
        handledEventsRef.current.add(event.nativeEvent)

        if (isLumenFormControl(event.target) && event.target.form === event.currentTarget) {
          ensureControlId(event.target)

          validate(event.currentTarget, [getControlName(event.target)])
        }
      },
      onReset: event => {
        const form = event.currentTarget

        queueMicrotask(() => {
          if (event.defaultPrevented || !mountedRef.current) return

          setErrors([])

          setAttempted(false)

          attemptedRef.current = false

          touchedRef.current.clear()

          // A reset restores defaults, not necessarily the last saved values.
          refresh(form)
        })
      }
    }
  }
}

export interface LumenFieldArrayItem<Value> { id: string, value: Value }

/** Stable row identity survives insertions, removals and reordering. */
export const useLumenFieldArray = <Value>(initialValues: readonly Value[] = []) => {
  const prefixId = useId()

  const [items, setItems] = useState<LumenFieldArrayItem<Value>[]>(
    () => initialValues.map((value, index) => ({ id: `${prefixId}-${index}`, value }))
  )

  const append = (value: Value): string => {
    const id = crypto.randomUUID()

    setItems(previous => [...previous, { id, value }])

    return id
  }

  const remove = (id: string) => {
    setItems(previous => previous.filter(item => item.id !== id))
  }

  const update = (id: string, value: Value) => {
    setItems(previous => previous.map(item => item.id === id ? { ...item, value } : item))
  }

  const move = (id: string, offset: number) => {
    if (!Number.isInteger(offset)) return

    setItems(previous => {
      const index = previous.findIndex(item => item.id === id)
      const target = index + offset

      if (index < 0 || target < 0 || target >= previous.length) return previous

      const item = previous[index]

      if (!item) return previous

      const next = [...previous]

      next.splice(index, 1)

      next.splice(target, 0, item)

      return next
    })
  }

  return { items, append, remove, update, move }
}

/** A failed or superseded check cannot replace the newest result. */
export const useLumenAsyncCheck = <Value, Result>(check: (value: Value, signal: AbortSignal) => Promise<Result>) => {
  const controllerRef = useRef<AbortController | null>(null)

  const [state, setState] = useState<
    { status: 'idle' | 'pending' } | { status: 'success', result: Result } | { status: 'error', error: unknown }
  >({ status: 'idle' })

  useEffect(() => () => {
    controllerRef.current?.abort()
  }, [])

  const cancel = useCallback(() => {
    controllerRef.current?.abort()

    controllerRef.current = null

    setState({ status: 'idle' })
  }, [])

  const run = useCallback(async (value: Value): Promise<Result | undefined> => {
    controllerRef.current?.abort()

    const request = new AbortController()

    controllerRef.current = request

    setState({ status: 'pending' })

    try {
      const result = await check(value, request.signal)

      if (request.signal.aborted || controllerRef.current !== request) return undefined

      setState({ status: 'success', result })

      return result
    } catch (error) {
      if (!request.signal.aborted && controllerRef.current === request) setState({ status: 'error', error })

      return undefined
    }
  }, [check])

  return { state, run, cancel }
}

/** Steps remain application-defined and validate before advancing. */
export const useLumenFormSteps = (
  steps: readonly { id: string, fields: readonly string[] }[], validate: (names: readonly string[]) => boolean
) => {
  const [activeId, setActiveId] = useState(steps[0]?.id ?? '')
  const index = Math.max(0, steps.findIndex(step => step.id === activeId))

  const goTo = (id: string): boolean => {
    const target = steps.findIndex(step => step.id === id)

    if (target < 0) return false

    if (target > index && !validate(steps.slice(0, target).flatMap(step => [...step.fields]))) return false

    setActiveId(id)

    return true
  }

  return {
    activeId: steps[index]?.id ?? '',
    index,
    goTo,
    next: () => goTo(steps[index + 1]?.id ?? ''),
    previous: () => goTo(steps[index - 1]?.id ?? '')
  }
}

/** Prompt on reload/close; application routers and dialogs should use the same dirty state. */
export const useLumenBeforeUnload = (dirty: boolean): void => {
  useEffect(() => {
    if (!dirty) return

    const listener = (event: BeforeUnloadEvent) => {
      event.preventDefault()
    }

    window.addEventListener('beforeunload', listener)

    return () => {
      window.removeEventListener('beforeunload', listener)
    }
  }, [dirty])
}
