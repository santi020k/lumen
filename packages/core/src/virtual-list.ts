import { getVirtualRange } from './data.js'

export interface LumenVirtualListController {
  destroy: () => void
  update: () => void
}

/** Fixed-height DOM windowing; rows remain mounted so application state is retained. */
export const createLumenVirtualListController = (root: HTMLElement): LumenVirtualListController => {
  const document = root.ownerDocument
  const view = document.defaultView
  const originalRows = new Map<HTMLElement, { hidden: HTMLElement['hidden'], blockSize: string, boxSizing: string }>()

  const spacers = ['start', 'end'].map(position => {
    const spacer = document.createElement('div')

    spacer.dataset.uiVirtualListSpacer = position

    spacer.setAttribute('aria-hidden', 'true')

    return spacer
  })

  const [before, after] = spacers

  if (!before || !after) throw new Error('Virtual list spacers are required')

  let destroyed = false
  let previousRange = ''

  const readNumber = (dataName: string, name: string, fallback: number, minimum: number): number => {
    const value = Number(root.getAttribute(dataName) ?? root.getAttribute(name) ?? fallback)

    return Number.isFinite(value) && value >= minimum && value <= Number.MAX_SAFE_INTEGER ? value : fallback
  }

  const restoreRow = (row: HTMLElement): void => {
    const original = originalRows.get(row)

    if (!original) return

    row.hidden = original.hidden

    row.style.blockSize = original.blockSize

    row.style.boxSizing = original.boxSizing

    originalRows.delete(row)
  }

  const syncRows = (): HTMLElement[] => {
    const children = [...root.children].filter(
      (child): child is HTMLElement => child instanceof HTMLElement && child !== before && child !== after
    )

    const childSet = new Set(children)

    for (const row of originalRows.keys()) {
      if (!childSet.has(row)) restoreRow(row)
    }

    for (const row of children) {
      if (!originalRows.has(row)) originalRows.set(row, {
        hidden: row.hidden,
        blockSize: row.style.blockSize,
        boxSizing: row.style.boxSizing
      })
    }

    return children.filter(row => !originalRows.get(row)?.hidden)
  }

  const getViewport = (): number => {
    const padding = view?.getComputedStyle(root)
    const start = Number.parseFloat(padding?.paddingTop ?? '0') || 0
    const end = Number.parseFloat(padding?.paddingBottom ?? '0') || 0

    return Math.max(0, root.clientHeight - start - end)
  }

  const update = (): void => {
    if (destroyed) return

    const rows = syncRows()
    const size = readNumber('data-ui-item-size', 'item-size', 44, 1)
    const overscan = readNumber('data-ui-overscan', 'overscan', 4, 0)
    const viewport = getViewport()
    const maximumOffset = Math.max(0, rows.length * size - viewport)

    if (root.scrollTop > maximumOffset) root.scrollTop = maximumOffset

    const range = getVirtualRange(root.scrollTop, viewport, size, rows.length, overscan)
    const focusedIndex = rows.findIndex(row => row.contains(document.activeElement))

    // Keep the focused row and its neighbors available for native sequential Tab navigation.
    if (focusedIndex >= 0) {
      range.startIndex = Math.min(range.startIndex, Math.max(0, focusedIndex - 1))

      range.endIndex = Math.max(range.endIndex, Math.min(rows.length - 1, focusedIndex + 1))
    }

    for (const [index, row] of rows.entries()) {
      row.style.blockSize = `${size}px`

      row.style.boxSizing = 'border-box'

      row.hidden = index < range.startIndex || index > range.endIndex
    }

    before.style.blockSize = `${range.startIndex * size}px`

    after.style.blockSize = `${Math.max(0, rows.length - range.endIndex - 1) * size}px`

    // React or an application may append new rows after the trailing spacer.
    if (root.firstElementChild !== before) root.prepend(before)

    if (root.lastElementChild !== after) root.append(after)

    root.dataset.uiRangeStart = String(range.startIndex)

    root.dataset.uiRangeEnd = String(range.endIndex)

    const rangeKey = `${range.startIndex}:${range.endIndex}:${rows.length}`

    if (rangeKey !== previousRange) {
      previousRange = rangeKey

      root.dispatchEvent(new CustomEvent('ui:virtual-list-range', { bubbles: true, detail: range }))
    }
  }

  const observer = new MutationObserver(update)
  const resizeObserver = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(update)

  const onFocusOut = (): void => {
    queueMicrotask(update)
  }

  root.addEventListener('scroll', update, { passive: true })

  root.addEventListener('focusin', update)

  root.addEventListener('focusout', onFocusOut)

  view?.addEventListener('resize', update)

  update()

  observer.observe(root, {
    childList: true,
    attributes: true,
    attributeFilter: ['data-ui-item-size', 'data-ui-overscan', 'item-size', 'overscan']
  })

  resizeObserver?.observe(root)

  return {
    update,
    destroy: () => {
      destroyed = true

      observer.disconnect()

      resizeObserver?.disconnect()

      root.removeEventListener('scroll', update)

      root.removeEventListener('focusin', update)

      root.removeEventListener('focusout', onFocusOut)

      view?.removeEventListener('resize', update)

      for (const row of originalRows.keys()) restoreRow(row)

      for (const spacer of spacers) spacer.remove()

      delete root.dataset.uiRangeStart

      delete root.dataset.uiRangeEnd
    }
  }
}
