import { queryScope } from '../scope.js'

const bindToggles = (toggle: HTMLButtonElement): void => {
  if (toggle.dataset.uiBound === 'true') return

  toggle.dataset.uiBound = 'true'

  toggle.addEventListener('click', () => {
    const pressed = toggle.getAttribute('aria-pressed') !== 'true'

    const intent = new CustomEvent('ui:toggle-intent', {
      bubbles: true,
      cancelable: true,
      detail: { pressed }
    })

    toggle.dispatchEvent(intent)

    if (intent.defaultPrevented || toggle.hasAttribute('data-ui-controlled')) return

    toggle.setAttribute('aria-pressed', String(pressed))
  })
}

export const initToggles = (scope: ParentNode): void => {
  for (const toggle of queryScope(scope, '[data-ui-toggle]', 'button')) bindToggles(toggle)
}
