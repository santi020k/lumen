import { createCatalogSvg, filterIconEntries, type IconEntry, iconPageSize, parseIconEntries } from './icon-catalog'

const renderIconCells = (template: HTMLTemplateElement, entries: IconEntry[]): DocumentFragment => {
  const fragment = document.createDocumentFragment()

  for (const entry of entries) {
    const cell = template.content.querySelector('button')?.cloneNode(true)

    if (!(cell instanceof HTMLButtonElement)) throw new Error('Missing icon button template.')

    cell.dataset.iconName = entry.name

    cell.title = `Copy "${entry.name}"`

    cell.querySelector('[data-icon-art]')?.replaceChildren(createCatalogSvg(entry.svg))

    cell.querySelector('[data-icon-label]')?.replaceChildren(entry.name)

    fragment.append(cell)
  }

  return fragment
}

const focusNextIcon = (grid: HTMLElement, index: number): void => {
  const next = grid.children.item(index)

  if (next instanceof HTMLButtonElement) next.focus({ preventScroll: true })
}

export const setupIconCatalogs = (): void => {
  for (const catalog of document.querySelectorAll<HTMLElement>('[data-icon-catalog]')) {
    if (catalog.dataset.iconCatalogReady === 'true') continue

    const grid = catalog.querySelector<HTMLElement>('[data-icon-grid]')
    const search = catalog.querySelector<HTMLInputElement>('[data-icon-search]')
    const status = catalog.querySelector<HTMLElement>('[data-icon-status]')
    const empty = catalog.querySelector<HTMLElement>('[data-icon-empty]')
    const more = catalog.querySelector<HTMLButtonElement>('[data-icon-more]')
    const template = catalog.querySelector<HTMLTemplateElement>('[data-icon-template]')
    const source = catalog.dataset.iconSource

    if (!grid || !search || !status || !empty || !more || !template || !source) continue

    catalog.dataset.iconCatalogReady = 'true'

    search.disabled = false

    more.hidden = false

    let pending: Promise<IconEntry[]> | undefined
    let visible = iconPageSize
    let revision = 0

    const load = (): Promise<IconEntry[]> => {
      pending ??= fetch(source).then(async response => {
        if (!response.ok) throw new Error(`Icon catalog request failed: ${response.status}`)

        const payload: unknown = await response.json()

        return parseIconEntries(payload)
      }).catch((error: unknown) => {
        pending = undefined

        throw error
      })

      return pending
    }

    const update = async (append: boolean): Promise<void> => {
      const current = ++revision

      visible = append ? visible + iconPageSize : iconPageSize

      status.textContent = 'Loading icons…'

      more.disabled = true

      const isCurrent = () => current === revision && catalog.isConnected

      try {
        const entries = await load()

        if (!isCurrent()) return

        const matches = filterIconEntries(entries, search.value)
        const fragment = renderIconCells(template, matches.slice(0, visible))
        const hadMoreFocus = document.activeElement === more
        const firstNewIndex = grid.childElementCount

        grid.replaceChildren(fragment)

        status.textContent = `Showing ${Math.min(visible, matches.length)} of ${matches.length} icons${search.value.trim() ? ` matching “${search.value.trim()}”` : ''}`

        empty.hidden = matches.length !== 0

        more.hidden = visible >= matches.length

        if (append && hadMoreFocus) focusNextIcon(grid, firstNewIndex)
      } catch {
        if (!isCurrent()) return

        status.textContent = 'Could not load icons. Try again, or browse all icon names below.'

        more.hidden = false

        more.textContent = 'Retry loading icons'
      } finally {
        if (current === revision) more.disabled = false
      }
    }

    search.addEventListener('input', () => {
      more.textContent = 'Show more icons'

      void update(false)
    })

    more.addEventListener('click', () => {
      const retry = more.textContent === 'Retry loading icons'

      more.textContent = 'Show more icons'

      void update(!retry)
    })

    const copyIcon = async (event: Event): Promise<void> => {
      const cell = event.target instanceof Element ? event.target.closest<HTMLButtonElement>('[data-icon-name]') : null
      const label = cell?.querySelector('[data-icon-label]')
      const name = cell?.dataset.iconName

      if (!cell || !label || !name) return

      try {
        await navigator.clipboard.writeText(name)

        label.textContent = 'Copied!'

        status.textContent = `Copied ${name}.`

        window.setTimeout(() => {
          label.textContent = name
        }, 1000)
      } catch {
        status.textContent = `Could not copy. Icon name: ${name}`
      }
    }

    grid.addEventListener('click', event => {
      void copyIcon(event)
    })
  }
}
