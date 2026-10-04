import { getVirtualRange } from './data.js'

export interface LumenVirtualWindow {
  endIndex: number
  indexes: number[]
  itemSize: number
  startIndex: number
  totalSize: number
}
export interface LumenVirtualWindowOptions {
  itemCount: number
  itemSize?: number
  onChange: (window: LumenVirtualWindow) => void
  overscan?: number
}

const normalizeCount = (count: number): number => Number.isSafeInteger(count) && count > 0 ? count : 0

const normalizeSize = (size: number, count: number): number => {
  if (!Number.isFinite(size) || size <= 0 || size > Number.MAX_SAFE_INTEGER / Math.max(1, count)) return 44

  return size
}

const pinFocus = (indexes: Set<number>, focusedIndex: number, count: number): void => {
  if (!Number.isSafeInteger(focusedIndex) || focusedIndex < 0 || focusedIndex >= count) return

  const end = Math.min(count - 1, focusedIndex + 1)

  for (let index = Math.max(0, focusedIndex - 1); index <= end; index += 1) indexes.add(index)
}

export const getLumenVirtualWindow = (
  offset: number,
  viewport: number,
  itemCount: number,
  itemSize = 44,
  overscan = 4,
  focusedIndex = -1
): LumenVirtualWindow => {
  const count = normalizeCount(itemCount)
  const size = normalizeSize(itemSize, count)
  const range = getVirtualRange(offset, viewport, size, count, overscan)
  const indexes = new Set<number>()

  for (let index = range.startIndex; index <= range.endIndex; index += 1) indexes.add(index)

  // Retain focused content and its Tab neighbors without mounting the intervening rows.
  pinFocus(indexes, focusedIndex, count)

  return {
    ...range, indexes: [...indexes].sort((first, second) => first - second), itemSize: size, totalSize: count * size
  }
}

const getViewport = (root: HTMLElement): number => {
  const styles = root.ownerDocument.defaultView?.getComputedStyle(root)
  const start = Number.parseFloat(styles?.paddingTop ?? '0') || 0
  const end = Number.parseFloat(styles?.paddingBottom ?? '0') || 0

  return Math.max(0, root.clientHeight - start - end)
}

const getFocusedIndex = (root: HTMLElement): number => {
  const active = root.ownerDocument.activeElement
  const elementClass = root.ownerDocument.defaultView?.HTMLElement
  const row = elementClass && active instanceof elementClass ? active.closest<HTMLElement>('[data-ui-virtual-list-index]') : null

  return row?.closest('[data-ui-virtual-list]') === root ? Number(row.dataset.uiVirtualListIndex) : -1
}

export const observeLumenVirtualWindow = (
  root: HTMLElement, options: LumenVirtualWindowOptions
): { destroy: () => void, update: () => void } => {
  const view = root.ownerDocument.defaultView
  let destroyed = false
  let previous = ''

  const update = (): void => {
    if (destroyed) return

    const viewport = getViewport(root)

    const window = getLumenVirtualWindow(
      root.scrollTop, viewport, options.itemCount, options.itemSize, options.overscan, getFocusedIndex(root)
    )

    root.scrollTop = Math.min(root.scrollTop, Math.max(0, window.totalSize - viewport))

    const signature = `${window.itemSize}:${window.totalSize}:${window.startIndex}:${window.endIndex}:${window.indexes.join(',')}`

    if (signature === previous) return

    previous = signature

    root.dataset.uiRangeStart = String(window.startIndex)

    root.dataset.uiRangeEnd = String(window.endIndex)

    options.onChange(window)

    root.dispatchEvent(new CustomEvent('ui:virtual-list-range', { bubbles: true, detail: { startIndex: window.startIndex, endIndex: window.endIndex } }))
  }

  const onFocusOut = (): void => {
    queueMicrotask(update)
  }

  const resize = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(update)

  root.addEventListener('scroll', update, { passive: true })

  root.addEventListener('focusin', update)

  root.addEventListener('focusout', onFocusOut)

  view?.addEventListener('resize', update)

  resize?.observe(root)

  update()

  return {
    update,
    destroy: () => {
      destroyed = true

      resize?.disconnect()

      root.removeEventListener('scroll', update)

      root.removeEventListener('focusin', update)

      root.removeEventListener('focusout', onFocusOut)

      view?.removeEventListener('resize', update)

      delete root.dataset.uiRangeStart

      delete root.dataset.uiRangeEnd
    }
  }
}
