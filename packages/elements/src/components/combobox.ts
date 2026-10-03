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

  private controller: LumenComboboxController | undefined

  override connectedCallback() {
    super.connectedCallback()

    this.controller?.destroy()

    this.controller = createLumenComboboxController(this)
  }

  override disconnectedCallback() {
    this.controller?.destroy()

    this.controller = undefined
  }
}

export const defineLumenCombobox = (
  registry?: LumenCustomElementRegistry
): void => {
  defineLumenElement(
    lumenComboboxElementConfig, LumenComboboxElement, registry
  )
}
