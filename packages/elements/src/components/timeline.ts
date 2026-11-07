import { defineLumenElement, type LumenCustomElementRegistry, LumenElement, type LumenElementConfig } from '../element-base.js'

export const lumenTimelineElementConfig = {
  baseClassName: 'ui-timeline',
  defaults: { 'data-slot': 'timeline' },
  role: 'list',
  tagName: 'lumen-timeline'
} as const satisfies LumenElementConfig

const decorateItem = (item: HTMLLIElement): void => {
  item.classList.add('ui-timeline-item')

  item.dataset.slot = 'timeline-item'

  if (item.querySelector(':scope > [data-slot="timeline-item-content"]')) return

  const tail = item.ownerDocument.createElement('div')
  const dot = item.ownerDocument.createElement('div')
  const content = item.ownerDocument.createElement('div')
  const suppliedDot = item.querySelector(':scope > [slot="dot"]')

  for (const [element, part] of [[tail, 'tail'], [dot, 'dot'], [content, 'content']] as const) {
    element.className = `ui-timeline-item__${part}`

    element.dataset.slot = `timeline-item-${part}`
  }

  tail.setAttribute('aria-hidden', 'true')

  if (suppliedDot) dot.append(suppliedDot)

  content.append(...item.childNodes)

  item.append(tail, dot, content)
}

/** Native list-item children retain their nodes, listeners, and optional named dot. */
export class LumenTimelineElement extends LumenElement {
  static override config = lumenTimelineElementConfig
  #observer: MutationObserver | undefined

  override connectedCallback(): void {
    super.connectedCallback()

    this.#observer?.disconnect()

    this.#decorate()

    this.#observer = new MutationObserver(() => {
      this.#decorate()
    })

    this.#observer.observe(this, { childList: true, subtree: true })
  }

  override disconnectedCallback(): void {
    this.#observer?.disconnect()

    this.#observer = undefined
  }

  #decorate(): void {
    for (const child of this.children) {
      if (child instanceof HTMLLIElement) decorateItem(child)
    }
  }
}

export const defineLumenTimeline = (registry?: LumenCustomElementRegistry): void => {
  defineLumenElement(lumenTimelineElementConfig, LumenTimelineElement, registry)
}
