import { activateLumenAnchor, decodeLumenAnchorFragment, getLumenActiveAnchorIndex, getLumenScrollProgress  } from '@santi020k/lumen-core/anchor'

import { LumenElement } from './element-base.js'
import { createLumenElementClass, defineLumenElement, type LumenCustomElementRegistry, type LumenElementConfig } from './element-base.js'
import { observedAttributeNames } from './observed-attributes.js'

const focusableSelector = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])'
].join(',')

export const hasDocument = (): boolean => typeof document !== 'undefined'

export const createId = (prefix: string): string => {
  if (
    typeof crypto !== 'undefined' &&
    typeof crypto.randomUUID === 'function'
  ) {
    return `${prefix}-${crypto.randomUUID()}`
  }

  return `${prefix}-${Math.random().toString(36).slice(2)}`
}

const isElementVisible = (element: HTMLElement): boolean => {
  if (typeof element.checkVisibility === 'function') {
    return element.checkVisibility({ visibilityProperty: true })
  }

  const visibility = getComputedStyle(element).visibility

  if (visibility === 'hidden' || visibility === 'collapse') return false

  return element.offsetParent !== null || element.getClientRects().length > 0
}

export const getFocusable = (root: ParentNode | null): HTMLElement[] => {
  if (!root) return []

  return [...root.querySelectorAll<HTMLElement>(focusableSelector)].filter(
    element => !element.matches(':disabled') && !element.closest('[hidden], [inert]') && isElementVisible(element)
  )
}

export const getOwnedTarget = (event: Event): Node | null => event.target instanceof Node ? event.target : null

export type LumenScalarNativeControl = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement

const scalarControlAttributes = [
  'accept',
  'aria-describedby',
  'aria-label',
  'aria-labelledby',
  'autocomplete',
  'disabled',
  'form',
  'inputmode',
  'max',
  'maxlength',
  'min',
  'minlength',
  'multiple',
  'pattern',
  'placeholder',
  'readonly',
  'required',
  'rows',
  'size',
  'step'
] as const

const getValidityFlags = (validity: ValidityState): ValidityStateFlags => ({
  badInput: validity.badInput,
  customError: validity.customError,
  patternMismatch: validity.patternMismatch,
  rangeOverflow: validity.rangeOverflow,
  rangeUnderflow: validity.rangeUnderflow,
  stepMismatch: validity.stepMismatch,
  tooLong: validity.tooLong,
  tooShort: validity.tooShort,
  typeMismatch: validity.typeMismatch,
  valueMissing: validity.valueMissing
})

export class LumenScalarFormControlElement extends LumenElement {
  static formAssociated = true
  static nativeTagName: 'input' | 'select' | 'textarea' = 'input'

  private control: LumenScalarNativeControl | undefined
  private defaultCheckedState = false
  private defaultValueState = ''
  private eventController: AbortController | undefined
  private internals: ElementInternals | undefined
  private formDisabledState = false

  constructor() {
    super()

    if (typeof this.attachInternals === 'function') {
      const internals = this.attachInternals()

      if (
        typeof internals.setFormValue === 'function' &&
        typeof internals.setValidity === 'function'
      ) {
        this.internals = internals
      }
    }
  }

  get checked(): boolean {
    return this.control instanceof HTMLInputElement && this.control.checked
  }

  set checked(checked: boolean) {
    if (this.control instanceof HTMLInputElement) {
      this.control.checked = checked

      this.#syncFormState()

      return
    }

    this.toggleAttribute('checked', checked)
  }

  get defaultChecked(): boolean {
    return this.defaultCheckedState
  }

  set defaultChecked(checked: boolean) {
    this.defaultCheckedState = checked

    this.toggleAttribute('checked', checked)
  }

  get defaultValue(): string {
    return this.defaultValueState
  }

  set defaultValue(value: string) {
    this.defaultValueState = value

    this.setAttribute('value', value)
  }

  get disabled(): boolean {
    return this.hasAttribute('disabled')
  }

  set disabled(disabled: boolean) {
    this.toggleAttribute('disabled', disabled)
  }

  get form(): HTMLFormElement | null {
    return this.internals?.form ?? this.control?.form ?? null
  }

  get labels(): NodeList | null {
    return this.internals?.labels ?? null
  }

  get name(): string {
    return this.getAttribute('name') ?? ''
  }

