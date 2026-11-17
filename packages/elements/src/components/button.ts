import {
  defineLumenElement,
  type LumenCustomElementRegistry,
  LumenElement,
  type LumenElementConfig
} from '../element-base.js'

export const lumenButtonElementConfig = {
  attributeClasses: {
    variant: {
      default: 'ui-button--default',
      destructive: 'ui-button--destructive',
      ghost: 'ui-button--ghost',
      link: 'ui-button--link',
      outline: 'ui-button--outline',
      secondary: 'ui-button--secondary'
    },
    size: {
      default: 'ui-button--default-size',
      icon: 'ui-button--icon',
      lg: 'ui-button--lg',
      sm: 'ui-button--sm'
    },
    disabled: { true: 'ui-button--disabled' },
    loading: { true: 'ui-button--loading' }
  },
  baseClassName: 'ui-button',
  defaults: {
    'data-slot': 'button',
    role: 'button',
    size: 'default',
    tabindex: '0',
    variant: 'default'
  },
  observedAttributes: ['variant', 'size', 'disabled', 'loading', 'aria-busy', 'aria-disabled'],
  role: 'button',
  tagName: 'lumen-button'
} as const satisfies LumenElementConfig

export class LumenButtonElement extends LumenElement {
  static override config = lumenButtonElementConfig
  private spacePressed = false
  private applyingSemantics = false
  private activationTimers = new Set<ReturnType<typeof setTimeout>>()

  private hasBlockingAttribute(): boolean {
    return ['disabled', 'loading'].some(name => this.hasAttribute(name) && this.getAttribute(name) !== 'false')
  }

  private isLoading(): boolean {
    return this.hasAttribute('loading') && this.getAttribute('loading') !== 'false'
  }

  // Persist the original value so cloned and serialized buttons can release generated state.
  private syncManagedSemantic(name: 'aria-busy' | 'aria-disabled', active: boolean): void {
    const ownership = `data-ui-button-${name}`
    const recorded = this.getAttribute(ownership)

    this.applyingSemantics = true

    try {
      if (active) {
        if (recorded === null) {
          const original = this.getAttribute(name)

          this.setAttribute(ownership, original === null ? 'absent' : `value:${original}`)
        }

        this.setAttribute(name, 'true')
      } else if (recorded !== null) {
        this.removeAttribute(ownership)

        if (this.getAttribute(name) !== 'true') return

        if (recorded === 'absent') this.removeAttribute(name)
        else if (recorded.startsWith('value:')) this.setAttribute(name, recorded.slice(6))
      }
    } finally {
      this.applyingSemantics = false
    }
  }

  private syncBusySemantics(): void {
    this.syncManagedSemantic('aria-busy', this.isLoading())
  }

  private syncDisabledSemantics(): void {
    this.syncManagedSemantic('aria-disabled', this.hasBlockingAttribute())
  }

  private isBlocked(): boolean {
    return this.hasBlockingAttribute() || this.getAttribute('aria-disabled') === 'true'
  }

  private afterDispatch(event: Event, activate: () => void): void {
    const timer = setTimeout(() => {
      this.activationTimers.delete(timer)

      if (this.isConnected && !event.defaultPrevented && !this.isBlocked()) activate()
    }, 0)

    this.activationTimers.add(timer)
  }

  private activateAfterDispatch(event: KeyboardEvent): void {
    this.afterDispatch(event, () => {
      this.click()
    })
  }

  private submitForm(): void {
    if (this.getAttribute('type')?.toLowerCase() !== 'submit') return

    const submitter = this.ownerDocument.createElement('button')

    submitter.type = 'submit'

    submitter.hidden = true

    for (const name of ['form', 'name', 'value', 'formaction', 'formenctype', 'formmethod', 'formnovalidate', 'formtarget']) {
      const value = this.getAttribute(name)

      if (value !== null) submitter.setAttribute(name, value)
    }

    // Let the native submitter resolve form ownership, inherited disabled state,
    // constraint validation, submitter data, and per-button submission overrides.
    this.append(submitter)

    try {
      const form = submitter.form

      if (form && !submitter.matches(':disabled')) {
        HTMLFormElement.prototype.requestSubmit.call(form, submitter)
      }
    } finally {
      submitter.remove()
    }
  }

  private onKeyDown = (event: KeyboardEvent): void => {
    if (event.target !== this || event.defaultPrevented || event.repeat || event.isComposing || this.isBlocked()) return

    if (event.key === 'Enter') this.activateAfterDispatch(event)

    if (event.key === ' ') {
      event.preventDefault()

      this.spacePressed = true
    }
  }

  private onKeyUp = (event: KeyboardEvent): void => {
    if (event.key !== ' ') return

    const spacePressed = this.spacePressed

    this.spacePressed = false

    if (event.target === this && spacePressed && !event.isComposing) this.activateAfterDispatch(event)
  }

  private onBlur = (): void => {
    this.spacePressed = false
  }

  private onClick = (event: MouseEvent): void => {
    if (this.isBlocked()) {
      event.preventDefault()

      event.stopImmediatePropagation()

      return
    }

    if (this.getAttribute('type')?.toLowerCase() !== 'submit') return

    const nestedNativeControl = event.composedPath().some(target => (
      target instanceof HTMLButtonElement || target instanceof HTMLInputElement
    ))

    if (nestedNativeControl) return

    this.afterDispatch(event, () => {
      this.submitForm()
    })
  }

  override connectedCallback(): void {
    super.connectedCallback()

    this.syncDisabledSemantics()

    this.syncBusySemantics()

    this.addEventListener('keydown', this.onKeyDown)

    this.addEventListener('keyup', this.onKeyUp)

    this.addEventListener('blur', this.onBlur)

    this.addEventListener('click', this.onClick, true)
  }

  override attributeChangedCallback(name?: string, previousValue?: string | null, value?: string | null): void {
    super.attributeChangedCallback(name, previousValue, value)

    if (this.applyingSemantics) return

    if ((name === 'aria-busy' || name === 'aria-disabled') && previousValue !== null && previousValue !== undefined) {
      this.removeAttribute(`data-ui-button-${name}`)
    }

    if (!this.isConnected) return

    this.syncDisabledSemantics()

    this.syncBusySemantics()
  }

  override disconnectedCallback(): void {
    this.spacePressed = false

    for (const timer of this.activationTimers) clearTimeout(timer)

    this.activationTimers.clear()

    this.removeEventListener('keydown', this.onKeyDown)

    this.removeEventListener('keyup', this.onKeyUp)

    this.removeEventListener('blur', this.onBlur)

    this.removeEventListener('click', this.onClick, true)

    super.disconnectedCallback()
  }
}

export const defineLumenButton = (
  registry?: LumenCustomElementRegistry
): void => {
  defineLumenElement(lumenButtonElementConfig, LumenButtonElement, registry)
}
