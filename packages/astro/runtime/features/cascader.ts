import { queryScope } from '../scope.js'

import { getLoopedIndex, getPanel, setOpen } from './shared.js'

const resetCascaderColumns = (column: HTMLElement | null, columns: HTMLElement[]): void => {
  if (column) {
    const columnIndex = columns.indexOf(column)

    for (const descendant of columns.slice(columnIndex + 1)) {
      descendant.hidden = true

      for (const descendantOption of descendant.querySelectorAll<HTMLElement>('[data-ui-cascader-option]')) {
        descendantOption.dataset.active = 'false'

        descendantOption.setAttribute('aria-selected', 'false')
      }
    }

    for (const sibling of column.querySelectorAll<HTMLElement>('[data-ui-cascader-option]')) {
      sibling.dataset.active = 'false'

      sibling.setAttribute('aria-selected', 'false')
    }
  }
}

const openCascaderColumn = (root: HTMLElement, option: HTMLButtonElement, event: KeyboardEvent): void => {
  if (event.key === 'ArrowRight') {
    const nextSelector = option.dataset.uiCascaderNext
    const next = nextSelector ? root.querySelector<HTMLElement>(nextSelector) : null

    if (!next) return

    event.preventDefault()

    option.click()

    next.querySelector<HTMLElement>('[data-ui-cascader-option]')?.focus()
  }
}

const closeCascaderColumn = (columns: HTMLElement[], columnIndex: number, event: KeyboardEvent): void => {
  if (event.key !== 'ArrowLeft' || columnIndex <= 0) return

  event.preventDefault()

  const previousColumn = columns.findLast((candidate, index) => index < columnIndex && !candidate.hidden)

  for (const descendant of columns.slice(columnIndex)) {
    descendant.hidden = true
  }

  previousColumn?.querySelector<HTMLElement>('[data-ui-cascader-option][data-active="true"]')?.focus()
}

const bindCascaders = (root: HTMLElement): void => {
  if (root.dataset.uiCascaderBound === 'true') return

  root.dataset.uiCascaderBound = 'true'

  const valueLabel = root.querySelector<HTMLElement>('[data-ui-cascader-value]')
  const input = root.querySelector<HTMLInputElement>('[data-ui-cascader-input]')
  const trigger = root.querySelector<HTMLElement>('[data-ui-trigger]')
  const panel = trigger ? getPanel(trigger) : null
  const columns = [...root.querySelectorAll<HTMLElement>('.ui-cascader__column')]

  for (const option of root.querySelectorAll<HTMLButtonElement>('[data-ui-cascader-option]')) {
    option.addEventListener('click', () => {
      const column = option.closest<HTMLElement>('.ui-cascader__column')

      resetCascaderColumns(column, columns)

      option.dataset.active = 'true'

      option.setAttribute('aria-selected', 'true')

      const nextSelector = option.dataset.uiCascaderNext
      const next = nextSelector ? root.querySelector<HTMLElement>(nextSelector) : null

      if (next) {
        next.hidden = false

        return
      }

      const value = option.dataset.value ?? option.textContent.trim()

      if (valueLabel) {
        valueLabel.textContent = option.dataset.label ?? option.textContent.trim()
      }

      if (input) {
        input.value = value
      }

      if (trigger && panel) {
        setOpen(trigger, panel, false)
      }

      root.dispatchEvent(new CustomEvent('ui:cascader-change', { bubbles: true, detail: { value } }))
    })
  }

  panel?.addEventListener('keydown', event => {
    const target = event.target

    if (!(target instanceof HTMLElement)) return

    const option = target.closest<HTMLButtonElement>('[data-ui-cascader-option]')
    const column = option?.closest<HTMLElement>('.ui-cascader__column')

    if (!option || !column) return

    const columnIndex = columns.indexOf(column)
    const options = [...column.querySelectorAll<HTMLButtonElement>('[data-ui-cascader-option]')]

    if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
      event.preventDefault()

      const currentIndex = options.indexOf(option)
      const nextIndex = getLoopedIndex(event.key, currentIndex, options.length, ['ArrowDown'])

      options[nextIndex]?.focus()

      return
    }

    if (event.key === 'ArrowRight') openCascaderColumn(root, option, event)
    else closeCascaderColumn(columns, columnIndex, event)
  })
}

export const initCascaders = (scope: ParentNode): void => {
  for (const root of queryScope(scope, '[data-ui-cascader]')) bindCascaders(root)
}