  set name(name: string) {
    this.setAttribute('name', name)
  }

  get type(): string {
    if (this.control instanceof HTMLInputElement ||
      this.control instanceof HTMLSelectElement) return this.control.type

    return 'textarea'
  }

  set type(type: string) {
    const Constructor = this.constructor as typeof LumenScalarFormControlElement

    if (Constructor.nativeTagName === 'input') this.setAttribute('type', type)
  }

  get validationMessage(): string {
    return (
      this.internals?.validationMessage ?? this.control?.validationMessage ?? ''
    )
  }

  get validity(): ValidityState {
    return (
      this.internals?.validity ??
      this.control?.validity ??
      this.ownerDocument.createElement('input').validity
    )
  }

  get value(): string {
    return this.control?.value ?? this.getAttribute('value') ?? ''
  }

  set value(value: string) {
    if (this.control) {
      this.control.value = value

      this.#syncFormState()

      return
    }

    this.setAttribute('value', value)
  }

  get willValidate(): boolean {
    return this.internals?.willValidate ?? this.control?.willValidate ?? false
  }

  override connectedCallback() {
    super.connectedCallback()

    if (!hasDocument()) return

    const Constructor = this
      .constructor as typeof LumenScalarFormControlElement

    if (!this.control) {
      this.defaultValueState = this.getAttribute('value') ??
        (Constructor.nativeTagName === 'textarea' ? this.textContent : '')

      this.defaultCheckedState = this.hasAttribute('checked')
    }

    this.#ensureControl()

    if (this.control instanceof HTMLSelectElement &&
      !this.hasAttribute('value')) this.defaultValueState = this.control.value

    this.#syncControlAttributes()

    this.#bindControlEvents()

    this.#syncFormState()
  }

  override disconnectedCallback() {
    this.eventController?.abort()

    this.eventController = undefined
  }

  override attributeChangedCallback(
    name: string,
    previousValue: string | null,
    value: string | null
  ) {
    super.attributeChangedCallback()

    if (previousValue === value || !this.control) return

    this.#syncControlAttributes()

    if (name === 'value') {
      this.defaultValueState = value ?? ''

      this.control.value = this.defaultValueState
    }

    if (name === 'checked' && this.control instanceof HTMLInputElement) {
      this.defaultCheckedState = value !== null

      this.control.defaultChecked = this.defaultCheckedState
    }

    this.#syncFormState()
  }

  checkValidity(): boolean {
    const valid = this.control?.checkValidity() ?? true

    this.#syncFormState()

    return valid
  }

  override focus(options?: FocusOptions): void {
    this.control?.focus(options)
  }

  formDisabledCallback(disabled: boolean): void {
    this.formDisabledState = disabled

    if (this.control) this.control.disabled = disabled || this.disabled

    this.#syncFormState()
  }

  formResetCallback(): void {
    if (!this.control) return

    if (this.control instanceof HTMLSelectElement && !this.hasAttribute('value')) {
      for (const option of this.control.options) option.selected = option.defaultSelected

      if (!this.control.multiple && this.control.selectedIndex < 0) this.control.selectedIndex = 0
    } else this.control.value = this.defaultValueState

    if (this.control instanceof HTMLInputElement) {
      this.control.checked = this.defaultCheckedState
    }

    this.#syncFormState()
  }

  formStateRestoreCallback(state: File | FormData | string | null): void {
    if (typeof state === 'string') this.value = state
    else if (state instanceof FormData && this.control instanceof HTMLSelectElement) {
      const values = new Set(state.getAll(this.name))

      for (const option of this.control.options) option.selected = values.has(option.value)

      this.#syncFormState()
    }
  }

  reportValidity(): boolean {
    const valid = this.control?.reportValidity() ?? true

    this.#syncFormState()

    return valid
  }

  setCustomValidity(message: string): void {
    this.control?.setCustomValidity(message)

    this.#syncFormState()
  }

  #ensureControl(): void {
    const existingControl = this.querySelector<LumenScalarNativeControl>(
      '[data-ui-element-control]'
    )

    if (existingControl) {
      this.control = existingControl

      return
    }

    const Constructor = this
      .constructor as typeof LumenScalarFormControlElement

    const control = document.createElement(Constructor.nativeTagName)

    control.dataset.uiElementControl = ''

    control.className = this.className

