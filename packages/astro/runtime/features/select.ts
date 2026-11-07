import { queryScope } from '../scope.js'

import { getLoopedIndex, isOwnedByAnotherAdapter } from './shared.js'

export const closeSelect = (root: HTMLElement): void => {
  if (isOwnedByAnotherAdapter(root)) return

  const trigger = root.querySelector<HTMLElement>('[data-ui-select-trigger]')
  const listbox = root.querySelector<HTMLElement>('[data-ui-select-list]')

  if (!trigger || !listbox) return

  trigger.setAttribute('aria-expanded', 'false')

  listbox.hidden = true

  listbox.dataset.state = 'closed'
}

const openSelect = (root: HTMLElement): void => {
  const trigger = root.querySelector<HTMLElement>('[data-ui-select-trigger]')
  const listbox = root.querySelector<HTMLElement>('[data-ui-select-list]')

  if (!trigger || !listbox) return

  trigger.setAttribute('aria-expanded', 'true')

  listbox.hidden = false

  listbox.dataset.state = 'open'
}

const getSelectItems = (root: HTMLElement): HTMLElement[] => [
  ...root.querySelectorAll<HTMLElement>('[data-ui-select-option]')
]

const getEnabledSelectItems = (root: HTMLElement): HTMLElement[] => (
  getSelectItems(root).filter(
    item => !item.hasAttribute('disabled') && item.getAttribute('aria-disabled') !== 'true'
  )
)

const getSelectedSelectItem = (root: HTMLElement): HTMLElement | undefined => (
  getEnabledSelectItems(root).find(item => item.getAttribute('aria-selected') === 'true')
)

const isPrintableKey = (event: KeyboardEvent): boolean => (
  event.key.length === 1 && !event.altKey && !event.ctrlKey && !event.metaKey
)

const renderSelectOptions = (select: HTMLSelectElement, listbox: HTMLElement): void => {
  const items = [...select.options]
    .filter(option => !option.hasAttribute('data-ui-select-placeholder'))
    .map(option => {
      const item = document.createElement('button')

      item.type = 'button'

      item.role = 'option'

      item.dataset.uiSelectOption = ''

      item.dataset.value = option.value

      item.textContent = option.label

      if (option.disabled) {
        item.disabled = true

        item.setAttribute('aria-disabled', 'true')
      }

      return item
    })

  listbox.replaceChildren(...items)
}

const getSelectPlaceholder = (placeholder: HTMLOptionElement | null): string => placeholder?.textContent.trim() || 'Select an option'

const syncSelectValue = (root: HTMLElement): void => {
  const select = root.querySelector<HTMLSelectElement>('[data-ui-select-native]')
  const trigger = root.querySelector<HTMLElement>('[data-ui-select-trigger]')
  const value = root.querySelector<HTMLElement>('[data-ui-select-value]')

  if (!select || !trigger || !value) return

  const selectedOption = select.selectedOptions[0]
  const hasSelection = selectedOption !== undefined && !selectedOption.hasAttribute('data-ui-select-placeholder')
  const placeholder = select.querySelector<HTMLOptionElement>('[data-ui-select-placeholder]')

  value.textContent = hasSelection ?
    selectedOption.label :
    getSelectPlaceholder(placeholder)

  root.dataset.placeholder = hasSelection ? 'false' : 'true'

  for (const item of getSelectItems(root)) {
    item.setAttribute('aria-selected', String(hasSelection && item.dataset.value === select.value))
  }
}

const selectSelectOption = (root: HTMLElement, item: HTMLElement): void => {
  const select = root.querySelector<HTMLSelectElement>('[data-ui-select-native]')
  const trigger = root.querySelector<HTMLElement>('[data-ui-select-trigger]')

  if (!select || !trigger || item.hasAttribute('disabled') || item.getAttribute('aria-disabled') === 'true') return

  select.value = item.dataset.value ?? ''

  select.dispatchEvent(new Event('input', { bubbles: true }))

  select.dispatchEvent(new Event('change', { bubbles: true }))

  syncSelectValue(root)

  closeSelect(root)

  trigger.focus({ preventScroll: true })
}

const focusSelectOption = (
  root: HTMLElement,
  key: string,
  currentItem?: HTMLElement
): void => {
  const items = getEnabledSelectItems(root)

  if (!items.length) return

  const current = currentItem ?? getSelectedSelectItem(root) ?? items[0]
  const currentIndex = current ? items.indexOf(current) : -1
  const nextItem = items[getLoopedIndex(key, Math.max(0, currentIndex), items.length, ['ArrowDown'])]

  nextItem?.focus()
}

const inferSelectLabel = (select: HTMLSelectElement, trigger: HTMLElement): void => {
  if (!trigger.hasAttribute('aria-label') && !trigger.hasAttribute('aria-labelledby')) {
    const label = [...select.labels].find(item => item.textContent.trim())

    if (label?.textContent) {
      trigger.setAttribute('aria-label', label.textContent.trim())
    }
  }
}

