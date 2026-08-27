const focusableSelector = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])'
].join(',')

const isElementVisible = (element: HTMLElement): boolean => (
  typeof element.checkVisibility === 'function' ?
    element.checkVisibility() :
    element.offsetParent !== null
)

const getFocusable = (root: ParentNode): HTMLElement[] => [
  ...root.querySelectorAll<HTMLElement>(focusableSelector)
].filter(element => !element.hasAttribute('hidden') && isElementVisible(element))

export const initDialogControllers = (scope: ParentNode): void => {
  const dialogSelector =
    '[data-ui-dialog], [data-ui-alert-dialog], [data-ui-drawer], [data-ui-sheet]'

  for (const dialog of scope.querySelectorAll<HTMLDialogElement>(dialogSelector)) {
    if (dialog.dataset.uiBound === 'true') continue

    dialog.dataset.uiBound = 'true'

    dialog.setAttribute('aria-modal', 'true')

    dialog.setAttribute(
      'role', dialog.hasAttribute('data-ui-alert-dialog') ? 'alertdialog' : 'dialog'
    )

    dialog.addEventListener('click', event => {
      if (event.target === dialog && !dialog.hasAttribute('data-ui-alert-dialog')) {
        dialog.close()
      }
    })

    dialog.addEventListener('close', () => {
      const triggerId = dialog.dataset.uiLastTrigger
      const trigger = triggerId ? document.getElementById(triggerId) : null

      if (trigger instanceof HTMLElement) {
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

  for (const trigger of scope.querySelectorAll<HTMLElement>(triggerSelector)) {
    if (trigger.dataset.uiBound === 'true') continue

    trigger.dataset.uiBound = 'true'

    trigger.setAttribute('aria-haspopup', 'dialog')

    trigger.addEventListener('click', () => {
      const targetId =
        trigger.dataset.uiDialogTrigger ??
        trigger.dataset.uiAlertDialogTrigger ??
        trigger.dataset.uiDrawerTrigger ??
        trigger.dataset.uiSheetTrigger

      if (!targetId) return

      const dialog = document.getElementById(targetId)

      if (!(dialog instanceof HTMLDialogElement)) return

      if (!trigger.id) {
        trigger.id = `ui-trigger-${crypto.randomUUID()}`
      }

      dialog.dataset.uiLastTrigger = trigger.id

      dialog.showModal()

      getFocusable(dialog)[0]?.focus({ preventScroll: true })
    })
  }

  const closeSelector = [
    '[data-ui-dialog-close]',
    '[data-ui-alert-dialog-close]',
    '[data-ui-drawer-close]',
    '[data-ui-sheet-close]'
  ].join(', ')

  for (const closeButton of scope.querySelectorAll<HTMLElement>(closeSelector)) {
    if (closeButton.dataset.uiBound === 'true') continue

    closeButton.dataset.uiBound = 'true'

    closeButton.addEventListener('click', () => {
      closeButton.closest<HTMLDialogElement>('dialog')?.close()
    })
  }
}