    if (control instanceof HTMLInputElement ||
      control instanceof HTMLTextAreaElement) {
      control.defaultValue = this.defaultValueState
    }

    if (control instanceof HTMLSelectElement) {
      control.multiple = this.hasAttribute('multiple')

      control.append(...[...this.children].filter(child => child instanceof HTMLOptionElement ||
        child instanceof HTMLOptGroupElement))
    }

    if (this.defaultValueState) control.value = this.defaultValueState

    if (control instanceof HTMLInputElement) {
      control.defaultChecked = this.defaultCheckedState

      control.checked = this.defaultCheckedState
    }

    this.style.display = 'contents'

    this.replaceChildren(control)

    this.control = control
  }

  #bindControlEvents(): void {
    const control = this.control

    if (!control) return

    this.eventController?.abort()

    this.eventController = new AbortController()

    for (const eventName of ['change', 'input'] as const) {
      control.addEventListener(
        eventName, event => {
          event.stopPropagation()

          this.#syncFormState()

          this.dispatchEvent(
            new Event(eventName, { bubbles: true, composed: true })
          )
        }, { signal: this.eventController.signal }
      )
    }
  }

  #forwardControlAttributes(control: LumenScalarNativeControl): void {
    for (const name of scalarControlAttributes) {
      const value = this.getAttribute(name)

      if (value === null || (name === 'form' && this.internals)) {
        control.removeAttribute(name)
      } else {
        control.setAttribute(name, value)
      }
    }
  }

  #syncControlAttributes(): void {
    const control = this.control

    if (!control) return

    control.className = this.className

    this.#forwardControlAttributes(control)

    if (control instanceof HTMLInputElement) {
      control.type =
        this.getAttribute('type') ?? this.config.defaults?.type ?? 'text'
    }

    control.disabled = this.disabled || this.formDisabledState

    if (this.id) control.id = `${this.id}-control`

    if (this.internals) {
      control.removeAttribute('name')
    } else if (this.name) {
      control.name = this.name
    } else {
      control.removeAttribute('name')
    }
  }

  #syncFormState(): void {
    const control = this.control

    if (!control) return

    const submittedValue = this.#submittedValue(control)

    if (this.internals) {
      const state = control instanceof HTMLSelectElement && control.multiple ? submittedValue : control.value

      this.internals.setFormValue(submittedValue, state)

      if (control.validity.valid) {
        this.internals.setValidity({})
      } else {
        this.internals.setValidity(
          getValidityFlags(control.validity), control.validationMessage, control
        )
      }
    }

    if (control.validity.valid) {
      this.removeAttribute('aria-invalid')
    } else {
      this.setAttribute('aria-invalid', 'true')
    }
  }

  #multipleValue(control: HTMLSelectElement): FormData | null {
    if (!this.name) return null

    const values = new FormData()

    for (const option of control.selectedOptions) {
      const disabledGroup = option.parentElement instanceof HTMLOptGroupElement && option.parentElement.disabled

      if (!option.disabled && !disabledGroup) {
        values.append(this.name, option.value)
      }
    }

    return values
  }

  #submittedValue(
    control: LumenScalarNativeControl
  ): FormData | string | null {
    if (control.disabled || (control instanceof HTMLInputElement && ['checkbox', 'radio'].includes(control.type) && !control.checked)) return null

    if (control instanceof HTMLSelectElement && control.multiple) return this.#multipleValue(control)

    return control.value
  }
}

export class LumenDialogBehaviorElement extends LumenElement {
  private abortController: AbortController | undefined
  private lastTrigger: HTMLElement | undefined

  override connectedCallback() {
    super.connectedCallback()

    if (!hasDocument()) return

    this.abortController?.abort()

    this.abortController = new AbortController()

    this.#setupDialog(this.abortController.signal)
  }

  override disconnectedCallback() {
    this.abortController?.abort()

    this.abortController = undefined
  }

  show(trigger?: HTMLElement): void {
    this.#openDialog(trigger)
  }

  close(): void {
    this.#closeDialog()
  }

