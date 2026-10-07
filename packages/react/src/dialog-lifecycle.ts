import type { RefObject } from 'react'
import { useEffect, useRef } from 'react'

const openDialogs: HTMLDialogElement[] = []

const removeDialog = (dialog: HTMLDialogElement): void => {
  const index = openDialogs.lastIndexOf(dialog)

  if (index !== -1) openDialogs.splice(index, 1)
}

const getActiveElement = (dialog: HTMLDialogElement): HTMLElement | null => {
  const { activeElement, defaultView } = dialog.ownerDocument

  return defaultView && activeElement instanceof defaultView.HTMLElement ? activeElement : null
}

const restoreDialogFocus = (dialog: HTMLDialogElement, target: HTMLElement | null): void => {
  if (!target?.isConnected) return

  const topDialog = [...openDialogs].reverse().find(candidate => (
    candidate.ownerDocument === dialog.ownerDocument && candidate.isConnected && candidate.open
  ))

  if (topDialog && !topDialog.contains(target)) return

  const active = getActiveElement(dialog)

  if (active && active !== dialog.ownerDocument.body && active !== target && !dialog.contains(active)) return

  target.focus({ preventScroll: true })
}

export const useDialogLifecycle = (
  open: boolean,
  dialogRef: RefObject<HTMLDialogElement | null>,
  triggerRef: RefObject<HTMLElement | null>
) => {
  const returnFocusRef = useRef<HTMLElement | null>(null)
  const generationRef = useRef(0)
  const programmaticClosesRef = useRef(0)

  useEffect(() => {
    const dialog = dialogRef.current

    if (!open || !dialog?.isConnected) return

    generationRef.current += 1

    returnFocusRef.current ??= triggerRef.current ?? getActiveElement(dialog)

    removeDialog(dialog)

    openDialogs.push(dialog)

    if (!dialog.open) {
      if (typeof dialog.showModal === 'function') {
        dialog.showModal()
      } else {
        dialog.setAttribute('open', '')
      }
    }

    return () => {
      const generation = ++generationRef.current
      const target = returnFocusRef.current

      removeDialog(dialog)

      if (dialog.open) {
        if (typeof dialog.close === 'function') {
          programmaticClosesRef.current += 1

          dialog.close()
        } else {
          dialog.removeAttribute('open')
        }
      }

      queueMicrotask(() => {
        if (generationRef.current !== generation) return

        returnFocusRef.current = null

        restoreDialogFocus(dialog, target)
      })
    }
  }, [dialogRef, open, triggerRef])

  return () => {
    if (programmaticClosesRef.current === 0) return false

    programmaticClosesRef.current -= 1

    return true
  }
}
