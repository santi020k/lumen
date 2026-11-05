const bindTransfers = (root: HTMLElement): void => {
  if (root.dataset.uiBound === 'true') return

  root.dataset.uiBound = 'true'

  const lists = new Map<string, HTMLElement>()

  for (const list of root.querySelectorAll<HTMLElement>('[data-ui-transfer-list]')) {
    if (list.dataset.side) {
      lists.set(list.dataset.side, list)
    }
  }

  const move = (fromSide: string, toSide: string): void => {
    const from = lists.get(fromSide)
    const to = lists.get(toSide)

    if (!from || !to) return

    const moved: string[] = []

    for (const checkbox of from.querySelectorAll<HTMLInputElement>('[data-ui-transfer-item]')) {
      if (!checkbox.checked) continue

      const item = checkbox.closest<HTMLElement>('.ui-transfer__item')

      if (item) {
        checkbox.checked = false

        to.append(item)

        moved.push(checkbox.value)
      }
    }

    if (moved.length) {
      root.dispatchEvent(new CustomEvent('ui:transfer-change', {
        bubbles: true,
        detail: { from: fromSide, to: toSide, values: moved }
      }))
    }
  }

  for (const button of root.querySelectorAll<HTMLButtonElement>('[data-ui-transfer-move]')) {
    button.addEventListener('click', () => {
      if (button.dataset.uiTransferMove === 'target') {
        move('source', 'target')
      } else if (button.dataset.uiTransferMove === 'source') {
        move('target', 'source')
      }
    })
  }
}

export const initTransfers = (scope: ParentNode): void => {
  for (const root of scope.querySelectorAll<HTMLElement>('[data-ui-transfer]')) bindTransfers(root)
}
