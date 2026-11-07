'use client'

import { type KeyboardEvent, type MouseEvent, useEffect, useRef, useState, useSyncExternalStore } from 'react'

import '@santi020k/lumen-react/styles/components/button.css'
import '@santi020k/lumen-react/styles/components/dialog.css'
import '@santi020k/lumen-react/styles/components/dialog-header.css'
import '@santi020k/lumen-react/styles/components/dialog-title.css'
import '@santi020k/lumen-react/styles/components/dialog-body.css'
import '@santi020k/lumen-react/styles/components/dialog-close.css'
import '@santi020k/lumen-react/styles/components/empty.css'
import '@santi020k/lumen-react/styles/components/label.css'
import '@santi020k/lumen-react/styles/components/link.css'
import '@santi020k/lumen-react/styles/components/search-field.css'
import './site-search-dialog.css'
import '@santi020k/lumen-react/styles/components/kbd.css'

import { Button } from '@santi020k/lumen-react/components/button'
import { Dialog, DialogBody, DialogClose, DialogHeader, DialogTitle } from '@santi020k/lumen-react/components/dialog'
import { Empty } from '@santi020k/lumen-react/components/empty'
import { Kbd } from '@santi020k/lumen-react/components/kbd'
import { Label } from '@santi020k/lumen-react/components/label'
import { Link } from '@santi020k/lumen-react/components/link'
import { SearchField } from '@santi020k/lumen-react/components/search-field'

export interface SiteSearchResult {
  href: string
  title: string
  description?: string
}
export type SiteSearchProvider = (
  query: string, signal: AbortSignal
) => readonly SiteSearchResult[] | Promise<readonly SiteSearchResult[]>

const defaultLabels = {
  close: 'Close',
  empty: 'No results found.',
  failure: 'Search could not be loaded.',
  field: 'Search query',
  loading: 'Searching…',
  open: 'Search',
  results: 'Results found: {count}',
  retry: 'Retry search',
  title: 'Search this site'
}

export interface SiteSearchDialogProps {
  id: string
  fallbackHref: string
  search: SiteSearchProvider
  shortcut?: boolean
  labels?: Partial<typeof defaultLabels>
}

interface SearchOutcome {
  query: string
  provider: SiteSearchProvider
  revision: number
  session: number
  matches: readonly SiteSearchResult[]
  failed: boolean
}

const subscribeHydration = () => () => undefined
const hydrated = () => true
const serverSnapshot = () => false

const hasModifier = (event: Pick<globalThis.KeyboardEvent, 'altKey' | 'ctrlKey' | 'metaKey' | 'shiftKey'>) => (
  event.altKey || event.ctrlKey || event.metaKey || event.shiftKey
)

const safeResult = (result: SiteSearchResult): boolean => {
  try {
    return ['http:', 'https:'].includes(new URL(result.href, document.baseURI).protocol)
  } catch {
    return false
  }
}

const uniqueResults = (matches: readonly SiteSearchResult[]): readonly SiteSearchResult[] => {
  const destinations = new Set<string>()

  return matches.filter(match => {
    if (!safeResult(match) || destinations.has(match.href)) return false

    destinations.add(match.href)

    return true
  })
}

