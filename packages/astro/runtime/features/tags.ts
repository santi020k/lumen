const bindTagGroups = (root: HTMLElement): void => {
  if (root.dataset.uiBound === 'true') return

  root.dataset.uiBound = 'true'

  for (const button of root.querySelectorAll<HTMLElement>('[data-ui-tag-remove]')) {
    button.addEventListener('click', () => {
      const tag = button.closest<HTMLElement>('[data-ui-tag], [role="listitem"]')

      tag?.remove()

      root.dispatchEvent(new CustomEvent('ui:tag-remove', {
        bubbles: true,
        detail: {
          value: tag?.dataset.value ?? tag?.textContent.trim()
        }
      }))
    })
  }
}

export const initTagGroups = (scope: ParentNode): void => {
  for (const root of scope.querySelectorAll<HTMLElement>('.ui-tag-group, [data-ui-tag-group]')) bindTagGroups(root)
}
