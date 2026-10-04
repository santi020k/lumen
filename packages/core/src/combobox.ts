export interface LumenComboboxController {
  close: () => void
  destroy: () => void
}

let nextId = 0

const ignoresKeyboard = (
  event: KeyboardEvent,
  composing: boolean
): boolean => event.defaultPrevented || event.isComposing || composing ||
  event.altKey || event.ctrlKey || event.metaKey

const filterOption = (item: HTMLElement, query: string): void => {
  const label = item.textContent.trim().toLowerCase()
  const value = item.dataset.value?.toLowerCase() ?? ''
  const hidden = Boolean(query) && !label.includes(query) && !value.includes(query)

  if (item.hidden !== hidden) item.hidden = hidden
}

/** Editable listbox navigation keeps DOM focus and text editing in the input. */
export const createLumenComboboxController = (root: HTMLElement): LumenComboboxController => {
  const input = root.querySelector<HTMLInputElement>('input[role="combobox"]')
  const list = root.querySelector<HTMLElement>('[role="listbox"]')

  if (!input || !list) return { close: () => undefined, destroy: () => undefined }

  const document = root.ownerDocument
  const abort = new AbortController()
  const { signal } = abort
  let active: HTMLElement | undefined
  let composing = false
  let filtering = false
  let destroyed = false
  let resetTimer: ReturnType<typeof globalThis.setTimeout> | undefined

  if (!list.id) list.id = `ui-combobox-list-${++nextId}`

  input.setAttribute('aria-controls', list.id)

  input.setAttribute('aria-autocomplete', 'list')

  const items = (): HTMLElement[] => [...list.querySelectorAll<HTMLElement>('[role="option"]')]
  const editable = (): boolean => !input.disabled && !input.readOnly

  const available = (item: HTMLElement): boolean => !item.hidden &&
    !item.hasAttribute('disabled') && item.getAttribute('aria-disabled') !== 'true'

  const visible = (): HTMLElement[] => items().filter(available)

  const activate = (item?: HTMLElement): void => {
    active = item

    for (const option of items()) option.setAttribute('aria-selected', String(option === item))

    if (item) {
      if (!item.id) item.id = `ui-combobox-option-${++nextId}`

      input.setAttribute('aria-activedescendant', item.id)
    } else {
      input.removeAttribute('aria-activedescendant')
    }
  }

  const close = (): void => {
    input.setAttribute('aria-expanded', 'false')

    if (!list.hidden) list.hidden = true

    list.dataset.state = 'closed'

    activate()
  }

  const refresh = (): void => {
    const query = input.value.trim().toLowerCase()

    for (const item of items()) {
      item.tabIndex = -1

      if (!item.id) item.id = `ui-combobox-option-${++nextId}`

      if (filtering) filterOption(item, query)
    }

    if (active && (!list.contains(active) || !available(active))) activate()

    if (!editable()) close()
  }

  const open = (): void => {
    if (!editable()) return

    refresh()

    input.setAttribute('aria-expanded', 'true')

    list.hidden = false

    list.dataset.state = 'open'
  }

  const select = (item: HTMLElement): void => {
    if (!editable() || !list.contains(item) || !available(item)) return

    input.value = item.dataset.value ?? item.textContent.trim()

    input.dispatchEvent(new Event('input', { bubbles: true }))

    input.dispatchEvent(new Event('change', { bubbles: true }))

    input.focus({ preventScroll: true })

    close()
  }

  const navigate = (key: string): void => {
    open()

    const options = visible()
    const index = active ? options.indexOf(active) : -1
    let next = (index + 1) % options.length

    if (key === 'ArrowUp') {
      next = index < 0 ? options.length - 1 : (index - 1 + options.length) % options.length
    }

    activate(options[next])

    if (typeof active?.scrollIntoView === 'function') active.scrollIntoView({ block: 'nearest' })
  }

  const keydown = (event: KeyboardEvent): void => {
    if (ignoresKeyboard(event, composing) || !editable()) return

    switch (event.key) {
      case 'Escape':
        if (list.hidden) return

        event.preventDefault()

        close()

        break

      case 'ArrowDown':
        event.preventDefault()

        navigate(event.key)

        break

      case 'ArrowUp':
        event.preventDefault()

        navigate(event.key)

        break

      case 'Enter':
        if (list.hidden || !active) return

        event.preventDefault()

        select(active)

        break
    }
  }

  const optionFromEvent = (event: Event): HTMLElement | undefined => {
    const target = event.composedPath()[0]
    const option = target instanceof Element ? target.closest<HTMLElement>('[role="option"]') : null

    return option && list.contains(option) ? option : undefined
  }

  refresh()

  close()

  input.addEventListener('focus', open, { signal })

  input.addEventListener('compositionstart', () => {
    composing = true
  }, { signal })

  input.addEventListener('compositionend', () => {
    composing = false

    filtering = true

    activate()

    open()
  }, { signal })

  input.addEventListener('input', () => {
    if (composing) return

    filtering = true

    activate()

    open()
  }, { signal })

  input.addEventListener('keydown', keydown, { signal })

  input.form?.addEventListener('reset', event => {
    globalThis.clearTimeout(resetTimer)

    resetTimer = globalThis.setTimeout(() => {
      if (destroyed || event.defaultPrevented || !input.isConnected) return

      composing = false

      filtering = true

      close()

      refresh()
    })
  }, { signal })

  list.addEventListener('pointerdown', event => {
    if (optionFromEvent(event)) event.preventDefault()
  }, { signal })

  list.addEventListener('click', event => {
    if (event.defaultPrevented) return

    const option = optionFromEvent(event)

    if (option) select(option)
  }, { signal })

  root.addEventListener('focusout', event => {
    if (!(event.relatedTarget instanceof Node) || !root.contains(event.relatedTarget)) close()
  }, { signal })

  document.addEventListener('pointerdown', event => {
    const target = event.composedPath()[0]

    if (target instanceof Node && !root.contains(target)) close()
  }, { signal })

  const observer = new MutationObserver(() => {
    if (!destroyed) refresh()
  })

  observer.observe(list, {
    attributeFilter: ['disabled', 'aria-disabled', 'data-value', 'hidden'],
    attributes: true,
    characterData: true,
    childList: true,
    subtree: true
  })

  observer.observe(input, { attributeFilter: ['disabled', 'readonly'], attributes: true })

  return {
    close,
    destroy: () => {
      destroyed = true

      globalThis.clearTimeout(resetTimer)

      abort.abort()

      observer.disconnect()

      close()
    }
  }
}
