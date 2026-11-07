'use client'

import type { ComponentPropsWithoutRef, ComponentPropsWithRef  } from 'react'
import { createContext, use  } from 'react'

import { composeClassName } from '@santi020k/lumen-core/tokens'

import type { DialogOptions } from './dialog-controller.js'
import { useDialog } from './dialog-controller.js'
import type { ButtonProps } from './editorial-controls.js'
import { Button } from './editorial-controls.js'
import { composeHandlers, glassSurfaceClass, resolveSurface, type SurfaceProps } from './primitive-surface.js'

export type DialogProps = Omit<ComponentPropsWithoutRef<'dialog'>, 'open'> &
  SurfaceProps &
  Omit<DialogOptions, 'id'> & {
    layout?: 'centered' | 'fullscreen'
  }

const DialogCloseContext = createContext<(() => void) | null>(null)

export type DialogHeaderProps = ComponentPropsWithRef<'header'>

export const DialogHeader = ({ className, ...props }: DialogHeaderProps) => (
  <header {...props} className={composeClassName('ui-dialog-header', className)} data-slot="dialog-header" />
)

export type DialogTitleProps = ComponentPropsWithRef<'h2'> & { as?: 'h2' | 'h3' | 'h4' }

export const DialogTitle = ({ as: Tag = 'h2', className, ...props }: DialogTitleProps) => (
  <Tag {...props} className={composeClassName('ui-dialog-title', className)} data-slot="dialog-title" />
)

export type DialogBodyProps = ComponentPropsWithRef<'div'>

export const DialogBody = ({ className, ...props }: DialogBodyProps) => (
  <div {...props} className={composeClassName('ui-dialog-body', className)} data-slot="dialog-body" />
)

export type DialogFooterProps = ComponentPropsWithRef<'footer'>

export const DialogFooter = ({ className, ...props }: DialogFooterProps) => (
  <footer {...props} className={composeClassName('ui-dialog-footer', className)} data-slot="dialog-footer" />
)

export type DialogCloseProps = ButtonProps

export const DialogClose = ({ className, onClick, ...props }: DialogCloseProps) => {
  const close = use(DialogCloseContext)

  return (
    <Button
      {...props}
      className={composeClassName('ui-dialog-close', className)}
      data-slot="dialog-close"
      onClick={event => {
        onClick?.(event)

        if (event.defaultPrevented) return

        if (close) close()
        else event.currentTarget.closest('dialog')?.close()
      }}
    />
  )
}

export const Dialog = ({
  children,
  className,
  defaultOpen,
  dismissOnEscape,
  dismissOnOutsidePress,
  glass = false,
  layout = 'centered',
  onCancel,
  onClick,
  onClose,
  onOpenChange,
  onPointerDown,
  open,
  ...props
}: DialogProps) => {
  const dialog = useDialog({ defaultOpen, dismissOnEscape, dismissOnOutsidePress, onOpenChange, open })

  return (
    <dialog
      {...dialog.dialogProps}
      {...props}
      className={composeClassName(
        'ui-dialog', layout === 'fullscreen' && 'ui-dialog--fullscreen', glassSurfaceClass('ui-dialog', glass), className
      )}
      data-layout={layout}
      data-surface={resolveSurface(glass)}
      onCancel={composeHandlers(onCancel, dialog.dialogProps.onCancel)}
      onPointerDown={composeHandlers(onPointerDown, dialog.dialogProps.onPointerDown)}
      onClick={composeHandlers(onClick, dialog.dialogProps.onClick)}
      onClose={composeHandlers(onClose, dialog.dialogProps.onClose)}
    >
      <DialogCloseContext value={dialog.close}>{children}</DialogCloseContext>
    </dialog>
  )
}
