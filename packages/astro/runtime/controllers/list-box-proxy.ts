const forwardedAttributes = ['aria-label', 'aria-labelledby', 'aria-describedby', 'aria-errormessage'] as const
const observedAttributes = [...forwardedAttributes, 'aria-invalid', 'disabled', 'required']

// The first invalid control owns focus so several invalid fields do not race for it.
const isFirstInvalidControl = (select: HTMLSelectElement): boolean => {
  const form = select.form

  if (!form) return true

  for (const element of form.elements) {
    if (element.matches(':invalid') && element.tagName !== 'FIELDSET') return element === select
  }

  return true
}

const setOptionalAttribute = (element: HTMLElement, name: string, value: string | null): void => {
  if (value === null) element.removeAttribute(name)
  else element.setAttribute(name, value)
}

const syncListBoxName = (
  root: HTMLElement,
  select: HTMLSelectElement,
  list: HTMLElement,
  listOwned: ReadonlySet<string>,
  createLabelId: () => string
): void => {
  for (const name of forwardedAttributes) {
    if (listOwned.has(name)) continue

    setOptionalAttribute(list, name, select.getAttribute(name) ?? (name === 'aria-label' ? root.getAttribute('aria-label') : null))
  }

  if (listOwned.has('aria-labelledby') || list.hasAttribute('aria-label') || list.hasAttribute('aria-labelledby')) return

  const labelIds = [...select.labels].map(label => {
    label.id ||= createLabelId()

    return label.id
  })

  if (labelIds.length) list.setAttribute('aria-labelledby', labelIds.join(' '))
}

/**
 * Once a list box is enhanced the visible list is its only focus stop and accessible control, while the
 * native select keeps form submission, validation, and reset. Naming, description, error, required, and
 * disabled semantics follow the select as they change, focus that reaches the select moves to the list,
 * and native invalid events mark the list invalid until a valid change or an accepted reset. Consumer
 * `aria-invalid` on the select always wins over generated state.
 */
export const bindListBoxProxy = (
  root: HTMLElement,
  select: HTMLSelectElement,
  list: HTMLElement,
  createLabelId: () => string
): void => {
  // Attributes authored on the list itself stay under the author's control.
  const listOwned = new Set<string>(forwardedAttributes.filter(name => list.hasAttribute(name)))
  let generatedInvalid = false

  const sync = (): void => {
    select.tabIndex = -1

    select.setAttribute('aria-hidden', 'true')

    syncListBoxName(root, select, list, listOwned, createLabelId)

    setOptionalAttribute(list, 'aria-required', select.required ? 'true' : null)

    // A select that is valid again or barred from validation, such as disabled or no longer required, is not invalid.
    if (!select.willValidate || select.validity.valid) generatedInvalid = false

    setOptionalAttribute(list, 'aria-invalid', select.getAttribute('aria-invalid') ?? (generatedInvalid ? 'true' : null))

    list.tabIndex = select.disabled ? -1 : 0

    setOptionalAttribute(list, 'aria-disabled', select.disabled ? 'true' : null)
  }

  sync()

  new MutationObserver(sync).observe(select, { attributeFilter: observedAttributes, attributes: true })

  select.addEventListener('focus', () => {
    // Only real select focus, such as a label click, moves to the list; focus moved elsewhere stays put.
    if (select.ownerDocument.activeElement === select && !select.disabled) list.focus({ preventScroll: true })
  })

  select.addEventListener('invalid', event => {
    event.preventDefault()

    generatedInvalid = true

    sync()

    if (isFirstInvalidControl(select) && !select.disabled) list.focus()
  })

  select.addEventListener('change', () => {
    if (!select.validity.valid) return

    generatedInvalid = false

    sync()
  })

  select.form?.addEventListener('reset', event => {
    // Reset listeners may cancel the reset; only an accepted reset clears generated invalid state.
    globalThis.setTimeout(() => {
      if (event.defaultPrevented) return

      generatedInvalid = false

      sync()
    })
  })
}