  get #isAlertDialog(): boolean {
    return (
      this.hasAttribute('data-ui-alert-dialog') ||
      this.tagName.toLowerCase() === 'lumen-alert-dialog'
    )
  }

  get #nativeDialog(): HTMLDialogElement | null {
    const dialog = this.querySelector('dialog')

    return dialog instanceof HTMLDialogElement ? dialog : null
  }

  get #dialogRoot(): HTMLElement {
    return this.#nativeDialog ?? this
  }

  #setupDialog(signal: AbortSignal): void {
    const dialog = this.#dialogRoot

    const initiallyOpen =
      this.hasAttribute('open') || this.#nativeDialog?.open === true

    dialog.setAttribute('aria-modal', 'true')

    dialog.setAttribute('role', this.#isAlertDialog ? 'alertdialog' : 'dialog')

    if (!this.#nativeDialog) {
      this.hidden = !initiallyOpen

      this.dataset.state = initiallyOpen ? 'open' : 'closed'
    }

    this.#nativeDialog?.addEventListener(
      'click', event => {
        if (event.target === this.#nativeDialog && !this.#isAlertDialog) {
          this.#closeDialog()
        }
      }, { signal }
    )

    this.#nativeDialog?.addEventListener(
      'close', () => {
        if (this.#nativeDialog?.open) return

        this.#returnFocus()
      }, { signal }
    )

    this.addEventListener(
      'click', event => {
        const target = getOwnedTarget(event)

        const closeButton =
          target instanceof Element ?
            target.closest(
              '[data-ui-dialog-close], [data-ui-alert-dialog-close]'
            ) :
            null

        const nativeButton = target instanceof Element ? target.closest('button') : null
        const owner = closeButton?.closest('lumen-dialog, lumen-alert-dialog, lumen-drawer, lumen-sheet')

        if (closeButton && owner === this && !event.defaultPrevented &&
          !nativeButton?.disabled && closeButton.getAttribute('aria-disabled') !== 'true') {
          this.#closeDialog()
        }
      }, { signal }
    )

    this.addEventListener(
      'keydown', event => {
        if (event.defaultPrevented || event.isComposing) return

        if (event.key === 'Escape') {
          event.preventDefault()

          this.#closeDialog()

          return
        }

        if (event.key !== 'Tab') return

        this.#trapFocus(event)
      }, { signal }
    )

    document.addEventListener(
      'click', event => {
        const target = getOwnedTarget(event)

        const trigger =
          target instanceof Element ?
            target.closest<HTMLElement>(
              '[data-ui-dialog-trigger], [data-ui-alert-dialog-trigger]'
            ) :
            null

        const targetId =
          trigger?.dataset.uiDialogTrigger ??
          trigger?.dataset.uiAlertDialogTrigger

        if (!trigger || targetId !== this.id) return

        this.#openDialog(trigger)
      }, { signal }
    )

    document.addEventListener(
      'pointerdown', event => {
        if (!this.#isOpen() || this.#isAlertDialog) return

        const target = getOwnedTarget(event)

        if (!target || this.contains(target)) return

        this.#closeDialog()
      }, { signal }
    )
  }

  #isOpen(): boolean {
    return (
      this.#nativeDialog?.open === true ||
      this.hasAttribute('open') ||
      this.dataset.state === 'open'
    )
  }

  #openDialog(trigger?: HTMLElement): void {
    if (trigger) {
      if (!trigger.id) {
        trigger.id = createId('ui-trigger')
      }

      this.lastTrigger = trigger
    }

    const dialog = this.#nativeDialog

    if (dialog) {
      if (typeof dialog.showModal === 'function' && !dialog.open) {
        dialog.showModal()
      } else {
        dialog.setAttribute('open', '')
      }
    } else {
      this.hidden = false

      this.setAttribute('open', '')

      this.dataset.state = 'open'
    }

    getFocusable(this.#dialogRoot)[0]?.focus({ preventScroll: true })
  }

  #closeDialog(): void {
    const dialog = this.#nativeDialog

    if (dialog?.open) {
      dialog.close()

      return
    }

    if (!dialog) {
      this.hidden = true

      this.removeAttribute('open')

      this.dataset.state = 'closed'

      this.#returnFocus()
    }
  }

  #returnFocus(): void {
    this.lastTrigger?.focus({ preventScroll: true })
  }

  #trapFocus(event: KeyboardEvent): void {
    const focusable = getFocusable(this.#dialogRoot)

    if (!focusable.length) return

    const first = focusable[0]
    const last = focusable.at(-1)

    if (!first || !last) return

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()

      last.focus()

      return
    }

    if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()

      first.focus()
    }
  }
}

export class LumenAnchorBehaviorElement extends LumenElement {
  private abortController: AbortController | undefined
  private frame = 0
  private frameView: Window | null = null

