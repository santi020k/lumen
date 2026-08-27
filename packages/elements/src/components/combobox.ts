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

let comboboxId = 0
const createComboboxId = (): string => `ui-combobox-list-${++comboboxId}`

const getEventTarget = (event: Event): Node | null => {
  const target = event.composedPath()[0] ?? event.target

  return target instanceof Node ? target : null
}

const getLoopedIndex = (
  key: string,
  currentIndex: number,
  itemCount: number
): number => {
  if (key === 'Home') return 0

  if (key === 'End') return itemCount - 1

  if (key === 'ArrowDown') return (currentIndex + 1) % itemCount

  return (currentIndex - 1 + itemCount) % itemCount
}

export class LumenComboboxElement extends LumenElement {
  static override config = lumenComboboxElementConfig

  private abortController: AbortController | undefined

  override connectedCallback() {
    super.connectedCallback()

    if (typeof document === 'undefined') return

    this.abortController?.abort()

    this.abortController = new AbortController()

    this.setupCombobox(this.abortController.signal)
  }

  override disconnectedCallback() {
    this.abortController?.abort()

    this.abortController = undefined
  }

  private setupCombobox(signal: AbortSignal): void {
    const input = this.querySelector<HTMLInputElement>('input[role="combobox"]')
    const listbox = this.querySelector<HTMLElement>('[role="listbox"]')

    if (!input || !listbox) return

    const items = [...listbox.querySelectorAll<HTMLElement>('[role="option"]')]

    if (!listbox.id) listbox.id = createComboboxId()

    input.setAttribute('aria-autocomplete', input.getAttribute('aria-autocomplete') ?? 'list')

    input.setAttribute('aria-controls', listbox.id)

    const getVisibleItems = (): HTMLElement[] => items.filter(item => (
      !item.hidden && !item.hasAttribute('disabled') &&
      item.getAttribute('aria-disabled') !== 'true'
    ))

    const close = (): void => {
      input.setAttribute('aria-expanded', 'false')

      listbox.hidden = true

      listbox.dataset.state = 'closed'
    }

    const open = (): void => {
      input.setAttribute('aria-expanded', 'true')

      listbox.hidden = false

      listbox.dataset.state = 'open'
    }

    const filter = (): void => {
      const query = input.value.trim().toLowerCase()

      for (const item of items) {
        const value = item.getAttribute('data-value') ?? item.textContent.trim()

        item.hidden = Boolean(query) && !value.toLowerCase().includes(query)
      }
    }

    const select = (item: HTMLElement): void => {
      input.value = item.getAttribute('data-value') ?? item.textContent.trim()

      input.dispatchEvent(new Event('input', { bubbles: true }))

      input.dispatchEvent(new Event('change', { bubbles: true }))

      input.focus({ preventScroll: true })

      close()
    }

    const focusItem = (item: HTMLElement, key: string): void => {
      const visibleItems = getVisibleItems()

      if (!visibleItems.length) return

      const currentIndex = Math.max(0, visibleItems.indexOf(item))

      visibleItems[
        getLoopedIndex(key, currentIndex, visibleItems.length)
      ]?.focus()
    }

    close()

    input.addEventListener('focus', open, { signal })

    input.addEventListener('input', () => {
      filter()

      open()
    }, { signal })

    input.addEventListener('keydown', event => {
      if (event.key === 'Escape') {
        close()

        return
      }

      if (!['ArrowDown', 'ArrowUp', 'Enter'].includes(event.key)) return

      const visibleItems = getVisibleItems()

      if (!visibleItems.length) return

      event.preventDefault()

      open()

      if (event.key === 'Enter') {
        const firstVisibleItem = visibleItems.at(0)

        if (firstVisibleItem) select(firstVisibleItem)

        return
      }

      const targetIndex = event.key === 'ArrowUp' ? visibleItems.length - 1 : 0

      visibleItems[targetIndex]?.focus()
    }, { signal })

    for (const item of items) {
      item.tabIndex = -1

      item.addEventListener('click', () => {
        select(item)
      }, { signal })

      item.addEventListener('keydown', event => {
        if (event.key === 'Escape') {
          close()

          input.focus({ preventScroll: true })

          return
        }

        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()

          select(item)

          return
        }

        if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return

        event.preventDefault()

        focusItem(item, event.key)
      }, { signal })
    }

    document.addEventListener('pointerdown', event => {
      const target = getEventTarget(event)

      if (target && !this.contains(target)) close()
    }, { signal })
  }
}

export const defineLumenCombobox = (
  registry?: LumenCustomElementRegistry
): void => {
  defineLumenElement(
    lumenComboboxElementConfig, LumenComboboxElement, registry
  )
}
