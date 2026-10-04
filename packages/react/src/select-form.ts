import type { RefObject } from 'react'
import { useEffect } from 'react'

export const useSelectFormReset = (
  rootRef: RefObject<HTMLElement | null>,
  defaultValue: string,
  value: string | undefined,
  restoreValue: (value: string) => void,
  close: () => void
): void => {
  useEffect(() => {
    const root = rootRef.current

    if (!root) return

    const resets = new Set<Event>()
    let timer: ReturnType<typeof setTimeout> | undefined

    const reset = (event: Event) => {
      const native = root.querySelector<HTMLSelectElement>('[data-ui-select-native]')

      if (!native) return

      if (event.target !== native.form) return

      resets.add(event)

      if (timer !== undefined) return

      timer = setTimeout(() => {
        timer = undefined

        const accepted = [...resets].some(resetEvent => !resetEvent.defaultPrevented)

        resets.clear()

        if (!accepted || !root.isConnected) return

        const next = value ?? defaultValue

        restoreValue(next)

        native.value = next

        close()
      })
    }

    root.ownerDocument.addEventListener('reset', reset, true)

    return () => {
      clearTimeout(timer)

      resets.clear()

      root.ownerDocument.removeEventListener('reset', reset, true)
    }
  }, [close, defaultValue, restoreValue, rootRef, value])
}
