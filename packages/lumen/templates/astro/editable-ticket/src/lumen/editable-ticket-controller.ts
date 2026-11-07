type Value = Readonly<{ name: string, venue: string }>

type Field = keyof Value

export class LumenEditableTicket extends HTMLElement {
  private value: Value | undefined
  private previous: Value | undefined
  private active: Field | undefined
  private opener: HTMLButtonElement | undefined
  private controller: AbortController | undefined

  private get<T extends Element>(selector: string, type: new() => T): T {
    const result = this.querySelector<T>(selector)

    if (!(result instanceof type)) throw new Error('Missing ticket element: ' + selector)

    return result
  }

  connectedCallback(): void {
    if (this.controller) return

    this.value ??= { name: this.get('[data-name]', HTMLElement).textContent, venue: this.get('[data-venue]', HTMLElement).textContent }

    this.controller = new AbortController()

    const options = { signal: this.controller.signal }

    for (const button of this.querySelectorAll<HTMLButtonElement>('[data-edit]')) {
      button.hidden = false

      button.addEventListener('click', () => {
        const field = button.dataset.edit

        if (field === 'name' || field === 'venue') this.open(field, button)
      }, options)
    }

    this.get('[data-undo]', HTMLElement).hidden = false

    this.get('[data-undo]', HTMLElement).addEventListener('click', () => {
      this.undo()
    }, options)

    this.get('[data-cancel]', HTMLElement).addEventListener('click', () => {
      this.close(false)
    }, options)

    this.get('[data-editor]', HTMLElement).addEventListener('submit', event => {
      event.preventDefault()

      this.close(true)
    }, options)

    this.addEventListener('keydown', event => {
      if (this.active && event.key === 'Escape') {
        event.preventDefault()

        this.close(false)
      }

      if (event.key === 'Enter' && event.isComposing) event.preventDefault()
    }, options)

    for (const input of this.querySelectorAll<HTMLInputElement>('input')) {
      input.addEventListener('input', () => {
        input.setCustomValidity('')

        if (this.active && this.value) this.render({ ...this.value, [this.active]: input.value })
      }, options)
    }

    this.render()
  }

  disconnectedCallback(): void {
    this.controller?.abort()

    this.controller = undefined

    this.active = undefined

    this.opener = undefined

    this.get('[data-editor]', HTMLElement).hidden = true

    this.render()
  }

  private render(value = this.value): void {
    if (!value) return

    for (const field of ['name', 'venue'] as const) {
      for (const node of this.querySelectorAll('[data-' + field + ']')) node.textContent = value[field]
    }

    const undo = this.get('[data-undo]', HTMLButtonElement)

    undo.disabled = !this.previous || Boolean(this.active)

    undo.classList.toggle('ui-button--disabled', undo.disabled)
  }

  private open(field: Field, button: HTMLButtonElement): void {
    if (!this.value) return

    if (this.active) this.close(false)

    this.active = field

    this.opener = button

    for (const key of ['name', 'venue'] as const) {
      const input = this.get('input[name="' + key + '"]', HTMLInputElement)

      input.value = this.value[key]

      input.disabled = key !== field

      input.setCustomValidity('')

      this.get('[data-field="' + key + '"]', HTMLElement).hidden = key !== field
    }

    this.get('[data-editor]', HTMLElement).hidden = false

    const input = this.get('input[name="' + field + '"]', HTMLInputElement)

    input.focus()

    input.select()

    this.render()
  }

  private close(save: boolean): void {
    if (!this.active || !this.value) return

    const input = this.get('input[name="' + this.active + '"]', HTMLInputElement)
    const text = input.value.trim()

    if (save && !this.validate(input, text)) return

    if (save && text !== this.value[this.active]) {
      this.previous = this.value

      this.value = { ...this.value, [this.active]: text }

      this.changed('save')
    }

    this.active = undefined

    this.get('[data-editor]', HTMLElement).hidden = true

    this.render()

    this.get('[data-status]', HTMLElement).textContent = save ? 'Event updated.' : 'Edit cancelled.'

    this.opener?.focus()

    this.opener = undefined
  }

  private validate(input: HTMLInputElement, text: string): boolean {
    if (text && text.length <= 120) return true

    input.setCustomValidity(text ? 'Use at most 120 characters.' : 'Enter a value.')

    input.reportValidity()

    return false
  }

  private undo(): void {
    if (!this.previous || this.active) return

    this.value = this.previous

    this.previous = undefined

    this.render()

    this.get('[data-status]', HTMLElement).textContent = 'Edit undone.'

    this.changed('undo')

    this.get('[data-edit="name"]', HTMLButtonElement).focus()
  }

  private changed(reason: 'save' | 'undo'): void {
    this.dispatchEvent(new CustomEvent('ui:event-change', { bubbles: true, detail: { value: { ...this.value }, reason } }))
  }
}

export const registerEditableTickets = (): void => {
  if (!customElements.get('lumen-editable-ticket')) customElements.define('lumen-editable-ticket', LumenEditableTicket)
}
