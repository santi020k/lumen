import { queryScope } from '../scope.js'

import { getLoopedIndex } from './shared.js'

const bindMentions = (root: HTMLElement): void => {
  if (root.dataset.uiBound === 'true') return

  const input = root.querySelector<HTMLTextAreaElement>('[data-ui-mentions-input]')
  const list = root.querySelector<HTMLElement>('[data-ui-mentions-list]')

  if (!input || !list) return

  root.dataset.uiBound = 'true'

  const trigger = root.dataset.uiMentionsTrigger ?? '@'
  const escapedTrigger = trigger.replaceAll(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const options = [...list.querySelectorAll<HTMLButtonElement>('[data-ui-mentions-option]')]
  let activeIndex = -1

  for (const option of options) {
    option.tabIndex = -1
  }

  const setActive = (index: number): void => {
    const visibleOptions = options.filter(option => !option.hidden)

    activeIndex = visibleOptions.length && index >= 0 ?
      Math.min(index, visibleOptions.length - 1) :
      -1

    for (const option of options) {
      option.setAttribute('aria-selected', option === visibleOptions[activeIndex] ? 'true' : 'false')
    }

    const active = visibleOptions[activeIndex]

    if (active?.id) input.setAttribute('aria-activedescendant', active.id)
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
    let visibleCount = 0

    for (const option of options) {
      const visible = (option.dataset.value ?? '').toLowerCase().startsWith(query)

      option.hidden = !visible

      if (visible) visibleCount += 1
    }

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
    insert(option?.dataset.value ?? '')
  }

  input.addEventListener('input', filter)

  input.addEventListener('keydown', event => {
    const visibleOptions = options.filter(option => !option.hidden)

    if (event.defaultPrevented || event.isComposing) return

    if (event.key === 'Escape' && !list.hidden) {
      event.preventDefault()

      close()
    } else if (['ArrowDown', 'ArrowUp', 'End', 'Home'].includes(event.key) && visibleOptions.length) {
      event.preventDefault()

      const nextIndex = getLoopedIndex(
        event.key, activeIndex, visibleOptions.length, ['ArrowDown']
      )

      setActive(nextIndex)
    } else if (event.key === 'Enter' && activeIndex >= 0 && !list.hidden) {
      event.preventDefault()

      insertOption(visibleOptions[activeIndex])
    }
  })

  input.addEventListener('blur', () => window.setTimeout(() => {
    if (!root.contains(root.ownerDocument.activeElement)) close()
  }, 120))

  for (const option of options) {
    option.addEventListener('mousedown', event => {
      event.preventDefault()
    })

    option.addEventListener('click', () => {
      insert(option.dataset.value ?? '')
    })
  }
}

export const initMentions = (scope: ParentNode): void => {
  for (const root of queryScope(scope, '[data-ui-mentions]')) bindMentions(root)
}
