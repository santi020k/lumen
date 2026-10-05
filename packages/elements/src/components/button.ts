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
  role: 'button',
  tagName: 'lumen-button'
} as const satisfies LumenElementConfig

export class LumenButtonElement extends LumenElement {
  static override config = lumenButtonElementConfig
  private spacePressed = false
  private managedDisabled = false
  private originalAriaDisabled: string | null = null

  private hasBlockingAttribute(): boolean {
    return ['disabled', 'loading'].some(name => this.hasAttribute(name) && this.getAttribute(name) !== 'false')
  }

  private syncDisabledSemantics(): void {
    if (this.hasBlockingAttribute()) {
      if (!this.managedDisabled) this.originalAriaDisabled = this.getAttribute('aria-disabled')

      this.managedDisabled = true

      this.setAttribute('aria-disabled', 'true')
    } else if (this.managedDisabled) {
      this.managedDisabled = false

      if (this.originalAriaDisabled === null) this.removeAttribute('aria-disabled')
      else this.setAttribute('aria-disabled', this.originalAriaDisabled)
    }
  }

  private isBlocked(): boolean {
    return this.hasBlockingAttribute() || this.getAttribute('aria-disabled') === 'true'
  }

  private activateAfterDispatch(event: KeyboardEvent): void {
    queueMicrotask(() => {
      if (this.isConnected && !event.defaultPrevented && !this.isBlocked()) this.click()
    })
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
    if (!this.isBlocked()) return

    event.preventDefault()

    event.stopImmediatePropagation()
  }

  override connectedCallback(): void {
    super.connectedCallback()

    this.syncDisabledSemantics()

    this.addEventListener('keydown', this.onKeyDown)

    this.addEventListener('keyup', this.onKeyUp)

    this.addEventListener('blur', this.onBlur)

    this.addEventListener('click', this.onClick, true)
  }

  override attributeChangedCallback(name?: string, previousValue?: string | null, value?: string | null): void {
    super.attributeChangedCallback(name, previousValue, value)

    this.syncDisabledSemantics()
  }

  override disconnectedCallback(): void {
    this.spacePressed = false

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
