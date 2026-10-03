import type { ComponentPropsWithRef } from 'react'
import { useCallback, useEffect, useRef } from 'react'

import { composeClassName, createLumenVirtualListController } from '@santi020k/lumen-core'

import type { LumenGlassProp } from './components.js'
import { VirtualListData, type VirtualListDataProps } from './virtual-list-data.js'

export interface VirtualListProps extends ComponentPropsWithRef<'div'> {
  glass?: LumenGlassProp
  items?: never
  getKey?: never
  renderItem?: never
  itemSize?: number | string
  overscan?: number | string
}

const MountedVirtualList = ({
  className,
  glass = false,
  itemSize,
  overscan,
  ref,
  tabIndex = 0,
  ...props
}: VirtualListProps) => {
  const rootRef = useRef<HTMLDivElement | null>(null)

  const setRootRef = useCallback((element: HTMLDivElement | null) => {
    rootRef.current = element

    if (typeof ref === 'function') ref(element)
    else if (ref) ref.current = element
  }, [ref])

  useEffect(() => {
    const root = rootRef.current

    if (!root) return

    const controller = createLumenVirtualListController(root)

    return controller.destroy
  }, [])

  return (
    <div
      className={composeClassName(
        'ui-virtual-list', glass && 'ui-virtual-list--glass', glass === 'subtle' && 'ui-glass-subtle', glass === 'strong' && 'ui-glass-strong', className
      )}
      data-ui-item-size={itemSize}
      data-ui-overscan={overscan}
      data-ui-virtual-list
      ref={setRootRef}
      tabIndex={tabIndex}
      {...props}
    />
  )
}

export const VirtualList = <T,>(props: VirtualListProps | VirtualListDataProps<T>) => (
  props.items !== undefined ? <VirtualListData {...props} /> : <MountedVirtualList {...props} />
)

export type { VirtualListDataProps } from './virtual-list-data.js'
