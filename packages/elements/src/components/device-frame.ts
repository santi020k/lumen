import { type LumenDeviceFrameDevice, observeLumenDeviceFrame, resolveLumenDeviceFrame } from '@santi020k/lumen-core'

import { defineLumenElement, type LumenCustomElementRegistry, LumenElement, type LumenElementConfig } from '../element-base.js'

export const lumenDeviceFrameElementConfig = {
  baseClassName: 'ui-device-frame',
  defaults: { 'data-device': 'laptop', 'data-tone': 'dark' },
  observedAttributes: ['device', 'orientation', 'tone', 'screen-width', 'screen-height', 'scroll'],
  tagName: 'lumen-device-frame'
} as const satisfies LumenElementConfig

export class LumenDeviceFrameElement extends LumenElement {
  static override config = lumenDeviceFrameElementConfig
  private screen: HTMLDivElement | undefined
  private cleanup: (() => void) | undefined

  override connectedCallback(): void {
    super.connectedCallback()

    if (!this.screen) {
      const shell = this.ownerDocument.createElement('div')
      const camera = this.ownerDocument.createElement('span')
      const screen = this.ownerDocument.createElement('div')
      const base = this.ownerDocument.createElement('span')

      shell.className = 'ui-device-frame__shell'

      camera.className = 'ui-device-frame__camera'

      camera.setAttribute('aria-hidden', 'true')

      screen.className = 'ui-device-frame__screen'

      base.className = 'ui-device-frame__base'

      base.setAttribute('aria-hidden', 'true')

      screen.append(...this.childNodes)

      shell.append(camera, screen)

      this.append(shell, base)

      this.screen = screen
    }

    this.update()
  }

  override attributeChangedCallback(): void {
    super.attributeChangedCallback()

    if (this.isConnected) this.update()
  }

  override disconnectedCallback(): void {
    this.cleanup?.()

    this.cleanup = undefined
  }

  private update(): void {
    const screen = this.screen

    if (!screen) return

    const rawDevice = this.getAttribute('device')
    const device: LumenDeviceFrameDevice = rawDevice === 'iphone' || rawDevice === 'android' || rawDevice === 'tablet' || rawDevice === 'desktop' ? rawDevice : 'laptop'
    const rawOrientation = this.getAttribute('orientation')
    const orientation = rawOrientation === 'portrait' || rawOrientation === 'landscape' ? rawOrientation : undefined
    const size = resolveLumenDeviceFrame(device, orientation, Number(this.getAttribute('screen-width')), Number(this.getAttribute('screen-height')))

    this.dataset.device = device

    this.dataset.tone = this.getAttribute('tone') === 'light' ? 'light' : 'dark'

    screen.dataset.scroll = String(this.getAttribute('scroll') !== 'false')

    screen.style.aspectRatio = `${size.width} / ${size.height}`

    screen.style.setProperty('--ui-device-frame-width', `${size.width}px`)

    screen.style.setProperty('--ui-device-frame-height', `${size.height}px`)

    this.cleanup?.()

    this.cleanup = observeLumenDeviceFrame(screen, size.width)
  }
}

export const defineLumenDeviceFrame = (registry?: LumenCustomElementRegistry): void => {
  defineLumenElement(lumenDeviceFrameElementConfig, LumenDeviceFrameElement, registry)
}
