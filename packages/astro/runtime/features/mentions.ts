import { queryScope } from '../scope.js'

import { getLoopedIndex, shouldIgnoreKeydown } from './shared.js'

const bindMentions = (root: HTMLElement): void => {
  if (root.dataset.uiBound === 'true') return

  const input = root.querySelector<HTMLTextAreaElement>('[data-ui-mentions-input]')
  const list = root.querySelector<HTMLElement>('[data-ui-mentions-list]')

  if (!input || !list) return

  root.dataset.uiBound = 'true'

  const trigger = root.dataset.uiMentionsTrigger ?? '@'
  const escapedTrigger = trigger.replaceAll(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const options = [...list.querySelectorAll<HTMLButtonElement>('[data-ui-mentions-option]')]
  const navigableOptions = (): HTMLButtonElement[] => options.filter(option => !option.matches(':disabled') && !option.closest('[hidden], [inert]'))
  let activeOption: HTMLButtonElement | undefined

  for (const option of options) {
    option.tabIndex = -1
  }

  const setActive = (index: number): void => {
    const visibleOptions = navigableOptions()

    const activeIndex = visibleOptions.length && index >= 0 ?
      Math.min(index, visibleOptions.length - 1) :
      -1

    activeOption = visibleOptions[activeIndex]

    for (const option of options) {
      option.setAttribute('aria-selected', option === activeOption ? 'true' : 'false')
    }

    if (activeOption?.id) input.setAttribute('aria-activedescendant', activeOption.id)
    else input.removeAttribute('aria-activedescendant')
  }

  const close = (): void => {
    list.hidden = true

    input.setAttribute('aria-expanded', 'false')

    setActive(-1)
  }

  const filter = (): void => {
    const caret = input.selectionStart
    const match = new RegExp(`${escapedTrigger}(\\w*)$`).exec(input.value.slice(0, caret))

    if (!match) {
      close()

      return
    }

    const query = (match[1] ?? '').toLowerCase()

    for (const option of options) {
      const visible = (option.dataset.value ?? '').toLowerCase().startsWith(query)

      option.hidden = !visible
    }

    list.hidden = false

    const visibleCount = navigableOptions().length

    list.hidden = visibleCount === 0

    input.setAttribute('aria-expanded', visibleCount > 0 ? 'true' : 'false')

    setActive(0)
  }

  const insert = (value: string): void => {
    const caret = input.selectionStart
    const before = input.value.slice(0, caret).replace(new RegExp(`${escapedTrigger}\\w*$`), `${trigger}${value} `)

    input.value = before + input.value.slice(caret)

    input.focus()

    input.setSelectionRange(before.length, before.length)

    close()

    input.dispatchEvent(new Event('input', { bubbles: true }))
  }

  const insertOption = (option: HTMLButtonElement | undefined): void => {
    if (!option || option.matches(':disabled, [aria-disabled="true"]') || option.closest('[hidden], [inert]')) return

    if (input.matches(':disabled, [readonly], [aria-disabled="true"]')) return

    insert(option.dataset.value ?? '')
  }

  input.addEventListener('input', filter)

  input.addEventListener('keydown', event => {
    const visibleOptions = navigableOptions()

    if (shouldIgnoreKeydown(event)) return

    if (event.key === 'Escape' && !list.hidden) {
      event.preventDefault()

      close()
    } else if (['ArrowDown', 'ArrowUp', 'End', 'Home'].includes(event.key) && visibleOptions.length) {
      event.preventDefault()

      const nextIndex = getLoopedIndex(
        event.key, activeOption ? visibleOptions.indexOf(activeOption) : -1, visibleOptions.length, ['ArrowDown']
      )

      setActive(nextIndex)
    } else if (event.key === 'Enter' && activeOption && !list.hidden) {
      event.preventDefault()

      insertOption(activeOption)
    }
  })

  input.addEventListener('blur', () => window.setTimeout(() => {
    if (!root.contains(root.ownerDocument.activeElement)) close()
  }, 120))

  for (const option of options) {
    option.addEventListener('mousedown', event => {
      event.preventDefault()
    })

    option.addEventListener('click', event => {
      if (!event.defaultPrevented) insertOption(option)
    })
  }
}

export const initMentions = (scope: ParentNode): void => {
  for (const root of queryScope(scope, '[data-ui-mentions]')) bindMentions(root)
}
