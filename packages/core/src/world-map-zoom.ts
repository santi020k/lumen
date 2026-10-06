import { fitHighlightedMap, initMapWheelZoom, type WorldMapZoomAnchor } from './world-map-navigation.js'
import { initLumenWorldMapPan } from './world-map-pan.js'

/** Shared DOM enhancement for the web map's native zoom controls and scrollable viewport. */
export interface LumenWorldMapZoomLabels {
  fit: string
  level: string
  reset: string
  viewport: string
  zoomIn: string
  zoomOut: string
}

export const lumenWorldMapZoomLabels: Readonly<LumenWorldMapZoomLabels> = Object.freeze({
  fit: 'Fit highlighted countries', level: 'Zoom level', reset: 'Reset zoom', viewport: 'Map viewport', zoomIn: 'Zoom in', zoomOut: 'Zoom out'
})

export const normalizeLumenWorldMapZoom = (value: number): number => Number.isFinite(value) ?
  Math.min(8, Math.max(1, value)) :
  1

const isZoomControlDisabled = (root: HTMLElement, action: string | undefined, zoom: number): boolean => {
  if (action === 'fit') return !root.querySelector('.ui-world-map__country--highlighted')

  return action === 'in' ? zoom === 8 : zoom === 1
}

export const initLumenWorldMapZoom = (root: HTMLElement, signal: AbortSignal): void => {
  const viewport = root.querySelector<HTMLElement>('[data-ui-world-map-viewport]')
  const controls = [...root.querySelectorAll<HTMLButtonElement>('[data-ui-world-map-zoom]')]
  const status = root.querySelector<HTMLOutputElement>('[data-ui-world-map-zoom-status]')

  if (!viewport) return

  viewport.style.setProperty('--ui-world-map-zoom', '1')

  viewport.dataset.panEnabled = 'false'

  viewport.scrollLeft = 0

  viewport.scrollTop = 0

  if (controls.length === 0) return

  initLumenWorldMapPan(viewport, signal)

  let zoom = 1

  const update = (
    value: number, anchor: WorldMapZoomAnchor = { x: viewport.clientWidth / 2, y: viewport.clientHeight / 2 }
  ): void => {
    const next = normalizeLumenWorldMapZoom(value)
    const ratio = next / zoom
    const x = (viewport.scrollLeft + anchor.x) * ratio - anchor.x
    const y = (viewport.scrollTop + anchor.y) * ratio - anchor.y

    zoom = next

    viewport.dataset.panEnabled = String(zoom > 1)

    viewport.style.setProperty('--ui-world-map-zoom', String(zoom))

    viewport.scrollLeft = Math.max(0, x)

    viewport.scrollTop = Math.max(0, y)

    if (status) status.value = `${Math.round(zoom * 100)}%`

    for (const button of controls) {
      const action = button.dataset.uiWorldMapZoom

      button.disabled = isZoomControlDisabled(root, action, zoom)

      button.classList.toggle('ui-button--disabled', button.disabled)
    }
  }

  for (const button of controls) {
    button.addEventListener('click', () => {
      const action = button.dataset.uiWorldMapZoom

      if (action === 'fit') {
        fitHighlightedMap(root, viewport, update)

        return
      }

      const next = action === 'reset' ? 1 : zoom + (action === 'in' ? 0.5 : -0.5)

      update(next)
    }, { signal })
  }

  update(1)

  initMapWheelZoom(viewport, () => zoom, update, signal)

  if (root.dataset.initialView === 'highlighted') fitHighlightedMap(root, viewport, update)
}