  override connectedCallback() {
    super.connectedCallback()

    this.stopAnchorUpdates()

    const owner = this.ownerDocument
    const view = owner.defaultView

    if (!view) return

    this.frameView = view

    this.abortController = new view.AbortController()

    const signal = this.abortController.signal
    const links = [...this.querySelectorAll<HTMLAnchorElement>('a[href^="#"]')]
    const targets: { link: HTMLAnchorElement, target: HTMLElement }[] = []

    for (const link of links) {
      const id = decodeLumenAnchorFragment(link.getAttribute('href')?.slice(1) ?? '')
      const target = id ? owner.getElementById(id) : null

      if (target) {
        targets.push({ link, target })
      }
    }

    if (!targets.length) return

    const headings = targets.map(({ target }) => target)

    const setActive = (active: HTMLAnchorElement) => {
      for (const link of links) {
        const isActive = link === active

        link.dataset.active = String(isActive)

        if (isActive) {
          link.setAttribute('aria-current', 'location')
        } else {
          link.removeAttribute('aria-current')
        }
      }
    }

    const update = () => {
      this.frame = 0

      const offset = Number(
        this.getAttribute('activation-offset') ?? this.dataset.uiAnchorOffset
      )

      const index = getLumenActiveAnchorIndex(headings, offset)
      const active = targets[index]?.link

      if (active) setActive(active)
    }

    const requestUpdate = () => {
      if (this.frame) return

      this.frame = view.requestAnimationFrame(update)
    }

    for (const { link } of targets) {
      link.addEventListener('click', event => {
        view.setTimeout(() => {
          if (!signal.aborted && activateLumenAnchor(link, event)) setActive(link)
        })
      }, {
        signal: this.abortController.signal
      })
    }

    view.addEventListener('resize', requestUpdate, {
      passive: true,
      signal: this.abortController.signal
    })

    view.addEventListener('scroll', requestUpdate, {
      passive: true,
      signal: this.abortController.signal
    })

    update()
  }

  override disconnectedCallback() {
    this.stopAnchorUpdates()
  }

  private stopAnchorUpdates() {
    this.abortController?.abort()

    this.abortController = undefined

    if (this.frame) this.frameView?.cancelAnimationFrame(this.frame)

    this.frame = 0

    this.frameView = null
  }
}

export class LumenScrollProgressBehaviorElement extends LumenElement {
  private resizeObserver?: ResizeObserver
  private abortController: AbortController | undefined
  private frame = 0

  private update = () => {
    this.frame = 0

    const scrollingElement =
      document.scrollingElement ?? document.documentElement

    const targetId = this.getAttribute('target-id')

    const percentage = getLumenScrollProgress(
      scrollingElement, targetId ? this.ownerDocument.getElementById(targetId) : null
    ) * 100

    let bar = this.querySelector<HTMLElement>('.ui-scroll-progress__bar')

    if (!bar) {
      bar = document.createElement('span')

      bar.className = 'ui-scroll-progress__bar'

      this.append(bar)
    }

    this.setAttribute('aria-valuenow', `${Math.round(percentage)}`)

    bar.style.transform = `scaleX(${percentage / 100})`
  }

  private scheduleUpdate = () => {
    if (this.frame) return

    if (typeof requestAnimationFrame === 'undefined') {
      this.update()

      return
    }

    this.frame = requestAnimationFrame(this.update)
  }

  private observeTarget(): void {
    this.resizeObserver?.disconnect()

    if (typeof ResizeObserver === 'function') {
      this.resizeObserver = new ResizeObserver(this.scheduleUpdate)

      this.resizeObserver.observe(this.ownerDocument.documentElement)

      const targetId = this.getAttribute('target-id')
      const target = targetId ? this.ownerDocument.getElementById(targetId) : null

      if (target) this.resizeObserver.observe(target)
    }
  }

  override attributeChangedCallback(name?: string, previousValue?: string | null, value?: string | null): void {
    super.attributeChangedCallback(name, previousValue, value)

    if (name === 'target-id' && this.isConnected) {
      this.observeTarget()

      this.scheduleUpdate()
    }
  }

