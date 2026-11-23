import { getPanel, setOpen, shouldRestorePanelFocus } from '../panels.js'
import { queryScope } from '../scope.js'

import { getLoopedIndex, shouldIgnoreKeydown } from './shared.js'

const isCascaderOptionAvailable = (option: HTMLButtonElement): boolean => !option.matches(':disabled') && !option.closest('[hidden], [inert]')

const getCascaderOptions = (column: HTMLElement): HTMLButtonElement[] => [
  ...column.querySelectorAll<HTMLButtonElement>('[data-ui-cascader-option]')
].filter(isCascaderOptionAvailable)

const closeCascaderPanel = (trigger: HTMLElement | null, panel: HTMLElement | null): void => {
  if (!trigger || !panel) return

  const restoreFocus = shouldRestorePanelFocus(panel)

  setOpen(trigger, panel, false)

  if (restoreFocus) trigger.focus({ preventScroll: true })
}

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
    if (option.matches(':disabled, [aria-disabled="true"]')) return

    const nextSelector = option.dataset.uiCascaderNext
    const next = nextSelector ? root.querySelector<HTMLElement>(nextSelector) : null

    if (!next) return

    event.preventDefault()

    option.click()

    if (!next.hidden) getCascaderOptions(next)[0]?.focus()
  }
}

const closeCascaderColumn = (columns: HTMLElement[], columnIndex: number, event: KeyboardEvent): void => {
  if (event.key !== 'ArrowLeft' || columnIndex <= 0) return

  event.preventDefault()

  const previousColumn = columns.findLast((candidate, index) => index < columnIndex && !candidate.hidden)

  for (const descendant of columns.slice(columnIndex)) {
    descendant.hidden = true
  }

  if (previousColumn) {
    const options = getCascaderOptions(previousColumn)
    const previousOption = options.find(option => option.dataset.active === 'true') ?? options[0]

    previousOption?.focus()
  }
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
    if (option.closest('[data-ui-cascader]') !== root) continue

    option.addEventListener('click', event => {
      if (event.defaultPrevented || option.matches(':disabled, [aria-disabled="true"]') || option.closest('[hidden], [inert]')) return

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

      closeCascaderPanel(trigger, panel)

      root.dispatchEvent(new CustomEvent('ui:cascader-change', { bubbles: true, detail: { value } }))
    })
  }

  panel?.addEventListener('keydown', event => {
    if (shouldIgnoreKeydown(event)) return

    const target = event.target

    if (!(target instanceof HTMLElement)) return

    const option = target.closest<HTMLButtonElement>('[data-ui-cascader-option]')
    const column = option?.closest<HTMLElement>('.ui-cascader__column')

    if (!option || !column || option.closest('[data-ui-cascader]') !== root) return

    if (!isCascaderOptionAvailable(option)) return

    const columnIndex = columns.indexOf(column)
    const options = getCascaderOptions(column)

    if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
      event.preventDefault()

      const currentIndex = options.indexOf(option)
      const nextIndex = getLoopedIndex(event.key, currentIndex, options.length, ['ArrowDown'])

      options[nextIndex]?.focus()

      return
    }

    openCascaderColumn(root, option, event)

    closeCascaderColumn(columns, columnIndex, event)
  })
}

export const initCascaders = (scope: ParentNode): void => {
  for (const root of queryScope(scope, '[data-ui-cascader]')) bindCascaders(root)
}
