import { type LumenChangeSummaryItem, readLumenChangeSummaryItems } from '@santi020k/lumen-core'

import { defineLumenElement, type LumenCustomElementRegistry, LumenElement, type LumenElementConfig } from '../element-base.js'

export const lumenChangeSummaryElementConfig = {
  baseClassName: 'ui-change-summary',
  observedAttributes: ['label', 'summary', 'before-label', 'after-label', 'changed-label', 'unchanged-label'],
  role: 'region',
  tagName: 'lumen-change-summary'
} as const satisfies LumenElementConfig

const textNode = (document: Document, tag: string, text: string, className?: string): HTMLElement => {
  const node = document.createElement(tag)

  node.textContent = text

  if (className) node.className = className

  return node
}

export class LumenChangeSummaryElement extends LumenElement {
  static override config = lumenChangeSummaryElementConfig
  private records: LumenChangeSummaryItem[] = []
  private content: HTMLDivElement | undefined

  get items(): readonly LumenChangeSummaryItem[] {
    return this.records.map(item => ({ ...item }))
  }

  set items(value: readonly LumenChangeSummaryItem[]) {
    this.records = readLumenChangeSummaryItems(value)

    if (this.isConnected) this.render()
  }

  override connectedCallback(): void {
    super.connectedCallback()

    this.render()
  }

  override attributeChangedCallback(): void {
    super.attributeChangedCallback()

    if (this.isConnected) this.render()
  }

  private renderRecord(item: LumenChangeSummaryItem): HTMLElement {
    const document = this.ownerDocument
    const row = document.createElement('div')
    const term = textNode(document, 'dt', item.label)

    row.className = 'ui-change-summary__item'

    row.dataset.changed = String(item.changed)

    term.append(textNode(document, 'span', this.getAttribute(item.changed ? 'changed-label' : 'unchanged-label') ??
    (item.changed ? 'Changed' : 'Unchanged'), 'ui-change-summary__state'))

    row.append(term)

    for (const [name, value] of [['before', item.before], ['after', item.after]] as const) {
      const detail = document.createElement('dd')

      detail.append(textNode(document, 'span', this.getAttribute(`${name}-label`) ??
      (name === 'before' ? 'Before' : 'After'), 'ui-change-summary__value-label'), document.createTextNode(value))

      row.append(detail)
    }

    return row
  }

  private render(): void {
    const document = this.ownerDocument
    const label = this.getAttribute('label') ?? 'Changes'
    const content = this.content ?? document.createElement('div')
    const list = document.createElement('dl')
    const heading = textNode(document, 'h3', label, 'ui-change-summary__heading')
    const summary = this.getAttribute('summary')

    content.className = 'ui-change-summary'

    this.setAttribute('aria-label', label)

    list.className = 'ui-change-summary__list'

    list.append(...this.records.map(item => this.renderRecord(item)))

    content.replaceChildren(heading)

    if (summary) content.append(textNode(document, 'p', summary, 'ui-change-summary__summary'))

    content.append(list)

    if (!this.content) this.prepend(content)

    this.content = content
  }
}

/** Authored details, controls, active filters, and status retain native semantics. */
export const lumenFilterBarElementConfig = {
  baseClassName: 'ui-filter-bar',
  observedAttributes: [],
  role: 'region',
  tagName: 'lumen-filter-bar'
} as const satisfies LumenElementConfig

export class LumenFilterBarElement extends LumenElement {
  static override config = lumenFilterBarElementConfig
}

export const defineLumenChangeSummary = (registry?: LumenCustomElementRegistry): void => {
  defineLumenElement(lumenChangeSummaryElementConfig, LumenChangeSummaryElement, registry)
}
export const defineLumenFilterBar = (registry?: LumenCustomElementRegistry): void => {
  defineLumenElement(lumenFilterBarElementConfig, LumenFilterBarElement, registry)
}