const syncSelectLabels = (select: HTMLSelectElement, trigger: HTMLElement, listbox: HTMLElement): void => {
  for (const attribute of ['aria-label', 'aria-labelledby', 'aria-describedby', 'aria-invalid']) {
    const value = select.getAttribute(attribute)

    if (value) {
      trigger.setAttribute(attribute, value)
    }
  }

  if (select.required) {
    trigger.setAttribute('aria-required', 'true')
  }

  inferSelectLabel(select, trigger)

  for (const attribute of ['aria-label', 'aria-labelledby']) {
    const value = trigger.getAttribute(attribute)

    if (value) listbox.setAttribute(attribute, value)
  }

  for (const label of select.labels) {
    label.addEventListener('click', event => {
      event.preventDefault()

      trigger.focus({ preventScroll: true })
    })
  }
}

const focusSelectedItem = (root: HTMLElement): void => {
  const item = getSelectedSelectItem(root) ?? getEnabledSelectItems(root)[0]

  item?.focus()
}

const bindSelects = (root: HTMLElement): void => {
  if (root.dataset.uiBound === 'true' || isOwnedByAnotherAdapter(root)) return

  const select = root.querySelector<HTMLSelectElement>('[data-ui-select-native]')
  const control = root.querySelector<HTMLElement>('[data-ui-select-control]')
  const trigger = root.querySelector<HTMLButtonElement>('[data-ui-select-trigger]')
  const listbox = root.querySelector<HTMLElement>('[data-ui-select-list]')

  if (!select || !control || !trigger || !listbox) return

  root.dataset.uiBound = 'true'

  renderSelectOptions(select, listbox)

  control.hidden = false

  select.dataset.uiEnhanced = 'true'

  select.tabIndex = -1

  select.setAttribute('aria-hidden', 'true')

  trigger.disabled = select.disabled

  trigger.setAttribute('aria-haspopup', 'listbox')

  syncSelectLabels(select, trigger, listbox)

  let typeahead = ''
  let typeaheadTimer = 0

  const focusTypeaheadOption = (currentItem?: HTMLElement): void => {
    const items = getEnabledSelectItems(root)

    if (!items.length || !typeahead) return

    const selectedItem = getSelectedSelectItem(root) ?? items[0]
    const current = currentItem ?? selectedItem
    const currentIndex = current ? items.indexOf(current) : -1
    const startIndex = Math.max(0, currentIndex + 1)
    const orderedItems = [...items.slice(startIndex), ...items.slice(0, startIndex)]
    const nextItem = orderedItems.find(item => item.textContent.trim().toLowerCase().startsWith(typeahead))

    nextItem?.focus()
  }

  const handleTypeahead = (event: KeyboardEvent, currentItem?: HTMLElement): boolean => {
    if (!isPrintableKey(event) || (
      event.key === ' ' && (!typeahead || trigger.getAttribute('aria-expanded') !== 'true')
    )) return false

    event.preventDefault()

    typeahead += event.key.toLowerCase()

    window.clearTimeout(typeaheadTimer)

    typeaheadTimer = window.setTimeout(() => {
      typeahead = ''
    }, 700)

    openSelect(root)

    focusTypeaheadOption(currentItem)

    return true
  }

  syncSelectValue(root)

  closeSelect(root)

  root.addEventListener('focusout', event => {
    if (event.relatedTarget instanceof Node && root.contains(event.relatedTarget)) return

    typeahead = ''

    window.clearTimeout(typeaheadTimer)

    closeSelect(root)
  })

  trigger.addEventListener('click', () => {
    const isOpen = trigger.getAttribute('aria-expanded') === 'true'

    typeahead = ''

    window.clearTimeout(typeaheadTimer)

    if (isOpen) {
      closeSelect(root)
    } else {
      openSelect(root)
    }
  })

  trigger.addEventListener('keydown', event => {
    if (event.defaultPrevented || event.isComposing) return

    if (handleTypeahead(event)) return

    if (event.key === 'Escape' && !listbox.hidden) {
      event.preventDefault()

      closeSelect(root)

      return
    }

    const navigationKeys = ['ArrowDown', 'ArrowUp', 'Home', 'End', 'Enter', ' ']

    if (!navigationKeys.includes(event.key)) return

    event.preventDefault()

    typeahead = ''

    window.clearTimeout(typeaheadTimer)

    openSelect(root)

    if (event.key === 'Enter' || event.key === ' ') {
      ;

      focusSelectedItem(root)

      return
    }

    focusSelectOption(root, event.key)
  })

  select.addEventListener('change', () => {
    syncSelectValue(root)
  })

  select.form?.addEventListener('reset', () => {
    window.setTimeout(() => {
      syncSelectValue(root)
    })
  })

  for (const item of getSelectItems(root)) {
    item.tabIndex = -1

    item.addEventListener('click', () => {
      selectSelectOption(root, item)
    })

    item.addEventListener('keydown', event => {
      if (event.defaultPrevented || event.isComposing) return

      if (handleTypeahead(event, item)) return

      if (event.key === 'Escape' && !listbox.hidden) {
        event.preventDefault()

        closeSelect(root)

        trigger.focus({ preventScroll: true })

        return
      }

      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()

        selectSelectOption(root, item)

        return
      }

      if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return

      event.preventDefault()

      typeahead = ''

      window.clearTimeout(typeaheadTimer)

      focusSelectOption(root, event.key, item)
    })
  }
}

export const initSelects = (scope: ParentNode): void => {
  for (const root of queryScope(scope, '[data-ui-select]')) bindSelects(root)
}