const isShortcut = (event: globalThis.KeyboardEvent): boolean => (
  !event.defaultPrevented && !event.repeat && !event.isComposing && !event.altKey && !event.shiftKey &&
  (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k'
)

const isEditable = (target: EventTarget | undefined): boolean => (
  target instanceof Element &&
  Boolean(target.closest('input, textarea, select, [contenteditable]:not([contenteditable="false"])'))
)

const followResult = (event: MouseEvent<HTMLAnchorElement>, close: () => void): void => {
  if (event.button !== 0 || hasModifier(event)) return

  const link = event.currentTarget

  window.setTimeout(() => {
    if (!event.defaultPrevented && link.isConnected) close()
  }, 0)
}

const moveResultFocus = (links: HTMLAnchorElement[], index: number, forwards: boolean): void => {
  if (index < 0) {
    links[forwards ? 0 : links.length - 1]?.focus()

    return
  }

  const step = forwards ? 1 : -1

  links[(index + step + links.length) % links.length]?.focus()
}

const confirmFirst = (
  event: KeyboardEvent<HTMLDialogElement>, links: HTMLAnchorElement[], fromField: boolean
): void => {
  if (!fromField) return

  event.preventDefault()

  links[0]?.click()
}

const moveResult = (
  event: KeyboardEvent<HTMLDialogElement>, field: HTMLInputElement | null, results: HTMLOListElement | null
): void => {
  if (!results || hasModifier(event)) return

  const links = [...results.querySelectorAll<HTMLAnchorElement>('a[href]')]
  const fromField = event.target === field
  const index = links.findIndex(link => link === event.target)

  if (!links.length || (!fromField && index < 0)) return

  if (event.key === 'Enter') {
    confirmFirst(event, links, fromField)

    return
  }

  if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return

  event.preventDefault()

  moveResultFocus(links, index, event.key === 'ArrowDown')
}

const presentation = (
  active: boolean, outcome: SearchOutcome | undefined, labels: typeof defaultLabels
): { state: 'idle' | 'loading' | 'ready' | 'error', status: string, matches: readonly SiteSearchResult[] } => {
  if (!active) return { state: 'idle', status: '', matches: [] }

  if (!outcome) return { state: 'loading', status: labels.loading, matches: [] }

  if (outcome.failed) return { state: 'error', status: labels.failure, matches: [] }

  const status = outcome.matches.length ?
    labels.results.replaceAll('{count}', String(outcome.matches.length)) :
    labels.empty

  return { state: 'ready', status, matches: outcome.matches }
}

const matchingOutcome = (
  outcome: SearchOutcome | undefined, query: string, provider: SiteSearchProvider, revision: number, session: number
): SearchOutcome | undefined => {
  if (!outcome) return undefined

  if (outcome.query !== query || outcome.provider !== provider ||
    outcome.revision !== revision || outcome.session !== session) {
    return undefined
  }

  return outcome
}

export const SiteSearchDialog = ({ id, fallbackHref, search, shortcut = true, labels }: SiteSearchDialogProps) => {
  const copy = { ...defaultLabels, ...labels }
  const ready = useSyncExternalStore(subscribeHydration, hydrated, serverSnapshot)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [draft, setDraft] = useState('')
  const [revision, setRevision] = useState(0)
  const [session, setSession] = useState(0)
  const [outcome, setOutcome] = useState<SearchOutcome>()
  const fieldRef = useRef<HTMLInputElement>(null)
  const resultsRef = useRef<HTMLOListElement>(null)

  const changeOpen = (next: boolean) => {
    if (next) setSession(value => value + 1)

    setOpen(next)
  }

  useEffect(() => {
    if (!open || !query.trim()) return

    const request = new AbortController()

    const update = async () => {
      try {
        const found = await search(query.trim(), request.signal)

        if (!request.signal.aborted) {
          setOutcome({ query, provider: search, revision, session, matches: uniqueResults(found), failed: false })
        }
      } catch {
        if (!request.signal.aborted) {
          setOutcome({ query, provider: search, revision, session, matches: [], failed: true })
        }
      }
    }

    void update()

    return () => {
      request.abort()
    }
  }, [open, query, revision, search, session])

  useEffect(() => {
    if (!shortcut) return

    const handle = (event: globalThis.KeyboardEvent) => {
      if (!isShortcut(event)) return

      if (!open && isEditable(event.composedPath()[0])) return

      if (!open && document.querySelector('dialog[open]')) return

      event.preventDefault()

      if (open) fieldRef.current?.focus()
      else {
        setSession(value => value + 1)

        setOpen(true)
      }
    }

    document.addEventListener('keydown', handle)

    return () => {
      document.removeEventListener('keydown', handle)
    }
  }, [shortcut, open])

  const current = matchingOutcome(outcome, query, search, revision, session)
  const view = presentation(open && Boolean(query.trim()), current, copy)

  const navigate = (event: KeyboardEvent<HTMLDialogElement>) => {
    if (event.defaultPrevented || event.nativeEvent.isComposing) return

    if (event.key === 'Escape') {
      event.preventDefault()

      setOpen(false)
    } else moveResult(event, fieldRef.current, resultsRef.current)
  }

  return (
    <div className="site-search">
      {ready ?
        (
          <Button
            aria-controls={id + '-dialog'}
            aria-haspopup="dialog"
            onClick={event => {
              event.currentTarget.focus({ preventScroll: true })

              changeOpen(true)
            }}
          >
            {copy.open}
            {shortcut && <Kbd aria-hidden="true">Ctrl/⌘ K</Kbd>}
          </Button>
        ) :
        <Link href={fallbackHref}>{copy.open}</Link>}
      <Dialog
        id={id + '-dialog'}
        aria-labelledby={id + '-title'}
        open={open}
        onOpenChange={changeOpen}
        onKeyDown={navigate}
      >
        <DialogHeader>
          <DialogTitle id={id + '-title'}>{copy.title}</DialogTitle>
          <DialogClose>{copy.close}</DialogClose>
        </DialogHeader>
        <DialogBody>
          <Label htmlFor={id + '-query'}>{copy.field}</Label>
          <SearchField
            id={id + '-query'}
            ref={fieldRef}
            autoFocus
            autoComplete="off"
            value={draft}
            onChange={event => {
              setDraft(event.currentTarget.value)

              if (!(event.nativeEvent instanceof InputEvent) || !event.nativeEvent.isComposing) {
                setQuery(event.currentTarget.value)
              }
            }}
            onCompositionEnd={event => {
              setQuery(event.currentTarget.value)
            }}
          />
          <p role="status">{view.status}</p>
          {view.state === 'error' && (
            <Empty variant="compact">
              <Button onClick={() => {
                fieldRef.current?.focus()

                setRevision(value => value + 1)
              }}
              >
                {copy.retry}
              </Button>
            </Empty>
          )}
          <ol ref={resultsRef}>
            {view.matches.map(match => (
              <li key={match.href}>
                <Link
                  href={match.href}
                  onClick={event => {
                    followResult(event, () => {
                      setOpen(false)
                    })
                  }}
                >
                  <span>{match.title}</span>
                  {match.description && <span>{match.description}</span>}
                </Link>
              </li>
            ))}
          </ol>
        </DialogBody>
      </Dialog>
    </div>
  )
}
