import { queryScope } from '../scope.js'

import { setOpen } from './shared.js'

const bindTreeSelects = (root: HTMLElement): void => {
  if (root.dataset.uiTreeSelectBound === 'true') return

  root.dataset.uiTreeSelectBound = 'true'

  const valueLabel = root.querySelector<HTMLElement>('[data-ui-tree-select-value]')
  const input = root.querySelector<HTMLInputElement>('[data-ui-tree-select-input]')
  const trigger = root.querySelector<HTMLElement>('[data-ui-trigger]')
  const panel = root.querySelector<HTMLElement>('[data-ui-panel]')

  for (const item of root.querySelectorAll<HTMLElement>('[data-ui-panel] [data-value]')) {
    item.addEventListener('click', () => {
      const value = item.dataset.value ?? ''

      if (valueLabel) {
        valueLabel.textContent = item.textContent.trim()
      }

      if (input) {
        input.value = value
      }

      if (trigger && panel) {
        setOpen(trigger, panel, false)
      }

      root.dispatchEvent(new CustomEvent('ui:tree-select-change', { bubbles: true, detail: { value } }))
    })
  }
}

export const initTreeSelects = (scope: ParentNode): void => {
  for (const root of queryScope(scope, '[data-ui-tree-select]')) bindTreeSelects(root)
}
