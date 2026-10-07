import {
  bindLumenChartMotion,
  bindLumenMotionGroup,
  createLumenSpotlightController,
  type LumenWorkflowDuration,
  normalizeLumenEffectIntensity
} from '@santi020k/lumen-core'

import { LumenElement, type LumenElementConfig } from '../element-base.js'

export const lumenMotionGroupElementConfig = {
  baseClassName: 'ui-motion-group',
  defaults: { 'data-ui-motion-group': '' },
  observedAttributes: ['duration', 'enter-exit'],
  tagName: 'lumen-motion-group'
} as const satisfies LumenElementConfig

export class LumenMotionGroupElement extends LumenElement {
  static override config = lumenMotionGroupElementConfig
  private cleanup: (() => void) | undefined

  override connectedCallback(): void {
    super.connectedCallback()

    this.bind()
  }

  override disconnectedCallback(): void {
    this.cleanup?.()

    this.cleanup = undefined
  }

  override attributeChangedCallback(): void {
    super.attributeChangedCallback()

    if (this.isConnected) this.bind()
  }

  private bind(): void {
    this.cleanup?.()

    const value = this.getAttribute('duration')
    const duration: LumenWorkflowDuration = value === 'fast' || value === 'slow' ? value : 'standard'

    this.cleanup = bindLumenMotionGroup(this, { duration, enterExit: this.getAttribute('enter-exit') !== 'false' })
  }
}

export const lumenChartMotionElementConfig = {
  baseClassName: 'ui-chart-motion',
  defaults: { 'data-ui-chart-motion': '' },
  observedAttributes: ['duration'],
  tagName: 'lumen-chart-motion'
} as const satisfies LumenElementConfig

export class LumenChartMotionElement extends LumenElement {
  static override config = lumenChartMotionElementConfig
  private cleanup: (() => void) | undefined
  override connectedCallback(): void {
    super.connectedCallback()

    this.bind()
  }

  override disconnectedCallback(): void {
    this.cleanup?.()

    this.cleanup = undefined
  }

  override attributeChangedCallback(): void {
    super.attributeChangedCallback()

    if (this.isConnected) this.bind()
  }

  private bind(): void {
    this.cleanup?.()

    const duration = this.getAttribute('duration')

    this.cleanup = bindLumenChartMotion(this, duration === 'fast' || duration === 'slow' ? duration : 'standard')
  }
}

export const lumenVisualEffectElementConfig = {
  baseClassName: 'ui-visual-effect',
  observedAttributes: ['variant', 'animated', 'intensity'],
  tagName: 'lumen-visual-effect'
} as const satisfies LumenElementConfig

export class LumenVisualEffectElement extends LumenElement {
  static override config = lumenVisualEffectElementConfig
  private cleanup: (() => void) | undefined

  override connectedCallback(): void {
    super.connectedCallback()

    this.update()
  }

  override disconnectedCallback(): void {
    this.cleanup?.()

    this.cleanup = undefined
  }

  override attributeChangedCallback(): void {
    super.attributeChangedCallback()

    if (this.isConnected) this.update()
  }

  private update(): void {
    this.cleanup?.()

    this.cleanup = undefined

    this.dataset.uiVisualEffect = this.getAttribute('variant') ?? 'mesh'

    this.dataset.uiEffectAnimated = String(this.hasAttribute('animated') && this.getAttribute('animated') !== 'false')

    const raw = this.getAttribute('intensity')

    this.style.setProperty('--ui-effect-intensity', String(normalizeLumenEffectIntensity(raw === null ? undefined : Number(raw))))

    if (this.dataset.uiVisualEffect === 'spotlight') this.cleanup = createLumenSpotlightController(this)
  }
}
