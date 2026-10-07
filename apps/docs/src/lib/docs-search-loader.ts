import type { DocsSearchItem } from './docs-search'

const DOCS_SEARCH_ITEM_TYPES = ['Component', 'Event', 'Prop', 'Recipe'] as const
const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null

const isDocsSearchItemType = (value: unknown): value is DocsSearchItem['type'] => (
  typeof value === 'string' && (DOCS_SEARCH_ITEM_TYPES as readonly string[]).includes(value)
)

export const isDocsSearchItem = (value: unknown): value is DocsSearchItem => isRecord(value) &&
  typeof value.category === 'string' &&
  typeof value.description === 'string' &&
  typeof value.href === 'string' &&
  typeof value.keywords === 'string' &&
  typeof value.title === 'string' &&
  isDocsSearchItemType(value.type)

export const parseDocsSearchIndex = (payload: unknown): DocsSearchItem[] => {
  if (!Array.isArray(payload)) {
    throw new TypeError('Docs search index response did not match the expected DocsSearchItem shape.')
  }

  if (!payload.every(isDocsSearchItem)) {
    throw new TypeError('Docs search index response did not match the expected DocsSearchItem shape.')
  }

  return payload
}

export interface DocsSearchIndexLoader {
  load: () => Promise<DocsSearchItem[]>
}

export const createDocsSearchIndexLoader = (
  fetchIndex: () => Promise<Response>
): DocsSearchIndexLoader => {
  let pending: Promise<DocsSearchItem[]> | undefined

  const load = (): Promise<DocsSearchItem[]> => {
    pending ??= (async (): Promise<DocsSearchItem[]> => {
      const response = await fetchIndex()

      if (!response.ok) throw new Error(`Docs search index request failed with status ${response.status}.`)

      const payload: unknown = await response.json()

      return parseDocsSearchIndex(payload)
    })().catch((error: unknown) => {
      pending = undefined

      throw error
    })

    return pending
  }

  return { load }
}
