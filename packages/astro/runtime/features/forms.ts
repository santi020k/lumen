// cspell:words spinbutton
import { nextRuntimeId } from './shared.js'

const fieldControlSelector = [
  'input:not([type="hidden"])',
  'select',
  'textarea',
  '[contenteditable="true"]',
  '[role="combobox"]',
  '[role="listbox"]',
  '[role="spinbutton"]',
  '[role="textbox"]'
].join(',')

const fieldDescriptionSelector = '[data-ui-field-hint], [data-ui-field-error], .ui-field__hint, .ui-field__error'
const fieldErrorSelector = '[data-ui-field-error], .ui-field__error'

const validityMessageAttributes = [
  ['valueMissing', 'data-error-required'],
  ['typeMismatch', 'data-error-type'],
  ['patternMismatch', 'data-error-pattern'],
  ['tooShort', 'data-error-too-short'],
  ['tooLong', 'data-error-too-long'],
  ['rangeUnderflow', 'data-error-min'],
  ['rangeOverflow', 'data-error-max'],
  ['stepMismatch', 'data-error-step'],
  ['badInput', 'data-error-bad-input'],
  ['customError', 'data-error-custom']
] as const

const isFormElement = (element: EventTarget | null): element is Element => {
  try {
    return element !== null && Element.prototype.matches.call(element, '*')
  } catch {
    return false
  }
}

const isFormHtmlElement = (element: EventTarget | null): element is HTMLElement => (
  isFormElement(element) && element.namespaceURI === 'http://www.w3.org/1999/xhtml'
)

const getFieldControl = (root: HTMLElement): HTMLElement | null => {
  const controlId = root.dataset.uiFieldControl

  if (controlId) {
    const control = root.ownerDocument.getElementById(controlId)

    if (isFormHtmlElement(control)) return control
  }

  return root.querySelector<HTMLElement>(fieldControlSelector)
}

const getFieldDescriptionId = (element: HTMLElement): string => {
  if (!element.id) {
    element.id = nextRuntimeId('ui-field-description', element.ownerDocument)
  }

  return element.id
}

const getFieldRoot = (control: HTMLElement): HTMLElement | null => (
  control.closest<HTMLElement>('.ui-field, [data-ui-field]')
)

type NativeFormControl = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement

const isNativeFormControl = (element: EventTarget | null): element is NativeFormControl => (
  isFormHtmlElement(element) && element.matches('input, select, textarea')
)

const getValidationMessage = (
  control: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement,
  field: HTMLElement | null
): string => {
  const validity = control.validity

  for (const [validityKey, attributeName] of validityMessageAttributes) {
    if (!validity[validityKey]) continue

    return control.getAttribute(attributeName) ??
      field?.getAttribute(attributeName) ??
      control.validationMessage
  }

  return control.validationMessage
}

const setFieldValidity = (
  control: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement,
  invalid: boolean,
  message = ''
): void => {
  const field = getFieldRoot(control)

  if (invalid) {
    control.setAttribute('aria-invalid', 'true')

    control.dataset.uiValidationInvalid = 'true'
  } else if (control.dataset.uiValidationInvalid === 'true') {
    control.removeAttribute('aria-invalid')

    delete control.dataset.uiValidationInvalid
  }

  if (!field) return

  field.dataset.invalid = String(invalid)

  for (const error of field.querySelectorAll<HTMLElement>(fieldErrorSelector)) {
    error.dataset.uiValidationErrorBound = 'true'

    error.hidden = !invalid

    error.textContent = invalid ? message : ''
  }
}

const validateControl = (
  control: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement,
  form: HTMLFormElement
): boolean => {
  form.dispatchEvent(new CustomEvent('ui:validate', {
    bubbles: true,
    detail: { control, form, value: control.value }
  }))

  const invalid = !control.validity.valid
  const message = invalid ? getValidationMessage(control, getFieldRoot(control)) : ''

  setFieldValidity(control, invalid, message)

  return !invalid
}

const getFormControls = (form: HTMLFormElement): NativeFormControl[] => [
  ...form.elements
].filter(isNativeFormControl).filter(control => !control.disabled &&
  control.type !== 'hidden')

