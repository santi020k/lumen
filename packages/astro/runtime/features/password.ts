const bindPasswordFields = (root: HTMLElement): void => {
  if (root.dataset.uiPasswordBound === 'true') return

  const input = root.querySelector<HTMLInputElement>('input')
  const toggle = root.querySelector<HTMLButtonElement>('[data-ui-password-toggle]')

  if (!input || !toggle) return

  root.dataset.uiPasswordBound = 'true'

  const showLabel = toggle.dataset.showLabel ?? 'Show password'
  const hideLabel = toggle.dataset.hideLabel ?? 'Hide password'
  const visibleLabel = toggle.querySelector<HTMLElement>('[data-ui-password-toggle-label]')

  const setVisible = (visible: boolean): void => {
    input.type = visible ? 'text' : 'password'

    toggle.setAttribute('aria-label', visible ? hideLabel : showLabel)

    toggle.setAttribute('aria-pressed', String(visible))

    if (visibleLabel) visibleLabel.textContent = visible ? hideLabel : showLabel
  }

  toggle.addEventListener('click', () => {
    setVisible(input.type === 'password')

    input.focus({ preventScroll: true })
  })

  const form = input.form

  form?.addEventListener('reset', () => {
    setVisible(false)
  })

  if (form) {
    const hideAfterSuccess = (): void => {
      if (form.dataset.status === 'success') setVisible(false)
    }

    const observer = new MutationObserver(hideAfterSuccess)

    observer.observe(form, { attributeFilter: ['data-status'], attributes: true })

    hideAfterSuccess()
  }

  setVisible(false)
}

export const initPasswordFields = (scope: ParentNode): void => {
  for (const root of scope.querySelectorAll<HTMLElement>('[data-ui-password-field]')) bindPasswordFields(root)
}
