import { createLumenComboboxController, type LumenComboboxController } from '@santi020k/lumen-core'

import {
  defineLumenElement,
  type LumenCustomElementRegistry,
  LumenElement,
  type LumenElementConfig
} from '../element-base.js'

export const lumenComboboxElementConfig = {
  baseClassName: 'ui-combobox',
  defaults: { 'data-ui-combobox': '' },
  tagName: 'lumen-combobox'
} as const satisfies LumenElementConfig

export class LumenComboboxElement extends LumenElement {
  static override config = lumenComboboxElementConfig

  #controller: LumenComboboxController | undefined
  #observer: MutationObserver | undefined
  #input: HTMLInputElement | null = null
  #list: HTMLElement | null = null

  #bind(): void {
    const input = this.querySelector<HTMLInputElement>('input[role="combobox"]')
    const list = this.querySelector<HTMLElement>('[role="listbox"]')

    if (input === this.#input && list === this.#list) return

    this.#controller?.destroy()

    this.#input = input

    this.#list = list

    this.#controller = input && list ? createLumenComboboxController(this) : undefined
  }

  override connectedCallback() {
    super.connectedCallback()

    this.#observer?.disconnect()

    this.#bind()

    this.#observer = new MutationObserver(() => {
      this.#bind()
    })

    this.#observer.observe(this, { childList: true, subtree: true })
  }

  override disconnectedCallback() {
    this.#observer?.disconnect()

    this.#observer = undefined

    this.#controller?.destroy()

    this.#controller = undefined

    this.#input = null

    this.#list = null
  }
}

export const defineLumenCombobox = (
  registry?: LumenCustomElementRegistry
): void => {
  defineLumenElement(
    lumenComboboxElementConfig, LumenComboboxElement, registry
  )
}
