export interface FeedbackItem {
  id: string
  title: string
  description: string
  status: string
  votes: string
  voted: boolean
}

export interface FeedbackActions {
  load: (sort: string, signal: AbortSignal) => Promise<readonly FeedbackItem[]>
  submit: (values: FormData, signal: AbortSignal) => Promise<void>
  vote: (id: string, signal: AbortSignal) => Promise<void>
}

const renderFeedbackItems = (template: HTMLTemplateElement, items: readonly FeedbackItem[]): DocumentFragment => {
  const fragment = document.createDocumentFragment()

  for (const item of items) {
    const clone = template.content.cloneNode(true)

    if (!(clone instanceof DocumentFragment)) throw new Error('Invalid feedback template')

    const parts: readonly (readonly [string, string])[] = [
      ['title', item.title], ['description', item.description], ['status', item.status], ['votes', item.votes]
    ]

    for (const [part, text] of parts) {
      const element = clone.querySelector(`[data-item-${part}]`)

      if (element) element.textContent = text
    }

    const vote = clone.querySelector('button')

    if (vote) {
      vote.dataset.itemId = item.id

      vote.setAttribute('aria-pressed', String(item.voted))
    }

    fragment.append(clone)
  }

  return fragment
}

const mountedBoards = new WeakMap<HTMLElement, () => void>()

/** Call once per mounted board and dispose before removing it or navigating. */
export const initializeFeedbackBoard = (root: HTMLElement, actions: FeedbackActions): (() => void) => {
  mountedBoards.get(root)?.()

  const lifetime = new AbortController()
  let request: AbortController | undefined
  let revision = 0
  let pending = false
  const isActive = (): boolean => !lifetime.signal.aborted
  const isCurrentLoad = (signal: AbortSignal, current: number): boolean => !signal.aborted && current === revision

  const messages = {
    loading: root.dataset.loading ?? '',
    empty: root.dataset.empty ?? '',
    failure: root.dataset.failure ?? '',
    success: root.dataset.success ?? ''
  }

  const required = <T extends Element>(selector: string, constructor: new (...args: never[]) => T): T => {
    const element = root.querySelector(selector)

    if (!(element instanceof constructor)) throw new Error(`Missing feedback recipe element ${selector}`)

    return element
  }

  const form = required('form', HTMLFormElement)
  const sort = required('select[data-feedback-sort]', HTMLSelectElement)
  let requestedSort = sort.value
  const list = required('[data-feedback-list]', HTMLOListElement)
  const template = required('template', HTMLTemplateElement)
  const status = required('[data-feedback-status]', HTMLElement)
  const actionStatus = required('[data-feedback-action-status]', HTMLElement)
  const retry = required('[data-feedback-retry]', HTMLButtonElement)
  const submit = required('[type="submit"]', HTMLButtonElement)
  const fields = required('[data-feedback-fields]', HTMLFieldSetElement)

  fields.disabled = false

  const announce = (message: string) => {
    status.textContent = message
  }

  const announceAction = (message: string) => {
    actionStatus.hidden = false

    actionStatus.textContent = message

    actionStatus.focus()
  }

  const load = async () => {
    request?.abort()

    request = new AbortController()

    const current = ++revision
    const signal = request.signal

    list.setAttribute('aria-busy', 'true')

    retry.hidden = true

    announce(messages.loading)

    requestedSort = sort.value

    try {
      const items = await actions.load(requestedSort, signal)

      if (!isCurrentLoad(signal, current)) return

      const fragment = renderFeedbackItems(template, items)

      if (sort.value !== requestedSort) {
        void load()

        return
      }

      list.replaceChildren(fragment)

      announce(items.length ? '' : messages.empty)
    } catch {
      if (!isCurrentLoad(signal, current)) return

      announce(messages.failure)

      retry.hidden = false
    } finally {
      if (isCurrentLoad(signal, current)) list.setAttribute('aria-busy', 'false')
    }
  }

  const mutate = async (operation: () => Promise<void>, control: HTMLButtonElement) => {
    if (pending || !isActive()) return

    pending = true

    control.disabled = true

    control.setAttribute('aria-busy', 'true')

    actionStatus.hidden = true

    try {
      await operation()

      if (!isActive()) return

      announceAction(messages.success)

      await load()
    } catch {
      if (isActive()) announceAction(messages.failure)
    } finally {
      pending = false

      if (isActive()) {
        control.disabled = false

        control.removeAttribute('aria-busy')
      }
    }
  }

  form.addEventListener('submit', event => {
    event.preventDefault()

    const values = new FormData(form)

    void mutate(() => actions.submit(values, lifetime.signal), submit)
  }, { signal: lifetime.signal })

  list.addEventListener('click', event => {
    const button = event.target instanceof Element ? event.target.closest('button[data-item-id]') : null

    if (button instanceof HTMLButtonElement && button.dataset.itemId) {
      const id = button.dataset.itemId

      void mutate(() => actions.vote(id, lifetime.signal), button)
    }
  }, { signal: lifetime.signal })

  sort.addEventListener('change', () => {
    void load()
  }, { signal: lifetime.signal })

  retry.addEventListener('click', () => {
    void load()
  }, { signal: lifetime.signal })

  void load()

  // History restoration can update native form values after Astro's page-load event.
  const synchronizeSort = () => {
    if (isActive() && requestedSort !== sort.value) void load()
  }

  window.addEventListener('pageshow', synchronizeSort, { signal: lifetime.signal })

  requestAnimationFrame(() => requestAnimationFrame(synchronizeSort))

  const dispose = () => {
    fields.disabled = true

    lifetime.abort()

    request?.abort()
  }

  mountedBoards.set(root, dispose)

  return dispose
}