  override connectedCallback() {
    super.connectedCallback()

    this.abortController?.abort()

    this.abortController = new AbortController()

    window.addEventListener('resize', this.scheduleUpdate, {
      passive: true,
      signal: this.abortController.signal
    })

    window.addEventListener('scroll', this.scheduleUpdate, {
      passive: true,
      signal: this.abortController.signal
    })

    this.observeTarget()

    this.update()
  }

  override disconnectedCallback() {
    this.resizeObserver?.disconnect()

    this.abortController?.abort()

    this.abortController = undefined

    if (this.frame && typeof cancelAnimationFrame !== 'undefined') {
      cancelAnimationFrame(this.frame)
    }

    this.frame = 0
  }
}

export const lumenDialogElementConfig = {
  attributeClasses: {
    glass: {
      strong: 'ui-dialog--glass ui-glass-strong',
      subtle: 'ui-dialog--glass ui-glass-subtle',
      true: 'ui-dialog--glass'
    },
    layout: { fullscreen: 'ui-dialog--fullscreen' }
  },
  baseClassName: 'ui-dialog',
  defaults: { 'data-ui-dialog': '', layout: 'centered' },
  tagName: 'lumen-dialog'
} as const satisfies LumenElementConfig
export class LumenDialogElement extends LumenDialogBehaviorElement {
  static override config = { ...lumenDialogElementConfig, observedAttributes: observedAttributeNames }
}
export const defineLumenDialog = (registry: LumenCustomElementRegistry = customElements): void => {
  defineLumenElement(lumenDialogElementConfig, LumenDialogElement, registry)
}

export const lumenAnchorElementConfig = {
  baseClassName: 'ui-anchor',
  defaults: {
    'aria-label': 'On this page',
    'activation-offset': '96',
    'data-ui-anchor': '',
    'data-ui-anchor-offset': '96'
  },
  tagName: 'lumen-anchor'
} as const satisfies LumenElementConfig
export class LumenAnchorElement extends LumenAnchorBehaviorElement {
  static override config = { ...lumenAnchorElementConfig, observedAttributes: observedAttributeNames }
}
export const defineLumenAnchor = (registry: LumenCustomElementRegistry = customElements): void => {
  defineLumenElement(lumenAnchorElementConfig, LumenAnchorElement, registry)
}

export const lumenScrollProgressElementConfig = {
  observedAttributes: ['position', 'target-id'],
  attributeClasses: {
    position: { bottom: 'ui-scroll-progress--bottom' }
  },
  baseClassName: 'ui-scroll-progress',
  defaults: {
    'aria-label': 'Reading progress',
    'aria-valuemax': '100',
    'aria-valuemin': '0',
    'aria-valuenow': '0',
    'data-ui-scroll-progress': '',
    position: 'top',
    role: 'progressbar'
  },
  tagName: 'lumen-scroll-progress'
} as const satisfies LumenElementConfig
export class LumenScrollProgressElement extends LumenScrollProgressBehaviorElement {
  static override config = { ...lumenScrollProgressElementConfig, observedAttributes: observedAttributeNames }
}
export const defineLumenScrollProgress = (registry: LumenCustomElementRegistry = customElements): void => {
  defineLumenElement(lumenScrollProgressElementConfig, LumenScrollProgressElement, registry)
}

export const lumenSearchFieldElementConfig = {
  baseClassName: 'ui-input ui-search-field',
  defaults: { type: 'search' },
  tagName: 'lumen-search-field'
} as const satisfies LumenElementConfig
export class LumenSearchFieldElement extends LumenScalarFormControlElement {
  static override config = { ...lumenSearchFieldElementConfig, observedAttributes: observedAttributeNames }
}
export const defineLumenSearchField = (registry: LumenCustomElementRegistry = customElements): void => {
  defineLumenElement(lumenSearchFieldElementConfig, LumenSearchFieldElement, registry)
}

export const lumenCollapsibleElementConfig = {
  baseClassName: 'ui-collapsible',
  defaults: { 'data-ui-collapsible': '' },
  tagName: 'lumen-collapsible'
} as const satisfies LumenElementConfig
export const LumenCollapsibleElement = createLumenElementClass(lumenCollapsibleElementConfig)
export const defineLumenCollapsible = (registry: LumenCustomElementRegistry = customElements): void => {
  defineLumenElement(lumenCollapsibleElementConfig, LumenCollapsibleElement, registry)
}

