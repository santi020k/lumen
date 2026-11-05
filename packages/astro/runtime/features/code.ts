let codeCopyLiveRegion: HTMLElement | undefined

const getCodeCopyLiveRegion = (): HTMLElement => {
  if (codeCopyLiveRegion?.isConnected) return codeCopyLiveRegion

  codeCopyLiveRegion = document.createElement('div')

  codeCopyLiveRegion.setAttribute('aria-atomic', 'true')

  codeCopyLiveRegion.setAttribute('aria-live', 'polite')

  codeCopyLiveRegion.style.position = 'absolute'

  codeCopyLiveRegion.style.width = '1px'

  codeCopyLiveRegion.style.height = '1px'

  codeCopyLiveRegion.style.overflow = 'hidden'

  codeCopyLiveRegion.style.clipPath = 'inset(50%)'

  codeCopyLiveRegion.style.whiteSpace = 'nowrap'

  document.body.append(codeCopyLiveRegion)

  return codeCopyLiveRegion
}

const bindCodeRegions = (root: HTMLElement): void => {
  if (root.classList.contains('ui-code--wrap')) return

  for (const pre of root.querySelectorAll<HTMLPreElement>('pre')) {
    if (!pre.hasAttribute('tabindex')) pre.tabIndex = 0

    if (!pre.hasAttribute('role')) pre.setAttribute('role', 'region')

    if (!pre.hasAttribute('aria-label') && !pre.hasAttribute('aria-labelledby')) {
      pre.setAttribute('aria-label', root.dataset.codeLabel ?? 'Code example')
    }
  }
}

export const initCodeRegions = (scope: ParentNode): void => {
  for (const root of scope.querySelectorAll<HTMLElement>('[data-ui-code]')) bindCodeRegions(root)
}

const getCopyTargetValue = (target: HTMLElement | null): string | undefined => {
  if (!target) return undefined

  if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) return target.value

  return target.innerText
}

const getCopyButtonValue = (button: HTMLElement): string | undefined => {
  if (button.hasAttribute('data-copy-value')) return button.dataset.copyValue

  if (button.hasAttribute('data-ui-code-copy')) {
    const code = button.closest('[data-ui-code]')?.querySelector<HTMLElement>('pre code, code')

    return getCopyTargetValue(code ?? null)
  }

  const selector = button.dataset.copyTarget

  return selector ? getCopyTargetValue(document.querySelector<HTMLElement>(selector)) : undefined
}

const announceCopy = (button: HTMLElement, label: string, variant: 'success' | 'destructive'): void => {
  button.setAttribute('aria-label', label)

  if (button.hasAttribute('data-ui-code-copy')) button.title = label

  if (button.dataset.copyToast === 'true') {
    document.dispatchEvent(new CustomEvent('ui:toast', { detail: { title: label, variant } }))
  }
}

const bindCopyButtons = (button: HTMLButtonElement): void => {
  if (button.dataset.uiCopyButtonBound === 'true') return

  button.dataset.uiCopyButtonBound = 'true'

  let resetTimer = 0
  let operation = 0
  let recovery: HTMLTextAreaElement | undefined
  const recoveryLabel = button.dataset.copyRecoveryLabel
  const codeRoot = button.closest('[data-ui-code]')
  const panel = button.closest<HTMLElement>('[role="tabpanel"]')
  const tabs = panel?.closest('[data-ui-tabs]')

  if (recoveryLabel && panel && tabs) {
    tabs.addEventListener('ui:tabs-change', event => {
      if (event.target !== tabs || !panel.hidden) return

      operation += 1

      recovery?.remove()

      recovery = undefined
    })
  }

  const showRecovery = (value: string): void => {
    if (!recoveryLabel) return

    if (!recovery) {
      recovery = button.ownerDocument.createElement('textarea')

      recovery.className = 'ui-textarea'

      recovery.readOnly = true

      recovery.rows = 2

      recovery.setAttribute('aria-label', recoveryLabel)

      recovery.addEventListener('focus', () => recovery?.select())

      recovery.addEventListener('click', () => recovery?.select())

      if (codeRoot) codeRoot.append(recovery)
      else button.after(recovery)
    }

    recovery.value = value
  }

  const setCopyButtonState = (state: 'copied' | 'error' | 'idle'): void => {
    button.dataset.state = state

    button.classList.toggle('ui-code__copy--copied', state === 'copied' && button.hasAttribute('data-ui-code-copy'))

    for (const part of button.querySelectorAll<HTMLElement>('[data-slot^="copy-"]')) {
      const isActive = part.dataset.slot === `copy-${state}`

      part.hidden = !isActive

      part.setAttribute('aria-hidden', String(!isActive))
    }
  }

  setCopyButtonState('idle')

  const scheduleReset = (): void => {
    window.clearTimeout(resetTimer)

    const parsedResetAfter = Number(button.dataset.copyResetAfter)

    const resetAfter = Number.isFinite(parsedResetAfter) ?
      Math.max(0, parsedResetAfter) :
      2000

    resetTimer = window.setTimeout(() => {
      setCopyButtonState('idle')

      button.setAttribute('aria-label', button.dataset.copyLabel ?? 'Copy to clipboard')

      if (button.hasAttribute('data-ui-code-copy')) button.title = button.dataset.copyLabel ?? 'Copy to clipboard'

      getCodeCopyLiveRegion().textContent = ''
    }, resetAfter)
  }

  const copiedLabel = button.dataset.copyCopiedLabel ??
    'Copied to clipboard'

  const errorLabel = button.dataset.copyErrorLabel ??
    'Could not copy to clipboard'

  const announceFailure = (value: string | undefined): void => {
    getCodeCopyLiveRegion().textContent = value !== undefined && recoveryLabel ?
      `${errorLabel} ${recoveryLabel}` :
      errorLabel
  }

  const copy = async (): Promise<void> => {
    const currentOperation = ++operation

    window.clearTimeout(resetTimer)

    let value: string | undefined

    try {
      value = getCopyButtonValue(button)

      if (value === undefined || typeof navigator.clipboard === 'undefined') {
        throw new Error(errorLabel)
      }

      await navigator.clipboard.writeText(value)

      if (operation !== currentOperation || !button.isConnected) return

      recovery?.remove()

      recovery = undefined

      setCopyButtonState('copied')

      announceCopy(button, copiedLabel, 'success')

      button.dispatchEvent(new CustomEvent('ui:copy-success', {
        bubbles: true,
        detail: { value }
      }))

      getCodeCopyLiveRegion().textContent = copiedLabel
    } catch (error) {
      if (operation !== currentOperation || !button.isConnected) return

      setCopyButtonState('error')

      announceCopy(button, errorLabel, 'destructive')

      button.dispatchEvent(new CustomEvent('ui:copy-error', {
        bubbles: true,
        detail: { error }
      }))

      if (value !== undefined) showRecovery(value)

      announceFailure(value)
    }

    scheduleReset()
  }

  button.addEventListener('click', () => {
    void copy()
  })
}

export const initCopyButtons = (scope: ParentNode): void => {
  for (const button of scope.querySelectorAll<HTMLButtonElement>(
    '[data-ui-copy-button], [data-ui-code-copy]'
  )) bindCopyButtons(button)
}
