export interface WorldMapZoomAnchor {
  x: number
  y: number
}

interface MapBounds extends WorldMapZoomAnchor {
  width: number
  height: number
}

export const getHighlightedMapBounds = (root: HTMLElement): MapBounds | undefined => {
  const paths = [...root.querySelectorAll<SVGPathElement>('.ui-world-map__country--highlighted')]
  let bounds: MapBounds | undefined

  for (const path of paths) {
    const box = path.getBBox()

    if (![box.x, box.y, box.width, box.height].every(Number.isFinite)) continue

    if (!bounds) {
      bounds = { x: box.x, y: box.y, width: box.width, height: box.height }

      continue
    }

    const right = Math.max(bounds.x + bounds.width, box.x + box.width)
    const bottom = Math.max(bounds.y + bounds.height, box.y + box.height)
    const x = Math.min(bounds.x, box.x)
    const y = Math.min(bounds.y, box.y)

    bounds = { x, y, width: right - x, height: bottom - y }
  }

  return bounds
}

export const fitHighlightedMap = (
  root: HTMLElement, viewport: HTMLElement, update: (zoom: number) => void
): void => {
  const bounds = getHighlightedMapBounds(root)

  if (!bounds) return

  const scaleToBounds = Math.min(1000 / Math.max(1, bounds.width), 400 / Math.max(1, bounds.height))
  const zoom = Math.min(8, Math.max(1, scaleToBounds * 0.85))

  update(zoom)

  const scale = viewport.clientWidth * zoom / 1000

  viewport.scrollLeft = Math.max(0, (bounds.x + bounds.width / 2) * scale - viewport.clientWidth / 2)

  viewport.scrollTop = Math.max(0, (bounds.y + bounds.height / 2) * scale - viewport.clientHeight / 2)
}

export const initMapWheelZoom = (
  viewport: HTMLElement, getZoom: () => number,
  update: (value: number, anchor: WorldMapZoomAnchor) => void, signal: AbortSignal
): void => {
  viewport.addEventListener('wheel', event => {
    if (!event.ctrlKey && !event.metaKey) return

    event.preventDefault()

    const rect = viewport.getBoundingClientRect()
    const unit = [1, 16, viewport.clientHeight][event.deltaMode] ?? 1
    const delta = Math.max(-1000, Math.min(1000, event.deltaY * unit))

    update(getZoom() * Math.exp(-delta * 0.002), { x: event.clientX - rect.left, y: event.clientY - rect.top })
  }, { passive: false, signal })
}
