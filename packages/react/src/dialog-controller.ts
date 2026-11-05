'use client'

import type { ComponentPropsWithRef, Dispatch, JSX, RefObject, SetStateAction  } from 'react'
import { useCallback, useRef, useState   } from 'react'

import { useDialogLifecycle } from './dialog-lifecycle.js'

export type ChangeHandler<T> = (value: T) => void

export type DataAttributes = Record<`data-${string}`, unknown>

export type LumenProps<Tag extends keyof JSX.IntrinsicElements> =
  ComponentPropsWithRef<Tag> & DataAttributes

export interface ControllableOptions<T> {
  defaultValue: T
  onChange?: ChangeHandler<T> | undefined
  value?: T | undefined
}

export interface DisclosureOptions {
  defaultOpen?: boolean | undefined
  id?: string | undefined
  onOpenChange?: ChangeHandler<boolean> | undefined
  open?: boolean | undefined
}

export interface DialogOptions extends DisclosureOptions {
  alert?: boolean | undefined
  dismissOnEscape?: boolean | undefined
  dismissOnOutsidePress?: boolean | undefined
}

export interface DialogController {
  close: () => void
  closeProps: LumenProps<'button'>
  dialogProps: LumenProps<'dialog'>
  dialogRef: RefObject<HTMLDialogElement | null>
  open: boolean
  setOpen: Dispatch<SetStateAction<boolean>>
  triggerProps: LumenProps<'button'>
  triggerRef: RefObject<HTMLElement | null>
}

export const useControllableState = <T extends string | number | boolean | undefined>({
  defaultValue,
  onChange,
  value
}: ControllableOptions<T>): [T, Dispatch<SetStateAction<T>>, (value: T) => void] => {
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue)
  const pendingValueRef = useRef(defaultValue)
  const currentValue = value ?? uncontrolledValue

  const setValue = useCallback<Dispatch<SetStateAction<T>>>(
    next => {
      const previousValue = value === undefined ? pendingValueRef.current : currentValue
      const resolvedValue = typeof next === 'function' ? next(previousValue) : next

      if (value === undefined) {
        pendingValueRef.current = resolvedValue

        setUncontrolledValue(resolvedValue)
      }

      onChange?.(resolvedValue)
    }, [currentValue, onChange, value]
  )

  const restoreValue = useCallback((next: T) => {
    if (value !== undefined) return

    pendingValueRef.current = next

    setUncontrolledValue(next)
  }, [value])

  return [currentValue, setValue, restoreValue]
}

export const isDialogBackdropPoint = (
  dialog: HTMLDialogElement | null,
  event: { clientX: number, clientY: number, target: EventTarget | null }
): boolean => {
  if (!dialog || event.target !== dialog) return false

  const bounds = dialog.getBoundingClientRect()

  return event.clientX < bounds.left || event.clientX >= bounds.right ||
    event.clientY < bounds.top || event.clientY >= bounds.bottom
}

export const useDialog = (options: DialogOptions = {}): DialogController => {
  const dialogRef = useRef<HTMLDialogElement | null>(null)
  const triggerRef = useRef<HTMLElement | null>(null)
  const outsidePointerRef = useRef<boolean | undefined>(undefined)

  const [open, setOpen] = useControllableState({
    defaultValue: options.defaultOpen ?? false,
    onChange: options.onOpenChange,
    value: options.open
  })

  const consumeProgrammaticClose = useDialogLifecycle(open, dialogRef, triggerRef)

  const close = useCallback(() => {
    setOpen(false)
  }, [setOpen])

  const dialogProps: LumenProps<'dialog'> = {
    'aria-modal': true,
    'data-ui-alert-dialog': options.alert ? true : undefined,
    'data-ui-bound': true,
    'data-ui-dialog': options.alert ? undefined : true,
    onCancel: event => {
      if (event.target !== dialogRef.current || event.defaultPrevented) return

      event.preventDefault()

      event.stopPropagation()

      if (options.dismissOnEscape !== false) close()
    },
    onClick: event => {
      const startedOutside = outsidePointerRef.current

      outsidePointerRef.current = undefined

      if (event.defaultPrevented || startedOutside === false || event.detail === 0) return

      if (!(options.dismissOnOutsidePress ?? !options.alert)) return

      if (isDialogBackdropPoint(dialogRef.current, event)) close()
    },
    onClose: event => {
      if (event.target !== dialogRef.current || consumeProgrammaticClose()) return

      close()
    },
    onPointerDown: event => {
      outsidePointerRef.current = isDialogBackdropPoint(dialogRef.current, event)
    },
    ref: dialogRef,
    role: options.alert ? 'alertdialog' : 'dialog'
  }

  const triggerProps: LumenProps<'button'> = {
    'aria-haspopup': 'dialog',
    onClick: () => {
      setOpen(true)
    },
    ref: element => {
      triggerRef.current = element
    },
    type: 'button'
  }

  return {
    close,
    closeProps: {
      onClick: close,
      type: 'button'
    },
    dialogProps,
    dialogRef,
    open,
    setOpen,
    triggerProps,
    triggerRef
  }
}