export const lumenEmptyElementConfig = {
  attributeClasses: {
    glass: { strong: 'ui-empty--glass ui-glass-strong', subtle: 'ui-empty--glass ui-glass-subtle', true: 'ui-empty--glass' },
    variant: { compact: 'ui-empty--compact' }
  },
  baseClassName: 'ui-empty',
  defaults: { variant: 'default' },
  tagName: 'lumen-empty'
} as const satisfies LumenElementConfig
export const LumenEmptyElement = createLumenElementClass(lumenEmptyElementConfig)
export const defineLumenEmpty = (registry: LumenCustomElementRegistry = customElements): void => {
  defineLumenElement(lumenEmptyElementConfig, LumenEmptyElement, registry)
}

export const lumenKbdElementConfig = { baseClassName: 'ui-kbd', tagName: 'lumen-kbd' } as const satisfies LumenElementConfig
export const LumenKbdElement = createLumenElementClass(lumenKbdElementConfig)
export const defineLumenKbd = (registry: LumenCustomElementRegistry = customElements): void => {
  defineLumenElement(lumenKbdElementConfig, LumenKbdElement, registry)
}

export const lumenLinkElementConfig = {
  attributeClasses: { variant: { inherit: 'ui-link--inherit' } },
  baseClassName: 'ui-link',
  defaults: { 'data-slot': 'link' },
  tagName: 'lumen-link'
} as const satisfies LumenElementConfig
export const LumenLinkElement = createLumenElementClass(lumenLinkElementConfig)
export const defineLumenLink = (registry: LumenCustomElementRegistry = customElements): void => {
  defineLumenElement(lumenLinkElementConfig, LumenLinkElement, registry)
}

export const lumenSkipLinkElementConfig = { baseClassName: 'ui-skip-link', tagName: 'lumen-skip-link' } as const satisfies LumenElementConfig
export const LumenSkipLinkElement = createLumenElementClass(lumenSkipLinkElementConfig)
export const defineLumenSkipLink = (registry: LumenCustomElementRegistry = customElements): void => {
  defineLumenElement(lumenSkipLinkElementConfig, LumenSkipLinkElement, registry)
}

export const lumenDialogBodyElementConfig = {
  baseClassName: 'ui-dialog-body',
  defaults: { 'data-slot': 'dialog-body' },
  tagName: 'lumen-dialog-body'
} as const satisfies LumenElementConfig
export const LumenDialogBodyElement = createLumenElementClass(lumenDialogBodyElementConfig)

export const lumenDialogHeaderElementConfig = {
  baseClassName: 'ui-dialog-header',
  defaults: { 'data-slot': 'dialog-header' },
  tagName: 'lumen-dialog-header'
} as const satisfies LumenElementConfig
export const LumenDialogHeaderElement = createLumenElementClass(lumenDialogHeaderElementConfig)

export const lumenDialogFooterElementConfig = {
  baseClassName: 'ui-dialog-footer',
  defaults: { 'data-slot': 'dialog-footer' },
  tagName: 'lumen-dialog-footer'
} as const satisfies LumenElementConfig
export const LumenDialogFooterElement = createLumenElementClass(lumenDialogFooterElementConfig)

export const lumenDialogTitleElementConfig = {
  baseClassName: 'ui-dialog-title',
  defaults: { 'data-slot': 'dialog-title' },
  tagName: 'lumen-dialog-title'
} as const satisfies LumenElementConfig
export const LumenDialogTitleElement = createLumenElementClass(lumenDialogTitleElementConfig)

export const lumenDialogCloseElementConfig = {
  baseClassName: 'ui-dialog-close',
  defaults: { 'data-slot': 'dialog-close', 'data-ui-dialog-close': '' },
  tagName: 'lumen-dialog-close'
} as const satisfies LumenElementConfig
export const LumenDialogCloseElement = createLumenElementClass(lumenDialogCloseElementConfig)

export const defineLumenDialogParts = (registry?: LumenCustomElementRegistry): void => {
  for (const [config, element] of [
    [lumenDialogBodyElementConfig, LumenDialogBodyElement],
    [lumenDialogHeaderElementConfig, LumenDialogHeaderElement],
    [lumenDialogFooterElementConfig, LumenDialogFooterElement],
    [lumenDialogTitleElementConfig, LumenDialogTitleElement],
    [lumenDialogCloseElementConfig, LumenDialogCloseElement]
  ] as const) {
    defineLumenElement(config, element, registry)
  }
}
