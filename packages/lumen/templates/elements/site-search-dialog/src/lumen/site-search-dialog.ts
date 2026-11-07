import '@santi020k/lumen-elements/styles/components/button.css'
import '@santi020k/lumen-elements/styles/components/dialog.css'
import '@santi020k/lumen-elements/styles/components/dialog-header.css'
import '@santi020k/lumen-elements/styles/components/dialog-title.css'
import '@santi020k/lumen-elements/styles/components/dialog-body.css'
import '@santi020k/lumen-elements/styles/components/empty.css'
import '@santi020k/lumen-elements/styles/components/link.css'
import '@santi020k/lumen-elements/styles/components/label.css'
import '@santi020k/lumen-elements/styles/components/search-field.css'
import './site-search-dialog.css'
import '@santi020k/lumen-elements/styles/components/kbd.css'

import { defineLumenButton } from '@santi020k/lumen-elements/components/button'
import { defineLumenDialog, defineLumenDialogParts } from '@santi020k/lumen-elements/components/dialog'
import { defineLumenEmpty } from '@santi020k/lumen-elements/components/empty'
import { defineLumenKbd } from '@santi020k/lumen-elements/components/kbd'
import { defineLumenLabel } from '@santi020k/lumen-elements/components/label'
import { defineLumenLink } from '@santi020k/lumen-elements/components/link'
import { defineLumenSearchField } from '@santi020k/lumen-elements/components/search-field'

defineLumenKbd()

defineLumenButton()

defineLumenDialog()

defineLumenDialogParts()

defineLumenEmpty()

defineLumenLink()

defineLumenSearchField()

defineLumenLabel()

export interface SiteSearchResult {
  href: string
  title: string
  description?: string
}

export type SiteSearchProvider = (
  query: string,
  signal: AbortSignal
) => readonly SiteSearchResult[] | Promise<readonly SiteSearchResult[]>

const webHref = (href: string): string | undefined => {
  try {
    const url = new URL(href, document.baseURI)

    if (url.protocol === 'http:' || url.protocol === 'https:') return url.href
  } catch {
    return undefined
  }
}

const createResultRows = (
  template: HTMLTemplateElement, matches: readonly SiteSearchResult[]
): DocumentFragment => {
  const rows = document.createDocumentFragment()

  for (const match of matches) {
    const href = webHref(match.href)

    if (!href) continue

    const row = document.importNode(template.content, true)
    const link = row.querySelector('a')
    const title = row.querySelector('[data-search-result-title]')
    const description = row.querySelector<HTMLElement>('[data-search-result-description]')

    if (!link || !title || !description) continue

    link.href = href

    title.textContent = match.title

    description.textContent = match.description ?? ''

    description.hidden = !match.description

    rows.append(row)
  }

  return rows
}

const isCurrentSearch = (dialog: HTMLDialogElement, signal: AbortSignal): boolean => (
  dialog.open && !signal.aborted
)

const hasModifier = (event: KeyboardEvent | MouseEvent): boolean => (
  event.altKey || event.ctrlKey || event.metaKey || event.shiftKey
)

const moveResultFocus = (links: HTMLAnchorElement[], index: number, forwards: boolean): void => {
  if (index < 0) {
    links[forwards ? 0 : links.length - 1]?.focus()

    return
  }

  const delta = forwards ? 1 : -1

  links[(index + delta + links.length) % links.length]?.focus()
}

const isResultKey = (event: KeyboardEvent): boolean => (
  !event.defaultPrevented && !event.isComposing && !hasModifier(event) &&
  ['ArrowDown', 'ArrowUp', 'Enter'].includes(event.key)
)

const handleResultsKey = (
  event: KeyboardEvent, field: HTMLInputElement, results: HTMLOListElement
): void => {
  if (!isResultKey(event)) return

  const links = [...results.querySelectorAll<HTMLAnchorElement>('a[href]')]
  const fromField = event.target === field
  const index = links.findIndex(link => link === event.target)

  if (!links.length || (!fromField && index < 0)) return

  if (event.key === 'Enter') {
    if (!fromField) return

    event.preventDefault()

    links[0]?.click()
  } else {
    event.preventDefault()

    moveResultFocus(links, index, event.key === 'ArrowDown')
  }
}

