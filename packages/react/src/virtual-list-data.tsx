'use client'

import type { ComponentPropsWithRef, ReactNode } from 'react'
import { useCallback, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'

import { composeClassName, getLumenVirtualWindow, observeLumenVirtualWindow } from '@santi020k/lumen-core'

import type { LumenGlassProp } from './components.js'

export interface VirtualListDataProps<T> extends Omit<ComponentPropsWithRef<'div'>, 'children'> {
  children?: never
  getKey: (item: T, index: number) => string | number
  glass?: LumenGlassProp
  items: readonly T[]
  itemSize?: number
  overscan?: number
  renderItem: (item: T, index: number) => ReactNode
}

const getRenderedIndexes = (
  visible: readonly number[], focusedKey: string | null, indexesByKey: ReadonlyMap<string, number>, count: number
): number[] => {
  const focusedIndex = focusedKey === null ? -1 : indexesByKey.get(focusedKey) ?? -1
  const indexes = new Set(visible)

  if (focusedIndex >= 0) {
    const end = Math.min(count - 1, focusedIndex + 1)

    for (let index = Math.max(0, focusedIndex - 1); index <= end; index += 1) indexes.add(index)
  }

  return [...indexes].sort((first, second) => first - second)
}

export const VirtualListData = <T,>({
  className, getKey, glass = false, items, itemSize = 44, overscan = 4, renderItem,
  ref, role = 'list', style, tabIndex = 0, onFocusCapture, onBlurCapture, ...props
}: VirtualListDataProps<T>) => {
  const rootRef = useRef<HTMLDivElement | null>(null)
  const focusedElementRef = useRef<HTMLElement | null>(null)
  const [focusedKey, setFocusedKey] = useState<string | null>(null)

  const entries = useMemo(() => {
    const keys = new Set<string | number>()

    return Array.from(items, (item, index) => {
      const key = String(getKey(item, index))

      if (keys.has(key)) throw new Error(`VirtualList item keys must be unique: ${key}`)

      keys.add(key)

      return { item, key }
    })
  }, [getKey, items])

  const indexesByKey = useMemo(() => new Map(entries.map((entry, index) => [entry.key, index])), [entries])

  const store = useMemo(() => {
    const initial = getLumenVirtualWindow(0, 0, items.length, itemSize, overscan)

    return { initial, snapshot: initial }
  }, [itemSize, items.length, overscan])

  const setRootRef = useCallback((element: HTMLDivElement | null) => {
    rootRef.current = element

    if (typeof ref === 'function') ref(element)
    else if (ref) ref.current = element
  }, [ref])

  const subscribe = useCallback((notify: () => void) => {
    const root = rootRef.current

    if (!root) return () => undefined

    const observer = observeLumenVirtualWindow(root, {
      itemCount: items.length,
      itemSize,
      overscan,
      onChange: next => {
        store.snapshot = next

        notify()
      }
    })

    return observer.destroy
  }, [itemSize, items.length, overscan, store])

  const window = useSyncExternalStore(subscribe, () => store.snapshot, () => store.initial)
  const indexes = getRenderedIndexes(window.indexes, focusedKey, indexesByKey, items.length)

  // Browser DOM moves can drop focus during a keyed reorder; restore the retained control afterward.
  useLayoutEffect(() => {
    const root = rootRef.current
    const focused = focusedElementRef.current

    if (!root || !focused || root.ownerDocument.activeElement !== root.ownerDocument.body) return

    if (focused.isConnected && root.contains(focused)) focused.focus({ preventScroll: true })
    else root.focus({ preventScroll: true })
  }, [entries, window])

  return (
    <div
      {...props}
      className={composeClassName('ui-virtual-list', glass && 'ui-virtual-list--glass', glass === 'subtle' && 'ui-glass-subtle', glass === 'strong' && 'ui-glass-strong', className)}
      data-ui-virtual-list
      data-ui-virtual-list-mode="data"
      onFocusCapture={event => {
        onFocusCapture?.(event)

        const target = event.target
        const row = target.closest<HTMLElement>('[data-ui-virtual-list-key]')

        focusedElementRef.current = row ? target : null

        setFocusedKey(row?.dataset.uiVirtualListKey ?? null)
      }}
      onBlurCapture={event => {
        onBlurCapture?.(event)

        if (event.currentTarget.contains(event.relatedTarget)) return

        focusedElementRef.current = null

        setFocusedKey(null)
      }}
      ref={setRootRef}
      role={role}
      style={style}
      tabIndex={tabIndex}
    >
      <div data-ui-virtual-list-content style={{ height: window.totalSize, position: 'relative' }}>
        {indexes.map(index => {
          const entry = entries[index]

          if (!entry) return null

          return (
            <div
              aria-posinset={role === 'list' ? index + 1 : undefined}
              aria-setsize={role === 'list' ? items.length : undefined}
              data-ui-virtual-list-index={index}
              data-ui-virtual-list-key={entry.key}
              key={entry.key}
              role={role === 'list' ? 'listitem' : undefined}
              style={{ boxSizing: 'border-box', height: window.itemSize, insetInline: 0, position: 'absolute', top: index * window.itemSize }}
            >
              {renderItem(entry.item, index)}
            </div>
          )
        })}
      </div>
    </div>
  )
}
