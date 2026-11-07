import { getScopeTarget } from '../relationships.js'
import { queryScope } from '../scope.js'

const dialogTriggers = new WeakMap<HTMLDialogElement, HTMLElement>()

const isBackdropPoint = (dialog: HTMLDialogElement, event: MouseEvent): boolean => {
  if (event.target !== dialog) return false

  const rect = dialog.getBoundingClientRect()

  return event.clientX < rect.left || event.clientX > rect.right ||
    event.clientY < rect.top || event.clientY > rect.bottom
}

export const initDialogControllers = (scope: ParentNode): void => {
  const dialogSelector =
    '[data-ui-dialog], [data-ui-alert-dialog], [data-ui-drawer], [data-ui-sheet]'

  for (const dialog of queryScope(scope, dialogSelector, 'dialog')) {
    if (dialog.dataset.uiBound === 'true') continue

    dialog.dataset.uiBound = 'true'

    dialog.setAttribute('aria-modal', 'true')

    dialog.setAttribute(
      'role', dialog.hasAttribute('data-ui-alert-dialog') ? 'alertdialog' : 'dialog'
    )

    let pressStartedOutside = false

    dialog.addEventListener('pointerdown', event => {
      pressStartedOutside = isBackdropPoint(dialog, event)
    })

    dialog.addEventListener('click', event => {
      const dismiss = pressStartedOutside && event.detail > 0 &&
        !event.defaultPrevented && isBackdropPoint(dialog, event)

      pressStartedOutside = false

      if (dismiss && !dialog.hasAttribute('data-ui-alert-dialog')) {
        dialog.close()
      }
    })

    dialog.addEventListener('close', () => {
      const trigger = dialogTriggers.get(dialog)

      if (trigger?.isConnected) {
        trigger.focus({ preventScroll: true })
      }
    })
  }

  const triggerSelector = [
    '[data-ui-dialog-trigger]',
    '[data-ui-alert-dialog-trigger]',
    '[data-ui-drawer-trigger]',
    '[data-ui-sheet-trigger]'
  ].join(', ')

  for (const trigger of queryScope(scope, triggerSelector)) {
    if (trigger.dataset.uiBound === 'true') continue

    trigger.dataset.uiBound = 'true'

    trigger.setAttribute('aria-haspopup', 'dialog')

    trigger.addEventListener('click', event => {
      if (event.defaultPrevented || trigger.matches(':disabled, [aria-disabled="true"]')) return

      const targetId =
        trigger.dataset.uiDialogTrigger ??
        trigger.dataset.uiAlertDialogTrigger ??
        trigger.dataset.uiDrawerTrigger ??
        trigger.dataset.uiSheetTrigger

      if (!targetId) return

      const dialog = getScopeTarget(trigger, targetId)

      if (!(dialog instanceof HTMLDialogElement) || dialog.open) return

      initDialogControllers(dialog)

      dialog.showModal()

      if (dialog.hasAttribute('open')) dialogTriggers.set(dialog, trigger)
    })
  }

  const closeSelector = [
    '[data-ui-dialog-close]',
    '[data-ui-alert-dialog-close]',
    '[data-ui-drawer-close]',
    '[data-ui-sheet-close]'
  ].join(', ')

  for (const closeButton of queryScope(scope, closeSelector)) {
    if (closeButton.dataset.uiBound === 'true') continue

    closeButton.dataset.uiBound = 'true'

    closeButton.addEventListener('click', event => {
      if (event.defaultPrevented || closeButton.matches(':disabled, [aria-disabled="true"]')) return

      closeButton.closest<HTMLDialogElement>('dialog')?.close()
    })
  }
}
