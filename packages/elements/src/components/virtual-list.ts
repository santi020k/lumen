import { createLumenVirtualListController, type LumenVirtualListController } from '@santi020k/lumen-core/virtual-list'

import {
  defineLumenElement,
  type LumenCustomElementRegistry,
  LumenElement,
  type LumenElementConfig
} from '../element-base.js'

export const lumenVirtualListElementConfig = {
  attributeClasses: {
    glass: {
      true: 'ui-virtual-list--glass',
      subtle: 'ui-virtual-list--glass ui-glass-subtle',
      strong: 'ui-virtual-list--glass ui-glass-strong'
    }
  },
  baseClassName: 'ui-virtual-list',
  defaults: { 'data-ui-virtual-list': '', tabindex: '0' },
  tagName: 'lumen-virtual-list'
} as const satisfies LumenElementConfig

export class LumenVirtualListElement extends LumenElement {
  static override config = lumenVirtualListElementConfig

  private controller: LumenVirtualListController | undefined

  override connectedCallback(): void {
    super.connectedCallback()

    this.controller?.destroy()

    this.controller = createLumenVirtualListController(this)
  }

  override disconnectedCallback(): void {
    this.controller?.destroy()

    this.controller = undefined
  }
}

export const defineLumenVirtualList = (registry?: LumenCustomElementRegistry): void => {
  defineLumenElement(lumenVirtualListElementConfig, LumenVirtualListElement, registry)
}
