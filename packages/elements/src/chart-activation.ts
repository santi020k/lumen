import {
  createLumenChartActivationController,
  type LumenChartDatumActivationDetail,
  parseLumenChartDatumActivation
} from '@santi020k/lumen-core'

import { LumenElement } from './element-base.js'

const escapeAttribute = (value: string): string => value.replaceAll('&', '&amp;')
  .replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')

const datumKey = (detail: LumenChartDatumActivationDetail): string => detail.kind === 'series' ?
  JSON.stringify([detail.kind, detail.seriesId, detail.x, detail.datumId]) :
  JSON.stringify([detail.kind, detail.x, detail.kind === 'heatmap' ? detail.y : null, detail.datumId])

const parseAttribute = (element: Element): LumenChartDatumActivationDetail | null => {
  try {
    const value: unknown = JSON.parse(element.getAttribute('data-ui-chart-datum') ?? 'null')

    return parseLumenChartDatumActivation(value)
  } catch {
    return null
  }
}

/** Property contract shared by the seven registered Elements data chart hosts. */
export interface LumenChartDatumActionsElement extends HTMLElement {
  datumActionFormatter: (context: string) => string
}

/** Shared ownership, action disclosure, and lifecycle for Elements data charts. */
export abstract class LumenDatumChartElement extends LumenElement {
  #controller: ReturnType<typeof createLumenChartActivationController> | undefined
  #datumActionFormatter: ((context: string) => string) | undefined

  get datumActionFormatter(): (context: string) => string {
    return this.#datumActionFormatter ?? (context => `${this.getAttribute('datum-action-prefix') ?? 'Open details: '}${context}`)
  }

  set datumActionFormatter(value: (context: string) => string) {
    this.#datumActionFormatter = value

    if (this.isConnected) this.renderChart()
  }

  override disconnectedCallback(): void {
    this.#controller?.destroy()

    this.#controller = undefined

    super.disconnectedCallback()
  }

  protected abstract renderChart(): void

  protected datumAttributes(detail: LumenChartDatumActivationDetail | null, context: string): string {
    if (!detail || !this.hasAttribute('drilldown') || this.getAttribute('drilldown') === 'false') return ''

    return ` data-ui-chart-datum="${escapeAttribute(JSON.stringify(detail))}" data-ui-chart-datum-label="${escapeAttribute(this.datumActionFormatter(context))}"`
  }

  protected renderChartContent(html: string): void {
    const enabled = this.hasAttribute('drilldown') && this.getAttribute('drilldown') !== 'false'
    const focused = this.ownerDocument.activeElement
    const focusedKey = focused instanceof Element && this.contains(focused) ? focused.getAttribute('data-ui-chart-action-key') : null
    const wasOpen = this.querySelector('[data-ui-chart-actions]')?.hasAttribute('open') ?? false

    this.toggleAttribute('data-ui-chart-activation', enabled)

    if (enabled) this.setAttribute('data-ui-chart-adapter', 'elements')
    else this.removeAttribute('data-ui-chart-adapter')

    this.innerHTML = html

    if (!enabled) {
      this.#controller?.destroy()

      this.#controller = undefined

      return
    }

    this.#controller ??= createLumenChartActivationController(this)

    this.#appendActions(wasOpen, focusedKey)
  }

  #appendActions(wasOpen: boolean, focusedKey: string | null): void {
    const actions = new Map<string, { detail: LumenChartDatumActivationDetail, label: string }>()

    for (const mark of this.querySelectorAll('[data-ui-chart-datum]')) {
      const detail = parseAttribute(mark)

      if (detail) actions.set(datumKey(detail), { detail, label: mark.getAttribute('data-ui-chart-datum-label') ?? this.datumActionFormatter(JSON.stringify(detail)) })
    }

    if (actions.size === 0) return

    const disclosure = this.ownerDocument.createElement('details')

    disclosure.className = 'ui-chart__actions'

    disclosure.setAttribute('data-ui-chart-actions', '')

    disclosure.open = wasOpen

    const summary = this.ownerDocument.createElement('summary')

    summary.textContent = this.getAttribute('explore-data-label') ?? 'Explore chart data'

    disclosure.append(summary)

    const list = this.ownerDocument.createElement('ul')
    let restoreFocus: HTMLButtonElement | undefined

    for (const [key, action] of actions) {
      const item = this.ownerDocument.createElement('li')
      const button = this.ownerDocument.createElement('button')

      button.type = 'button'

      button.className = 'ui-button ui-button--ghost ui-button--default-size'

      button.setAttribute('data-slot', 'button')

      button.setAttribute('data-ui-chart-datum', JSON.stringify(action.detail))

      button.setAttribute('data-ui-chart-action-key', key)

      button.textContent = action.label

      item.append(button)

      list.append(item)

      if (key === focusedKey) restoreFocus = button
    }

    disclosure.append(list)

    this.append(disclosure)

    restoreFocus?.focus({ preventScroll: true })
  }
}
