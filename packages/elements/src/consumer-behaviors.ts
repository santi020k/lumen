import { createLumenAmountFieldController, createLumenMessageScrollerController, type LumenAmountFieldController, type LumenMessageScrollerController } from '@santi020k/lumen-core'

import { LumenElement } from './element-base.js'

const lumenAmountFieldElementConfig = {
  baseClassName: 'ui-amount-field-root',
  defaults: { 'data-ui-amount-field': '' },
  tagName: 'lumen-amount-field'
}

export class LumenAmountFieldElement extends LumenElement {
  static override config = lumenAmountFieldElementConfig

  static override get observedAttributes() {
    return ['value', 'locale', 'fraction-digits', 'allow-negative', 'default-value', 'invalid-message', 'name', 'form', 'disabled', 'readonly', 'required', 'id', 'aria-label', 'aria-labelledby', 'aria-describedby', 'placeholder']
  }

  #amountController: LumenAmountFieldController | undefined

  get value(): string {
    return this.getAttribute('value') ?? ''
  }

  set value(draft: string) {
    this.setAttribute('value', draft)
  }

  override connectedCallback() {
    super.connectedCallback()

    this.#mountAmount()
  }

  override attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null) {
    super.attributeChangedCallback(name, oldValue, newValue)

    if (!this.#amountController || !this.isConnected || oldValue === newValue) return

    if (name === 'value') this.#amountController.setValue(newValue ?? '')
    else if (['locale', 'fraction-digits', 'allow-negative', 'default-value', 'invalid-message', 'name', 'form', 'disabled', 'readonly', 'required', 'id', 'aria-label', 'aria-labelledby', 'aria-describedby', 'placeholder'].includes(name)) this.#mountAmount()
  }

  #mountAmount() {
    this.#amountController?.destroy()

    let input = this.querySelector<HTMLInputElement>('[data-ui-amount-input]')
    let submission = this.querySelector<HTMLInputElement>('[data-ui-amount-value]')

    if (!input) {
      input = this.ownerDocument.createElement('input')

      input.setAttribute('data-ui-amount-input', '')

      this.append(input)
    }

    if (!submission) {
      submission = this.ownerDocument.createElement('input')

      submission.setAttribute('data-ui-amount-value', '')

      this.append(submission)
    }

    input.type = 'text'

    input.inputMode = 'decimal'

    input.classList.add('ui-input', 'ui-amount-field')

    submission.type = 'hidden'

    for (const name of ['name', 'form']) {
      const value = this.getAttribute(name)

      if (value === null) submission.removeAttribute(name)
      else submission.setAttribute(name, value)
    }

    for (const name of ['form', 'aria-label', 'aria-labelledby', 'aria-describedby', 'placeholder']) {
      const value = this.getAttribute(name)

      if (value !== null) input.setAttribute(name, value)
      else input.removeAttribute(name)
    }

    if (this.id) input.id = `${this.id}-input`

    input.disabled = this.hasAttribute('disabled')

    submission.disabled = input.disabled

    input.readOnly = this.hasAttribute('readonly')

    input.required = this.hasAttribute('required')

    this.#amountController = createLumenAmountFieldController(this, detail => {
      this.setAttribute('value', detail.draft)
    })
  }

  override disconnectedCallback() {
    this.#amountController?.destroy()

    this.#amountController = undefined
  }
}

const lumenMessageScrollerElementConfig = {
  attributeClasses: {
    glass: {
      strong: 'ui-message-scroller--glass ui-glass-strong',
      subtle: 'ui-message-scroller--glass ui-glass-subtle',
      true: 'ui-message-scroller--glass'
    }
  },
  baseClassName: 'ui-message-scroller',
  tagName: 'lumen-message-scroller'
}

export class MessageElement extends LumenElement {
  static override config = lumenMessageScrollerElementConfig

  static override get observedAttributes() {
    return [...super.observedAttributes, 'auto-scroll', 'scroll-threshold']
  }

  #scrollController: LumenMessageScrollerController | undefined

  override connectedCallback() {
    super.connectedCallback()

    this.#mountScroller()
  }

  override attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null) {
    super.attributeChangedCallback(name, oldValue, newValue)

    if (this.isConnected && oldValue !== newValue && ['auto-scroll', 'scroll-threshold'].includes(name)) this.#mountScroller()
  }

  #mountScroller() {
    this.#scrollController?.destroy()

    this.#scrollController = this.hasAttribute('auto-scroll') ? createLumenMessageScrollerController(this, { threshold: Number(this.getAttribute('scroll-threshold') ?? 32) }) : undefined
  }

  override disconnectedCallback() {
    this.#scrollController?.destroy()

    this.#scrollController = undefined
  }
}
