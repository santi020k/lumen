import { queryScope } from '../scope.js'

const filterItems = (input: HTMLInputElement, items: HTMLElement[]): void => {
  const query = input.value.trim().toLowerCase()

  for (const item of items) {
    const text = item.textContent.toLowerCase()

    item.hidden = Boolean(query) && !text.includes(query)
  }
}

const bindCommand = (root: HTMLElement): void => {
  if (root.dataset.uiBound === 'true') return

  const input = root.querySelector<HTMLInputElement>('input[type="search"], input[type="text"], input:not([type])')

  if (!input) return

  root.dataset.uiBound = 'true'

  const items = [...root.querySelectorAll<HTMLElement>('[data-ui-command-item], [role="option"], option')]

  input.addEventListener('input', () => {
    filterItems(input, items)
  })
}

export const initCommand = (scope: ParentNode): void => {
  for (const root of queryScope(scope, '[data-ui-command]')) bindCommand(root)
}
