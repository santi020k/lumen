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
  #inputIdentity: [HTMLInputElement, string, string] | undefined

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
    super.attributeChangedCallback()

    if (!this.#amountController || !this.isConnected || oldValue === newValue) return

    if (name === 'value') this.#amountController.setValue(newValue ?? '')
    else this.#mountAmount()
  }

  #mountAmount() {
    this.#amountController?.destroy()

    const input = this.#input('data-ui-amount-input')
    const submission = this.#input('data-ui-amount-value')

    input.type = 'text'

    input.inputMode = 'decimal'

    input.classList.add('ui-input', 'ui-amount-field')

    submission.type = 'hidden'

    this.#forward(submission, ['name', 'form'])

    this.#forward(input, [
      'form', 'aria-label', 'aria-labelledby', 'aria-describedby', 'placeholder', 'disabled', 'readonly', 'required'
    ])

    const previous = this.#inputIdentity
    const authored = previous?.[0] === input && previous[2] === input.id ? previous[1] : input.id
    const id = this.id ? `${this.id}-input` : authored

    this.#inputIdentity = [input, authored, id]

    if (id) input.id = id
    else input.removeAttribute('id')

    submission.disabled = input.disabled

    this.#amountController = createLumenAmountFieldController(this, detail => {
      this.value = detail.draft
    })
  }

  #forward(input: HTMLInputElement, names: readonly string[]) {
    for (const name of names) {
      const value = this.getAttribute(name)

      if (value === null) input.removeAttribute(name)
      else input.setAttribute(name, value)
    }
  }

  #input(attribute: string): HTMLInputElement {
    const existing = this.querySelector<HTMLInputElement>(`[${attribute}]`)

    if (existing) return existing

    const input = this.ownerDocument.createElement('input')

    input.setAttribute(attribute, '')

    this.append(input)

    return input
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
