import { useCallback, useRef, useState } from 'react'
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native'

import {
  createLumenNavigationVisibilityState,
  resolveLumenNavigationVisibility
} from './platform-recipes.js'

export interface LumenNavigationBarVisibilityOptions {
  initiallyVisible?: boolean
  threshold?: number
}

export interface LumenNavigationBarVisibilityController {
  hide: () => void
  onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void
  show: () => void
  visible: boolean
}

/**
 * Produces scroll-driven visibility for bottom navigation without owning the application's list.
 * Pass `onScroll` to a native scroll container and `visible` to LumenCollapsibleNavigationBar.
 */
export const useLumenNavigationBarVisibility = ({
  initiallyVisible = true,
  threshold = 16
}: LumenNavigationBarVisibilityOptions = {}): LumenNavigationBarVisibilityController => {
  const navigationStateRef = useRef(
    createLumenNavigationVisibilityState(initiallyVisible)
  )

  const [visible, setVisible] = useState(initiallyVisible)

  const updateVisibility = useCallback((nextVisible: boolean) => {
    navigationStateRef.current = {
      ...navigationStateRef.current,
      accumulatedDelta: 0,
      visible: nextVisible
    }

    setVisible(nextVisible)
  }, [])

  const onScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const nextState = resolveLumenNavigationVisibility(
        navigationStateRef.current,
        event.nativeEvent.contentOffset.y,
        threshold
      )

      navigationStateRef.current = nextState

      setVisible(current => current === nextState.visible ? current : nextState.visible)
    },
    [threshold]
  )

  const hide = useCallback(() => {
    updateVisibility(false)
  }, [updateVisibility])

  const show = useCallback(() => {
    updateVisibility(true)
  }, [updateVisibility])

  return { hide, onScroll, show, visible }
}
