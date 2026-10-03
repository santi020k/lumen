import { type LumenVirtualWindow, observeLumenVirtualWindow } from './virtual-window.js'

export interface LumenVirtualCollectionOptions<T> {
  getKey: (item: T, index: number) => string | number
  items: readonly T[]
  itemSize?: number
  overscan?: number
  renderItem: (item: T, index: number, previous?: HTMLElement) => HTMLElement
}
export interface LumenVirtualCollectionController<T> {
  destroy: () => void
  update: (items: readonly T[]) => void
}

interface CollectionEntry<T> { index: number, item: T, key: string | number }

const positionRow = (root: HTMLElement, row: HTMLElement, index: number, count: number, itemSize: number): void => {
  if (root.getAttribute('role') === 'list') {
    row.setAttribute('role', 'listitem')

    row.setAttribute('aria-posinset', String(index + 1))

    row.setAttribute('aria-setsize', String(count))
  }

  row.dataset.uiVirtualListIndex = String(index)

  row.style.position = 'absolute'

  row.style.insetInline = '0'

  row.style.top = `${index * itemSize}px`

  row.style.height = `${itemSize}px`

  row.style.boxSizing = 'border-box'
}

const insertRow = (content: HTMLElement, row: HTMLElement, previousRow?: HTMLElement): void => {
  if (row.previousElementSibling !== (previousRow ?? null) || row.parentElement !== content) {
    content.insertBefore(row, previousRow ? previousRow.nextSibling : content.firstChild)
  }
}

const restoreFocus = (root: HTMLElement, focused: Element | null, ownedFocus: boolean): void => {
  if (!ownedFocus || !(focused instanceof HTMLElement) || focused === root.ownerDocument.activeElement) return

  if (root.contains(focused)) focused.focus({ preventScroll: true })
  else root.focus({ preventScroll: true })
}

/** Data mode owns an empty VirtualList root; only its visible window and focused neighbors mount. */
export const createLumenVirtualCollectionController = <T>(
  root: HTMLElement,
  options: LumenVirtualCollectionOptions<T>
): LumenVirtualCollectionController<T> => {
  if (root.childElementCount) throw new Error('VirtualList data mode requires an empty root.')

  const content = root.ownerDocument.createElement('div')
  const previousMode = root.getAttribute('data-ui-virtual-list-mode')
  const rows = new Map<string | number, { index: number, item: T, row: HTMLElement }>()
  let destroyed = false
  let observer: ReturnType<typeof observeLumenVirtualWindow> | undefined

  const entriesFor = (items: readonly T[]) => {
    const keys = new Set<string | number>()

    return Array.from(items, (item, index) => {
      const key = String(options.getKey(item, index))

      if (keys.has(key)) throw new Error(`VirtualList item keys must be unique: ${key}`)

      keys.add(key)

      return { item, key, index }
    })
  }

  let entries = entriesFor(options.items)

  content.dataset.uiVirtualListContent = ''

  content.style.position = 'relative'

  root.dataset.uiVirtualListMode = 'data'

  root.append(content)

  const updateFocus = (): void => {
    const active = root.ownerDocument.activeElement
    const focused = [...rows].find(([, rendered]) => rendered.row.contains(active))
    const entry = focused ? entries.find(item => item.key === focused[0]) : undefined

    if (entry && focused) focused[1].row.dataset.uiVirtualListIndex = String(entry.index)
  }

  const getRow = (entry: CollectionEntry<T>): HTMLElement => {
    const index = entry.index
    let rendered = rows.get(entry.key)

    if (!rendered) {
      const row = root.ownerDocument.createElement('div')

      row.append(options.renderItem(entry.item, index))

      rendered = { index, item: entry.item, row }

      rows.set(entry.key, rendered)
    } else if (rendered.item !== entry.item || rendered.index !== index) {
      const previous = rendered.row.firstElementChild
      const element = options.renderItem(entry.item, index, previous instanceof HTMLElement ? previous : undefined)

      if (element !== previous) rendered.row.replaceChildren(element)

      rendered.item = entry.item

      rendered.index = index
    }

    return rendered.row
  }

  const render = (window: LumenVirtualWindow): void => {
    const focused = root.ownerDocument.activeElement
    const ownedFocus = root.contains(focused)

    content.style.height = `${window.totalSize}px`

    const visibleKeys = new Set<string | number>()
    let previousRow: HTMLElement | undefined

    for (const index of window.indexes) {
      const entry = entries[index]

      if (!entry) continue

      visibleKeys.add(entry.key)

      const row = getRow(entry)

      positionRow(root, row, index, entries.length, window.itemSize)

      insertRow(content, row, previousRow)

      previousRow = row
    }

    for (const [key, rendered] of rows) {
      if (!visibleKeys.has(key)) {
        rendered.row.remove()

        rows.delete(key)
      }
    }

    restoreFocus(root, focused, ownedFocus)
  }

  const observe = (): void => {
    observer?.destroy()

    observer = observeLumenVirtualWindow(root, {
      itemCount: entries.length, itemSize: options.itemSize ?? 44, overscan: options.overscan ?? 4, onChange: render
    })
  }

  observe()

  return {
    update: items => {
      if (destroyed) return

      // Validate the complete new key set before replacing the live collection.
      const next = entriesFor(items)

      entries = next

      updateFocus()

      observe()
    },
    destroy: () => {
      destroyed = true

      observer?.destroy()

      content.remove()

      rows.clear()

      if (previousMode === null) delete root.dataset.uiVirtualListMode
      else root.setAttribute('data-ui-virtual-list-mode', previousMode)
    }
  }
}