const validateForm = (form: HTMLFormElement): (HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement)[] => {
  const invalidControls: (HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement)[] = []

  for (const control of getFormControls(form)) {
    if (!validateControl(control, form)) {
      invalidControls.push(control)
    }
  }

  return invalidControls
}

const bindFields = (root: HTMLElement): void => {
  if (root.dataset.uiFieldBound === 'true') return

  const control = getFieldControl(root)

  if (!control) return

  root.dataset.uiFieldBound = 'true'

  const existingIds = control.getAttribute('aria-describedby')?.trim().split(/\s+/) ?? []
  const configuredIds = root.dataset.uiFieldDescribedby?.trim().split(/\s+/) ?? []

  const descriptionIds = [...root.querySelectorAll<HTMLElement>(fieldDescriptionSelector)]
    .map(element => getFieldDescriptionId(element))

  const describedBy = [...new Set([...existingIds, ...configuredIds, ...descriptionIds].filter(Boolean))]

  if (describedBy.length) {
    control.setAttribute('aria-describedby', describedBy.join(' '))
  }
}

export const initFields = (scope: ParentNode): void => {
  for (const root of scope.querySelectorAll<HTMLElement>('.ui-field, [data-ui-field]')) bindFields(root)
}

const formValidationDocuments = new WeakSet<Document>()

const observeFormValidation = (ownerDocument: Document): void => {
  if (formValidationDocuments.has(ownerDocument)) return

  formValidationDocuments.add(ownerDocument)

  ownerDocument.addEventListener('focusout', event => {
    const control = event.target

    if (!isNativeFormControl(control)) return

    const form = control.form

    if (form?.dataset.uiFormBound !== 'true') return

    const valid = validateControl(control, form)

    form.dispatchEvent(new CustomEvent(valid ? 'ui:valid' : 'ui:invalid', {
      bubbles: true,
      detail: valid ? { control, form } : { control, controls: [control], form }
    }))
  })
}

const bindForms = (form: HTMLFormElement): void => {
  observeFormValidation(form.ownerDocument)

  if (form.dataset.uiFormBound === 'true') return

  form.dataset.uiFormBound = 'true'

  form.noValidate = true

  const setStatus = (status: 'error' | 'idle' | 'submitting'): void => {
    form.dataset.status = status

    if (status === 'submitting') form.setAttribute('aria-busy', 'true')
    else form.removeAttribute('aria-busy')
  }

  form.addEventListener('click', event => {
    const target = event.target

    if (!isFormElement(target)) return

    const link = target.closest<HTMLAnchorElement>('[data-ui-error-summary] a[href^="#"]')
    const controlId = link?.hash.slice(1)
    const control = controlId ? form.ownerDocument.getElementById(controlId) : null

    if (!link || !isFormHtmlElement(control) ||
      !(isNativeFormControl(control) ? control.form === form : form.contains(control))) return

    event.preventDefault()

    control.focus({ preventScroll: true })

    control.scrollIntoView({ behavior: 'smooth', block: 'center' })
  })

  form.addEventListener('submit', event => {
    if (form.dataset.status === 'submitting') {
      event.preventDefault()

      return
    }

    const invalidControls = validateForm(form)

    if (invalidControls.length) {
      event.preventDefault()

      setStatus('error')

      const firstInvalid = invalidControls[0]
      const errorSummary = form.querySelector<HTMLElement>('[data-ui-error-summary]:not([hidden])')

      form.dispatchEvent(new CustomEvent('ui:invalid', {
        bubbles: true,
        detail: { control: firstInvalid, controls: invalidControls, form }
      }))

      if (errorSummary) {
        errorSummary.focus({ preventScroll: true })
      } else {
        firstInvalid?.focus({ preventScroll: true })

        firstInvalid?.reportValidity()
      }

      return
    }

    form.dispatchEvent(new CustomEvent('ui:valid', {
      bubbles: true,
      detail: { controls: getFormControls(form), form }
    }))

    setStatus('submitting')

    queueMicrotask(() => {
      if (event.defaultPrevented) setStatus('idle')
    })
  })

  form.addEventListener('reset', () => {
    setStatus('idle')
  })
}

export const initForms = (scope: ParentNode): void => {
  for (const form of scope.querySelectorAll<HTMLFormElement>('form[data-ui-form]')) bindForms(form)
}