const isSearchShortcut = (event: KeyboardEvent): boolean => (
  !event.defaultPrevented && !event.repeat && !event.isComposing && !event.altKey && !event.shiftKey &&
  (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k'
)

const isEditable = (target: EventTarget | undefined): boolean => (
  target instanceof HTMLElement &&
  (target.isContentEditable || Boolean(target.closest('input, textarea, select, [role="textbox"]')))
)

const getSearchParts = (root: HTMLElement) => {
  const dialog = root.querySelector('dialog')
  const trigger = root.querySelector<HTMLElement>('[data-search-trigger]')
  const field = root.querySelector<HTMLInputElement>('[data-search-field] input')
  const status = root.querySelector<HTMLElement>('[data-search-status]')
  const message = root.querySelector<HTMLElement>('[data-search-message]')
  const recovery = root.querySelector<HTMLElement>('[data-search-recovery]')
  const retry = root.querySelector<HTMLElement>('[data-search-retry]')
  const results = root.querySelector<HTMLOListElement>('[data-search-results]')
  const template = root.querySelector<HTMLTemplateElement>('[data-search-result]')

  if (!dialog || !trigger || !field || !status || !message || !recovery || !retry || !results || !template) return

  return { dialog, trigger, field, status, message, recovery, retry, results, template }
}

class SiteSearchDialog extends HTMLElement {
  private searchProvider: SiteSearchProvider | undefined

  get provider(): SiteSearchProvider | undefined {
    return this.searchProvider
  }

  set provider(value: SiteSearchProvider | undefined) {
    this.request?.abort()

    this.searchProvider = value

    this.dispatchEvent(new Event('search-provider-change'))
  }

  private generation = 0
  private connection?: AbortController
  private request?: AbortController

  connectedCallback() {
    const generation = ++this.generation

    queueMicrotask(() => {
      if (this.isConnected && generation === this.generation) this.connect()
    })
  }

  private connect() {
    const parts = getSearchParts(this)

    if (!parts) return

    const { dialog, trigger, field, status, message, recovery, retry, results, template } = parts

    this.connection?.abort()

    this.request?.abort()

    this.connection = new AbortController()

    const { signal } = this.connection

    const showRecovery = (copy: string, canRetry: boolean) => {
      message.textContent = copy

      status.textContent = copy

      recovery.hidden = false

      retry.hidden = !canRetry
    }

    const statusCopy = (state: 'loading' | 'results' | 'empty' | 'failure') => this.dataset[state] ?? ''

    const update = async () => {
      this.request?.abort()

      results.replaceChildren()

      retry.hidden = true

      recovery.hidden = true

      status.textContent = ''

      const query = field.value.trim()

      if (!dialog.open || !this.provider || !query) return

      const request = new AbortController()

      this.request = request

      status.textContent = statusCopy('loading')

      try {
        const matches = await this.provider(query, request.signal)

        if (!isCurrentSearch(dialog, request.signal)) return

        const rows = createResultRows(template, matches)
        const count = rows.childElementCount

        results.replaceChildren(rows)

        if (count > 0) {
          status.textContent = statusCopy('results').replaceAll('{count}', String(count))
        } else {
          showRecovery(statusCopy('empty'), false)
        }
      } catch {
        if (!isCurrentSearch(dialog, request.signal)) return

        showRecovery(statusCopy('failure'), true)
      }
    }

    const observer = new MutationObserver(() => {
      if (dialog.open) {
        field.focus()

        void update()
      } else this.request?.abort()
    })

    observer.observe(dialog, { attributes: true, attributeFilter: ['open'] })

    signal.addEventListener('abort', () => {
      observer.disconnect()
    }, { once: true })

    this.addEventListener('search-provider-change', () => {
      void update()
    }, { signal })

    field.addEventListener('input', event => {
      if (event instanceof InputEvent && event.isComposing) return

      void update()
    }, { signal })

    field.addEventListener('compositionend', () => {
      void update()
    }, { signal })

    retry.addEventListener('click', () => {
      field.focus()

      void update()
    }, { signal })

    results.addEventListener('click', event => {
      if (!(event.target instanceof Element) || !event.target.closest('a[href]') ||
        event.button !== 0 || hasModifier(event)) return

      // Let native link activation and other listeners run before dismissing the search.
      window.setTimeout(() => {
        if (!event.defaultPrevented && !signal.aborted && dialog.open) dialog.close()
      }, 0)
    }, { signal })

    dialog.addEventListener('keydown', event => {
      // Search inputs can consume Escape to clear their value before the dialog sees a cancel.
      if (event.key === 'Escape' && event.target === field && !event.isComposing && !event.defaultPrevented) {
        event.preventDefault()

        dialog.close()

        return
      }

      handleResultsKey(event, field, results)
    }, { signal })

    document.addEventListener('keydown', event => {
      if (!isSearchShortcut(event) || !this.hasAttribute('data-search-shortcut') ||
        !this.provider) return

      if (!dialog.open && isEditable(event.composedPath()[0])) return

      if (document.querySelector('dialog[open]') && !dialog.open) return

      event.preventDefault()

      if (dialog.open) field.focus()
      else trigger.click()
    }, { signal })

    if (dialog.open) void update()
  }

  disconnectedCallback() {
    this.generation += 1

    this.connection?.abort()

    this.request?.abort()

    this.querySelector('dialog')?.close()
  }
}

if (!customElements.get('lumen-recipe-elements-site-search')) {
  customElements.define('lumen-recipe-elements-site-search', SiteSearchDialog)
}

/** Register a provider after the page's search recipe is mounted. */
export const setSiteSearchProvider = (id: string, provider: SiteSearchProvider): boolean => {
  const recipe = document.getElementById(id)

  if (!(recipe instanceof SiteSearchDialog)) return false

  recipe.provider = provider

  recipe.setAttribute('data-search-ready', '')

  recipe.querySelector<HTMLElement>('[data-search-trigger]')?.removeAttribute('hidden')

  return true
}
