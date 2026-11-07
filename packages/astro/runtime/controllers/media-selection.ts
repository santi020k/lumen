import { queryScope } from '../scope.js'

const bound = new WeakSet<HTMLButtonElement>()

/** Selection is a request: the host accepts it and updates aria-pressed and the summary. */
export const initMediaSelectionControllers = (scope: ParentNode): void => {
  for (const button of queryScope(scope, 'button[data-ui-media-thumbnail]', 'button')) {
    if (bound.has(button)) continue

    bound.add(button)

    button.addEventListener('click', () => {
      const id = button.dataset.mediaId

      if (button.disabled || !id) return

      button.dispatchEvent(new CustomEvent('ui:media-selection-request', {
        bubbles: true, detail: { id, selected: button.getAttribute('aria-pressed') !== 'true' }
      }))
    })
  }
}
