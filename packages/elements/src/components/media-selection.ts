import { formatLumenMediaThumbnailState, resolveLumenMediaOrder, resolveLumenMediaThumbnailState } from '@santi020k/lumen-core/media-workspace'

import { defineLumenElement, type LumenCustomElementRegistry, LumenElement, type LumenElementConfig } from '../element-base.js'

export const lumenMediaThumbnailElementConfig = {
  baseClassName: 'ui-media-thumbnail',
  observedAttributes: ['label', 'media-id', 'selected', 'order', 'state', 'state-label', 'disabled'],
  tagName: 'lumen-media-thumbnail'
} as const satisfies LumenElementConfig

export class LumenMediaThumbnailElement extends LumenElement {
  static override config = lumenMediaThumbnailElementConfig
  private button: HTMLButtonElement | undefined
  private labelNode: HTMLSpanElement | undefined
  private orderNode: HTMLSpanElement | undefined
  private stateNode: HTMLSpanElement | undefined

  override connectedCallback(): void {
    super.connectedCallback()

    if (!this.button) this.createContent()

    this.update()
  }

  override attributeChangedCallback(): void {
    super.attributeChangedCallback()

    this.update()
  }

  private createContent(): void {
    const button = this.ownerDocument.createElement('button')
    const media = this.ownerDocument.createElement('span')
    const content = this.ownerDocument.createElement('span')

    button.className = 'ui-button ui-button--outline ui-media-thumbnail'

    button.type = 'button'

    content.className = 'ui-button__content'

    media.className = 'ui-media-thumbnail__media'

    media.setAttribute('aria-hidden', 'true')

    media.append(...this.childNodes)

    this.labelNode = this.ownerDocument.createElement('span')

    this.labelNode.className = 'ui-media-thumbnail__label'

    this.orderNode = this.ownerDocument.createElement('span')

    this.orderNode.className = 'ui-media-thumbnail__order'

    this.stateNode = this.ownerDocument.createElement('span')

    this.stateNode.className = 'ui-media-thumbnail__state'

    content.append(media, this.labelNode, this.orderNode, this.stateNode)

    button.append(content)

    button.addEventListener('click', () => {
      const id = this.getAttribute('media-id')

      if (button.disabled || !id) return

      this.dispatchEvent(new CustomEvent('ui:media-selection-request', {
        bubbles: true, detail: { id, selected: !this.hasAttribute('selected') }
      }))
    })

    this.append(button)

    this.button = button
  }

  private update(): void {
    if (!this.button || !this.labelNode || !this.orderNode || !this.stateNode) return

    const rawState = this.getAttribute('state')
    const state = resolveLumenMediaThumbnailState(rawState)
    const order = resolveLumenMediaOrder(Number(this.getAttribute('order')))

    this.button.dataset.state = state

    this.button.disabled = this.hasAttribute('disabled') || state !== 'ready'

    this.button.setAttribute('aria-pressed', String(this.hasAttribute('selected')))

    this.button.setAttribute('aria-busy', String(state === 'loading'))

    this.labelNode.textContent = this.getAttribute('label') ?? ''

    this.orderNode.hidden = order === undefined

    this.orderNode.textContent = this.orderNode.hidden ? '' : String(order)

    this.stateNode.hidden = state === 'ready'

    this.stateNode.textContent = formatLumenMediaThumbnailState(state, this.getAttribute('state-label') ?? undefined)
  }
}

export const lumenMediaFilmstripElementConfig = {
  baseClassName: 'ui-media-filmstrip',
  observedAttributes: ['label', 'selection-label'],
  tagName: 'lumen-media-filmstrip'
} as const satisfies LumenElementConfig

export class LumenMediaFilmstripElement extends LumenElement {
  static override config = lumenMediaFilmstripElementConfig
  private labelNode: HTMLSpanElement | undefined
  private summary: HTMLSpanElement | undefined

  override connectedCallback(): void {
    super.connectedCallback()

    if (!this.summary) {
      const heading = this.ownerDocument.createElement('div')
      const list = this.ownerDocument.createElement('ol')

      heading.className = 'ui-media-filmstrip__heading'

      list.className = 'ui-media-filmstrip__items'

      this.labelNode = this.ownerDocument.createElement('span')

      this.summary = this.ownerDocument.createElement('span')

      this.summary.setAttribute('role', 'status')

      heading.append(this.labelNode, this.summary)

      list.append(...this.childNodes)

      this.append(heading, list)
    }

    this.update()
  }

  override attributeChangedCallback(): void {
    super.attributeChangedCallback()

    this.update()
  }

  private update(): void {
    const label = this.getAttribute('label') ?? 'Media selection'

    this.setAttribute('role', 'region')

    this.setAttribute('aria-label', label)

    if (this.labelNode) this.labelNode.textContent = label

    if (this.summary) this.summary.textContent = this.getAttribute('selection-label') ?? ''
  }
}

export const defineLumenMediaThumbnail = (registry?: LumenCustomElementRegistry): void => {
  defineLumenElement(lumenMediaThumbnailElementConfig, LumenMediaThumbnailElement, registry)
}

export const defineLumenMediaFilmstrip = (registry?: LumenCustomElementRegistry): void => {
  defineLumenElement(lumenMediaFilmstripElementConfig, LumenMediaFilmstripElement, registry)
}
