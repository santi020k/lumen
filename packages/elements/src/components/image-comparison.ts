import {
  formatLumenImageComparisonValue,
  type LumenImageComparisonChangeDetail,
  normalizeLumenImageComparisonRatio,
  normalizeLumenImageComparisonValue } from '@santi020k/lumen-core'

import {
  defineLumenElement,
  type LumenCustomElementRegistry,
  LumenElement,
  type LumenElementConfig
} from '../element-base.js'

export const lumenImageComparisonElementConfig = {
  baseClassName: 'ui-image-comparison',
  observedAttributes: ['after-label', 'before-label', 'disabled', 'fit', 'label', 'lang', 'locale', 'name', 'ratio', 'value'],
  tagName: 'lumen-image-comparison'
} as const satisfies LumenElementConfig

export class LumenImageComparisonElement extends LumenElement {
  static override config = lumenImageComparisonElementConfig

  private abortController: AbortController | undefined
  private frame: HTMLDivElement | undefined
  private range: HTMLInputElement | undefined
  private beforeLabel: HTMLSpanElement | undefined
  private afterLabel: HTMLSpanElement | undefined
  private controlLabel: HTMLSpanElement | undefined

  get value(): number {
    return normalizeLumenImageComparisonValue(this.getAttribute('value'))
  }

  set value(value: number) {
    this.setAttribute('value', String(normalizeLumenImageComparisonValue(value)))
  }

  override connectedCallback(): void {
    super.connectedCallback()

    this.connect()

    queueMicrotask(() => {
      if (this.isConnected && !this.range) this.connect()
    })
  }

  override disconnectedCallback(): void {
    this.abortController?.abort()

    this.abortController = undefined
  }

  override attributeChangedCallback(): void {
    super.attributeChangedCallback()

    this.update()
  }

  private connect(): void {
    if (!this.range) this.createContent()

    if (!this.range) return

    this.abortController?.abort()

    this.abortController = new AbortController()

    const { signal } = this.abortController

    this.range.addEventListener('input', () => {
      if (!this.range || this.range.disabled) return

      this.value = this.range.valueAsNumber

      this.dispatchEvent(new CustomEvent<LumenImageComparisonChangeDetail>('ui:image-comparison-change', {
        bubbles: true,
        detail: { value: this.value }
      }))
    }, { signal })

    this.ownerDocument.addEventListener('reset', event => {
      const range = this.range

      if (!range) return

      if (event.target !== range.form) return

      window.setTimeout(() => {
        if (signal.aborted || event.defaultPrevented || !this.isConnected) return

        this.value = normalizeLumenImageComparisonValue(range.defaultValue)
      })
    }, { capture: true, signal })

    this.update()
  }

  private createContent(): void {
    const before = this.querySelector(':scope > [slot="before"]')
    const after = this.querySelector(':scope > [slot="after"]')

    if (!before || !after) return

    this.frame = this.ownerDocument.createElement('div')

    this.frame.className = 'ui-image-comparison__frame'

    const beforeLayer = this.ownerDocument.createElement('div')
    const afterLayer = this.ownerDocument.createElement('div')
    const divider = this.ownerDocument.createElement('div')

    beforeLayer.className = 'ui-image-comparison__before'

    afterLayer.className = 'ui-image-comparison__after'

    divider.className = 'ui-image-comparison__divider'

    divider.setAttribute('aria-hidden', 'true')

    beforeLayer.append(before)

    afterLayer.append(after)

    this.frame.append(beforeLayer, afterLayer, divider)

    const labels = this.ownerDocument.createElement('div')

    labels.className = 'ui-image-comparison__labels'

    labels.setAttribute('aria-hidden', 'true')

    this.beforeLabel = this.ownerDocument.createElement('span')

    this.afterLabel = this.ownerDocument.createElement('span')

    labels.append(this.beforeLabel, this.afterLabel)

    const control = this.ownerDocument.createElement('label')

    control.className = 'ui-image-comparison__control'

    this.controlLabel = this.ownerDocument.createElement('span')

    this.range = this.ownerDocument.createElement('input')

    this.range.className = 'ui-slider ui-image-comparison__range'

    this.range.type = 'range'

    this.range.min = '0'

    this.range.max = '100'

    this.range.step = '1'

    this.range.defaultValue = String(this.value)

    control.append(this.controlLabel, this.range)

    this.prepend(this.frame, labels, control)
  }

  private get afterText(): string {
    return this.getAttribute('after-label') ?? 'After'
  }

  private get locale(): string | undefined {
    return this.getAttribute('locale') || this.closest('[lang]')?.getAttribute('lang') || undefined
  }

  private update(): void {
    if (!this.range || !this.frame || !this.beforeLabel || !this.afterLabel || !this.controlLabel) return

    const afterLabel = this.afterText
    const locale = this.locale

    this.beforeLabel.textContent = this.getAttribute('before-label') ?? 'Before'

    this.afterLabel.textContent = afterLabel

    this.controlLabel.textContent = this.getAttribute('label') ?? 'Compare images'

    this.dataset.fit = this.getAttribute('fit') === 'contain' ? 'contain' : 'cover'

    this.frame.style.setProperty('--ui-image-comparison-ratio', String(normalizeLumenImageComparisonRatio(this.getAttribute('ratio'))))

    this.frame.style.setProperty('--ui-image-comparison-position', `${this.value}%`)

    this.range.value = String(this.value)

    this.range.disabled = this.hasAttribute('disabled')

    this.range.name = this.getAttribute('name') ?? ''

    this.range.ariaValueText = formatLumenImageComparisonValue(this.value, afterLabel, locale)
  }
}

export const defineLumenImageComparison = (registry?: LumenCustomElementRegistry): void => {
  defineLumenElement(lumenImageComparisonElementConfig, LumenImageComparisonElement, registry)
}
