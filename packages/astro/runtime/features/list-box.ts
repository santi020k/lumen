import { bindListBoxProxy } from '../controllers/list-box-proxy'

import { isOwnedByAnotherAdapter, nextRuntimeId } from './shared.js'

const getListBoxSelectedValues = (select: HTMLSelectElement): string[] => [
  ...select.selectedOptions
].map(option => option.value)

const listBoxResyncs = new WeakMap<HTMLElement, () => void>()

const bindListBoxes = (root: HTMLElement): void => {
  if (root.dataset.uiListBoxBound === 'true') return

  if (isOwnedByAnotherAdapter(root)) return

  const select = root.querySelector<HTMLSelectElement>('[data-ui-list-box-native]')
  const list = root.querySelector<HTMLElement>('[data-ui-list-box-list]')
  const options = [...(list?.querySelectorAll<HTMLElement>('[data-ui-list-box-option]') ?? [])]

  if (!select || !list || !options.length) return

  root.dataset.uiListBoxBound = 'true'

  select.dataset.uiListBoxEnhanced = 'true'

  list.hidden = false

  const optionIdPrefix = select.id || nextRuntimeId('ui-list-box', root.ownerDocument)

  let activeIndex = Math.max(
    0, options.findIndex(option => option.getAttribute('aria-disabled') !== 'true')
  )

  let typeahead = ''
  let typeaheadTimer = 0

  const syncActive = (): void => {
    options.forEach((option, index) => {
      option.id ||= `${optionIdPrefix}-option-${index}`

      option.dataset.active = index === activeIndex ? 'true' : 'false'
    })

    const activeOption = options[activeIndex]

    if (activeOption) list.setAttribute('aria-activedescendant', activeOption.id)
  }

  const syncSelected = (): void => {
    const selectedValues = new Set(getListBoxSelectedValues(select))

    for (const option of options) {
      option.setAttribute('aria-selected', String(selectedValues.has(option.dataset.value ?? '')))
    }
  }

  const commitOption = (index: number): void => {
    const option = options[index]

    if (!option || option.getAttribute('aria-disabled') === 'true' || select.disabled) return

    const nativeOption = [...select.options].find(item => item.value === option.dataset.value)

    if (!nativeOption) return

    if (select.multiple) nativeOption.selected = !nativeOption.selected
    else select.value = nativeOption.value

    syncSelected()

    select.dispatchEvent(new Event('input', { bubbles: true }))

    select.dispatchEvent(new Event('change', { bubbles: true }))

    root.dispatchEvent(new CustomEvent('ui:list-box-change', {
      bubbles: true,
      detail: { values: getListBoxSelectedValues(select) }
    }))
  }

  const moveActive = (direction: 1 | -1): void => {
    let nextIndex = activeIndex

    for (const _option of options) {
      nextIndex = (nextIndex + direction + options.length) % options.length

      if (options[nextIndex]?.getAttribute('aria-disabled') !== 'true') {
        activeIndex = nextIndex

        syncActive()

        if (root.dataset.selectionFollowsFocus === 'true') commitOption(activeIndex)

        return
      }
    }
  }

  const followFocus = (): void => {
    syncActive()

    if (root.dataset.selectionFollowsFocus === 'true') commitOption(activeIndex)
  }

  const keyActions: Record<string, () => void> = {
    ArrowDown: () => {
      moveActive(1)
    },
    ArrowUp: () => {
      moveActive(-1)
    },
    Home: () => {
      activeIndex = Math.max(0, options.findIndex(option => option.getAttribute('aria-disabled') !== 'true'))

      followFocus()
    },
    End: () => {
      for (let index = options.length - 1; index >= 0; index -= 1) {
        if (options[index]?.getAttribute('aria-disabled') !== 'true') {
          activeIndex = index

          break
        }
      }

      followFocus()
    },
    Enter: () => {
      commitOption(activeIndex)
    },
    ' ': () => {
      commitOption(activeIndex)
    }
  }

  const handleTypeahead = (event: KeyboardEvent): void => {
    if (event.key.length !== 1 || event.ctrlKey || event.metaKey || event.altKey) return

    typeahead += event.key.toLowerCase()

    window.clearTimeout(typeaheadTimer)

    typeaheadTimer = window.setTimeout(() => {
      typeahead = ''
    }, 700)

    const nextIndex = options.findIndex(option => option.getAttribute('aria-disabled') !== 'true' &&
      option.textContent.trim().toLowerCase().startsWith(typeahead))

    if (nextIndex < 0) return

    activeIndex = nextIndex

    followFocus()
  }

  list.addEventListener('keydown', event => {
    const action = Object.hasOwn(keyActions, event.key) ? keyActions[event.key] : undefined

    if (!action) {
      handleTypeahead(event)

      return
    }

    event.preventDefault()

    action()
  })

  options.forEach((option, index) => {
    option.addEventListener('click', () => {
      activeIndex = index

      syncActive()

      commitOption(index)
    })
  })

  listBoxResyncs.set(root, bindListBoxProxy(root, select, list, () => nextRuntimeId('ui-list-box-label', root.ownerDocument), () => {
    if (!options.length) return

    syncSelected()

    activeIndex = Math.max(0, options.findIndex(option => option.getAttribute('aria-selected') === 'true'))

    syncActive()
  }))

  select.addEventListener('change', syncSelected)

  syncSelected()

  syncActive()
}

export const initListBoxes = (scope: ParentNode): void => {
  for (const root of scope.querySelectorAll<HTMLElement>('[data-ui-list-box]')) {
    listBoxResyncs.get(root)?.()

    bindListBoxes(root)
  }
}
