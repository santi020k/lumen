import {
  bindLumenMediaViewport,
  lumenMediaViewportActions,
  type LumenMediaViewportLabels,
  lumenMediaViewportLabels,
  syncLumenMediaViewport
} from '@santi020k/lumen-core/media-viewport'
import { type LumenMediaViewportValue, normalizeLumenMediaViewport } from '@santi020k/lumen-core/media-workspace'

import { defineLumenElement, type LumenCustomElementRegistry, LumenElement, type LumenElementConfig } from '../element-base.js'

export const lumenMediaViewportElementConfig = {
  baseClassName: 'ui-media-viewport',
  observedAttributes: ['label', 'disabled', 'max-zoom', 'zoom', 'pan-x', 'pan-y', 'ratio', 'locale', 'lang'],
  tagName: 'lumen-media-viewport'
} as const satisfies LumenElementConfig

export class LumenMediaViewportElement extends LumenElement {
  static override config = lumenMediaViewportElementConfig
  private cleanup: (() => void) | undefined
  private stage: HTMLDivElement | undefined
  private copy: LumenMediaViewportLabels = lumenMediaViewportLabels

  get value(): LumenMediaViewportValue {
    return normalizeLumenMediaViewport({ zoom: Number(this.getAttribute('zoom') ?? 1), x: Number(this.getAttribute('pan-x') ?? 0), y: Number(this.getAttribute('pan-y') ?? 0) }, this.maxZoom)
  }

  set value(value: LumenMediaViewportValue) {
    const next = normalizeLumenMediaViewport(value, this.maxZoom)

    this.setAttribute('zoom', String(next.zoom))

    this.setAttribute('pan-x', String(next.x))

    this.setAttribute('pan-y', String(next.y))
  }

  set labels(value: Partial<LumenMediaViewportLabels>) {
    this.copy = { ...lumenMediaViewportLabels, ...value }

    this.update()
  }

  private get maxZoom(): number {
    return Number(this.getAttribute('max-zoom') ?? 4)
  }

  override connectedCallback(): void {
    super.connectedCallback()

    if (!this.stage) this.createContent()

    this.cleanup?.()

    this.cleanup = bindLumenMediaViewport(this, {
      disabled: () => this.hasAttribute('disabled'),
      getValue: () => this.value,
      maxZoom: () => this.maxZoom,
      onValueChange: value => {
        this.value = value

        this.dispatchEvent(new CustomEvent<LumenMediaViewportValue>('ui:media-viewport-change', { bubbles: true, detail: value }))
      }
    })

    this.update()
  }

  override disconnectedCallback(): void {
    this.cleanup?.()

    this.cleanup = undefined
  }

  override attributeChangedCallback(): void {
    super.attributeChangedCallback()

    this.update()
  }

  private createContent(): void {
    const stage = this.ownerDocument.createElement('div')
    const content = this.ownerDocument.createElement('div')
    const caption = this.ownerDocument.createElement('div')
    const status = this.ownerDocument.createElement('span')
    const actions = this.ownerDocument.createElement('div')

    stage.className = 'ui-media-viewport__stage'

    stage.dataset.uiMediaViewportStage = ''

    stage.tabIndex = 0

    stage.setAttribute('role', 'group')

    content.className = 'ui-media-viewport__content'

    content.dataset.uiMediaViewportContent = ''

    content.append(...this.childNodes)

    stage.append(content)

    status.dataset.uiMediaViewportStatus = ''

    status.id = `media-viewport-${crypto.randomUUID()}`

    status.setAttribute('role', 'status')

    status.setAttribute('aria-live', 'polite')

    stage.setAttribute('aria-describedby', status.id)

    actions.className = 'ui-media-viewport__actions'

    actions.setAttribute('role', 'group')

    for (const action of lumenMediaViewportActions) {
      const button = this.ownerDocument.createElement('button')

      button.type = 'button'

      button.className = 'ui-button ui-button--outline'

      button.dataset.uiMediaViewportAction = action

      actions.append(button)
    }

    caption.className = 'ui-media-viewport__caption'

    caption.append(status, actions)

    this.append(stage, caption)

    this.stage = stage
  }

  private get locale(): string | undefined {
    return this.getAttribute('locale') ?? this.closest('[lang]')?.getAttribute('lang') ?? undefined
  }

  private update(): void {
    if (!this.stage) return

    const ratio = Number(this.getAttribute('ratio') ?? 16 / 9)
    const label = this.getAttribute('label') ?? 'Media preview'

    this.stage.style.aspectRatio = String(Number.isFinite(ratio) && ratio >= 0.1 && ratio <= 10 ? ratio : 16 / 9)

    this.stage.setAttribute('aria-label', label)

    this.querySelector('.ui-media-viewport__actions')?.setAttribute('aria-label', label)

    for (const [index, action] of lumenMediaViewportActions.entries()) {
      const button = this.querySelectorAll<HTMLButtonElement>('button[data-ui-media-viewport-action]')[index]

      if (button) button.textContent = this.copy[action]
    }

    syncLumenMediaViewport(this, this.value, this.maxZoom, this.hasAttribute('disabled'), this.locale)
  }
}

export const defineLumenMediaViewport = (registry?: LumenCustomElementRegistry): void => {
  defineLumenElement(lumenMediaViewportElementConfig, LumenMediaViewportElement, registry)
}
