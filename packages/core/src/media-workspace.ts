/** Media content, loading and persistence remain owned by each framework's consumer. */
export interface LumenMediaIdentity {
  disabled?: boolean
  id: string
}

const assertMediaIdentities = (items: readonly LumenMediaIdentity[]): void => {
  const ids = new Set<string>()

  for (const item of items) {
    if (!item.id.trim() || ids.has(item.id)) throw new Error('Media items require nonempty, unique IDs')

    ids.add(item.id)
  }
}

/** Returns a new collection; stale requests and out-of-range destinations leave its order intact. */
export const moveLumenMediaItem = <Item extends LumenMediaIdentity>(
  items: readonly Item[], id: string, targetIndex: number
): Item[] => {
  assertMediaIdentities(items)

  const next = [...items]
  const from = items.findIndex(item => item.id === id)
  const item = items[from]
  const validTarget = Number.isInteger(targetIndex) && targetIndex >= 0 && targetIndex < items.length

  if (!item || item.disabled || !validTarget) return next

  next.splice(from, 1)

  next.splice(targetIndex, 0, item)

  return next
}

/** Prunes missing IDs and duplicates, preserving the displayed media order. */
export const resolveLumenMediaSelection = (
  items: readonly LumenMediaIdentity[], selectedIds: readonly string[]
): string[] => {
  assertMediaIdentities(items)

  const selected = new Set(selectedIds)

  return items.filter(item => selected.has(item.id)).map(item => item.id)
}

export const toggleLumenMediaSelection = (
  items: readonly LumenMediaIdentity[], selectedIds: readonly string[], id: string
): string[] => {
  const selected = new Set(resolveLumenMediaSelection(items, selectedIds))
  const item = items.find(candidate => candidate.id === id)

  if (!item || item.disabled) return [...selected]

  if (selected.has(id)) selected.delete(id)
  else selected.add(id)

  return resolveLumenMediaSelection(items, [...selected])
}

/** Zoom relative to fit; x/y are fractions of the available pan extent, from -1 to 1. */
export interface LumenMediaViewportValue {
  x: number
  y: number
  zoom: number
}

export type LumenMediaViewportAction = 'zoom-in' | 'zoom-out' | 'left' | 'right' | 'up' | 'down' | 'fit'

export const resolveLumenMediaMaxZoom = (maxZoom = 4): number => (
  Number.isFinite(maxZoom) ? Math.min(16, Math.max(1, maxZoom)) : 4
)

const panFraction = (value = 0): number => Number.isFinite(value) ? Math.max(-1, Math.min(1, value)) : 0
const viewportNumber = (value: unknown, fallback = 0): number => typeof value === 'number' && Number.isFinite(value) ? value : fallback
const isViewportRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value)

export const normalizeLumenMediaViewport = (
  value: unknown = {}, maxZoom = 4
): LumenMediaViewportValue => {
  if (!isViewportRecord(value)) return { x: 0, y: 0, zoom: 1 }

  const limit = resolveLumenMediaMaxZoom(maxZoom)
  const zoom = Math.min(limit, Math.max(1, viewportNumber(value.zoom, 1)))
  const x = panFraction(viewportNumber(value.x))
  const y = panFraction(viewportNumber(value.y))

  return { x: zoom === 1 ? 0 : x, y: zoom === 1 ? 0 : y, zoom }
}

export const applyLumenMediaViewportAction = (
  value: LumenMediaViewportValue, action: LumenMediaViewportAction, maxZoom = 4
): LumenMediaViewportValue => {
  const current = normalizeLumenMediaViewport(value, maxZoom)

  if (action === 'fit') return { x: 0, y: 0, zoom: 1 }

  switch (action) {
    case 'zoom-in': return normalizeLumenMediaViewport({ ...current, zoom: current.zoom + 0.25 }, maxZoom)

    case 'zoom-out': return normalizeLumenMediaViewport({ ...current, zoom: current.zoom - 0.25 }, maxZoom)

    case 'left': return normalizeLumenMediaViewport({ ...current, x: current.x - 0.25 }, maxZoom)

    case 'right': return normalizeLumenMediaViewport({ ...current, x: current.x + 0.25 }, maxZoom)

    case 'up': return normalizeLumenMediaViewport({ ...current, y: current.y - 0.25 }, maxZoom)

    case 'down': return normalizeLumenMediaViewport({ ...current, y: current.y + 0.25 }, maxZoom)
  }
}

/** Maps pointer movement to bounded pan coordinates without allowing media outside its viewport. */
export const panLumenMediaViewport = (
  value: LumenMediaViewportValue, deltaX: number, deltaY: number,
  width: number, height: number, maxZoom = 4
): LumenMediaViewportValue => {
  const current = normalizeLumenMediaViewport(value, maxZoom)
  const extent = (current.zoom - 1) / 2

  if (extent === 0 || !Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) return current

  return normalizeLumenMediaViewport({
    ...current,
    x: current.x + (Number.isFinite(deltaX) ? deltaX / width / extent : 0),
    y: current.y + (Number.isFinite(deltaY) ? deltaY / height / extent : 0)
  }, maxZoom)
}

export type LumenMediaThumbnailState = 'ready' | 'loading' | 'error'

export const resolveLumenMediaThumbnailState = (state: unknown): LumenMediaThumbnailState => (
  state === 'loading' || state === 'error' ? state : 'ready'
)

export const resolveLumenMediaOrder = (order?: number): number | undefined => (
  order !== undefined && Number.isSafeInteger(order) && order > 0 ? order : undefined
)

export const formatLumenMediaThumbnailState = (state: LumenMediaThumbnailState, label?: string): string => {
  if (label !== undefined) return label

  return state === 'loading' ? 'Loading' : 'Unavailable'
}
