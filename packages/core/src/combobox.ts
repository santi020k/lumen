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

const filterOption = (
  item: HTMLElement, query: string, filterHidden: Set<HTMLElement>,
  writeHidden: (item: HTMLElement, hidden: boolean) => void
): void => {
  const label = item.textContent.trim().toLowerCase()
  const value = item.dataset.value?.toLowerCase() ?? ''
  const hidden = Boolean(query) && !label.includes(query) && !value.includes(query)

  if (hidden && !item.hidden) {
    writeHidden(item, true)
  } else if (!hidden && filterHidden.has(item)) {
    writeHidden(item, false)
  }
}

/** Editable combobox. */
export const createLumenComboboxController = (root: HTMLElement): LumenComboboxController => {
  const input = root.querySelector<HTMLInputElement>('input[role="combobox"]')
  const list = root.querySelector<HTMLElement>('[role="listbox"]')
  const document = root.ownerDocument
  const view = document.defaultView

  if (!input || !list || !view) return { close: () => undefined, destroy: () => undefined }

  const abort = new view.AbortController()
  const { signal } = abort
  let active: HTMLElement | undefined
  let composing = false
  let filtering = false
  let destroyed = false
  const filterHidden = new Set<HTMLElement>()
  let resetTimer: ReturnType<typeof view.setTimeout> | undefined
  const eventRoot = root.getRootNode()
  const observerRef: { current?: MutationObserver } = {}

  const preserveVisibility = (records: MutationRecord[]): void => {
    for (const record of records) {
      if (record.attributeName === 'hidden') {
        for (const option of filterHidden) if (option === record.target) filterHidden.delete(option)
      }
    }

    for (const option of filterHidden) {
      if (!list.contains(option)) {
        option.hidden = false

        filterHidden.delete(option)
      }
    }
  }

  if (!list.id) list.id = `ui-combobox-list-${++nextId}`

  input.setAttribute('aria-controls', list.id)

  input.setAttribute('aria-autocomplete', 'list')

  const items = (): HTMLElement[] => [...list.querySelectorAll<HTMLElement>('[role="option"]')]
  const editable = (): boolean => !input.matches(':disabled') && !input.readOnly

  const available = (item: HTMLElement): boolean => !item.hidden &&
    !item.matches(':disabled, [disabled]') && item.getAttribute('aria-disabled') !== 'true'

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

  const flushVisibility = (): void => {
    preserveVisibility(observerRef.current?.takeRecords() ?? [])
  }

  const writeHidden = (item: HTMLElement, hidden: boolean): void => {
    flushVisibility()

    if (hidden) filterHidden.add(item)
    else filterHidden.delete(item)

    item.hidden = hidden

    preserveVisibility(observerRef.current?.takeRecords().slice(1) ?? [])
  }

  const refresh = (): void => {
    flushVisibility()

    const query = input.value.trim().toLowerCase()

    for (const item of items()) {
      item.tabIndex = -1

      if (!item.id) item.id = `ui-combobox-option-${++nextId}`

      if (filtering) filterOption(item, query, filterHidden, writeHidden)
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

    input.dispatchEvent(new view.Event('input', { bubbles: true }))

    input.dispatchEvent(new view.Event('change', { bubbles: true }))

    input.focus({ preventScroll: true })

    close()
  }

  const navigate = (key: string): void => {
    open()

    const options = items().filter(available)
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

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()

      navigate(event.key)

      return
    }

    switch (event.key) {
      case 'Escape':
        if (list.hidden) return

        event.preventDefault()

        close()

        break

      case 'Enter':
        if (list.hidden || !active) return

        event.preventDefault()

        select(active)

        break
    }
  }

  const optionFromEvent = (event: Event): HTMLElement | undefined => (
    items().find(option => event.composedPath().includes(option))
  )

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

  eventRoot.addEventListener('reset', event => {
    if (event.target !== input.form) return

    view.clearTimeout(resetTimer)

    resetTimer = view.setTimeout(() => {
      if (destroyed || event.defaultPrevented || !input.isConnected) return

      composing = false

      filtering = true

      close()

      refresh()
    })
  }, { capture: true, signal })

  list.addEventListener('pointerdown', event => {
    if (optionFromEvent(event)) event.preventDefault()
  }, { signal })

  list.addEventListener('click', event => {
    if (event.defaultPrevented) return

    const option = optionFromEvent(event)

    if (option) {
      event.preventDefault()

      select(option)
    }
  }, { signal })

  const isNode = (target: EventTarget): target is Node => {
    try {
      view.Node.prototype.contains.call(target, null)

      return true
    } catch {
      return false
    }
  }

  root.addEventListener('focusout', event => {
    if (!event.relatedTarget || !isNode(event.relatedTarget) || !root.contains(event.relatedTarget)) close()
  }, { signal })

  document.addEventListener('pointerdown', event => {
    if (!event.composedPath().includes(root)) close()
  }, { signal })

  const observer = new view.MutationObserver(records => {
    preserveVisibility(records)

    if (!destroyed) refresh()
  })

  observerRef.current = observer

  observer.observe(list, {
    attributeFilter: ['disabled', 'aria-disabled', 'data-value', 'hidden'],
    attributes: true,
    characterData: true,
    childList: true,
    subtree: true
  })

  const disabledObserver = new view.MutationObserver(records => {
    if (records.some(record => record.target.nodeName === 'FIELDSET' && record.target.contains(input))) refresh()
  })

  disabledObserver.observe(eventRoot, { attributeFilter: ['disabled'], attributes: true, subtree: true })

  observer.observe(input, { attributeFilter: ['disabled', 'readonly'], attributes: true })

  return {
    close,
    destroy: () => {
      destroyed = true

      view.clearTimeout(resetTimer)

      abort.abort()

      flushVisibility()

      observer.disconnect()

      disabledObserver.disconnect()

      for (const option of filterHidden) option.hidden = false

      filterHidden.clear()

      close()
    }
  }
}
