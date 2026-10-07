export interface LumenChartCursorChangeDetail {
  x: number | string | null
}

export type LumenChartCursorChangeEvent = CustomEvent<LumenChartCursorChangeDetail>

export interface LumenChartInteractionController {
  destroy: () => void
  select: (x: number | string | null) => void
  setControlledCursor: (x: number | string | null | undefined) => void
}

interface ChartPeer {
  group: string
  select: (x: number | string | null) => void
}

const chartPeers = new WeakMap<Document, Set<ChartPeer>>()

const parseCoordinate = (value: string | undefined): number | string | null => {
  try {
    const parsed: unknown = JSON.parse(value ?? 'null')

    return typeof parsed === 'string' || (typeof parsed === 'number' && Number.isFinite(parsed)) ? parsed : null
  } catch {
    return null
  }
}

const chartPoints = (root: HTMLElement, svg: SVGSVGElement | null | undefined) => {
  const viewport = svg?.querySelector('svg[overflow="hidden"]')
  const minX = Number(viewport?.getAttribute('x') ?? -Infinity)
  const maxX = minX + Number(viewport?.getAttribute('width') ?? Infinity)

  return [...root.querySelectorAll<HTMLElement>('[data-ui-chart-point]')].map(element => ({
    element, position: Number(element.dataset.uiChartPosition), x: parseCoordinate(element.dataset.uiChartPoint)
  })).filter(point => point.x !== null && Number.isFinite(point.position) &&
    (!viewport || (point.position >= minX && point.position <= maxX)))
}

const revealCoordinate = (plot: HTMLElement | null, svg: SVGSVGElement | null | undefined, position: number): void => {
  if (!plot || !svg?.viewBox) return

  const width = svg.viewBox.baseVal.width

  if (width <= 0) return

  const x = position / width * svg.getBoundingClientRect().width

  plot.scrollLeft = Math.max(0, Math.min(plot.scrollWidth - plot.clientWidth, x - plot.clientWidth / 2))
}

const positionInspection = (
  panel: HTMLElement | null, svg: SVGSVGElement | null | undefined, position: number
): void => {
  if (!panel || !svg?.viewBox || svg.viewBox.baseVal.width <= 0) return

  const frame = panel.offsetParent?.getBoundingClientRect()

  if (!frame) return

  const bounds = svg.getBoundingClientRect()
  const x = bounds.left - frame.left + position / svg.viewBox.baseVal.width * bounds.width
  const width = panel.getBoundingClientRect().width
  const left = x + width + 24 > frame.width ? x - width - 16 : x + 16

  panel.style.setProperty('--ui-chart-inspection-x', `${Math.max(12, Math.min(frame.width - width - 12, left))}px`)

  panel.style.setProperty('--ui-chart-inspection-y', `${bounds.top - frame.top + 12}px`)
}

const observeChartLayout = (root: HTMLElement, plot: HTMLElement | null, reposition: () => void): (() => void) => {
  const Resize = root.ownerDocument.defaultView?.ResizeObserver
  const observer = Resize && plot ? new Resize(reposition) : undefined

  if (plot) observer?.observe(plot)

  plot?.addEventListener('scroll', reposition)

  return () => {
    plot?.removeEventListener('scroll', reposition)

    observer?.disconnect()
  }
}

/** Optional DOM enhancement shared by web adapters; no global listeners or application data transport. */
export const createLumenChartInteractionController = (root: HTMLElement): LumenChartInteractionController => {
  const plot = root.querySelector<HTMLElement>('[data-ui-chart-interaction-plot]')
  const svg = plot?.querySelector('svg')
  const crosshair = root.querySelector<SVGLineElement>('[data-ui-chart-crosshair]')
  const panel = root.querySelector<HTMLElement>('[data-ui-chart-inspection]')
  const announcement = root.querySelector<HTMLElement>('[data-ui-chart-announcement]')
  const points = chartPoints(root, svg)
  const legend = [...root.querySelectorAll<HTMLButtonElement>('[data-ui-chart-toggle]')]
  const hiddenSeries = new Set<string>()
  const cleanups: (() => void)[] = []
  let controlledCursor: number | string | null | undefined
  let pendingAnnouncement: number | string | null | undefined
  let selected: number | string | null = null
  let pinned = false
  let dismissed = false
  let hovering = false

  const select = (x: number | string | null, reveal = false): void => {
    selected = x

    const point = points.find(item => item.x === x)

    for (const item of points) item.element.hidden = item !== point

    if (panel) panel.hidden = !point

    if (point && reveal) revealCoordinate(plot, svg, point.position)

    if (point) positionInspection(panel, svg, point.position)

    if (crosshair) {
      crosshair.style.display = point ? '' : 'none'

      if (point) {
        crosshair.setAttribute('x1', String(point.position))

        crosshair.setAttribute('x2', String(point.position))
      }
    }
  }

  const peers = chartPeers.get(root.ownerDocument) ?? new Set<ChartPeer>()

  chartPeers.set(root.ownerDocument, peers)

  const peer: ChartPeer = { group: root.dataset.uiChartSync ?? '',
    select: x => {
      if (controlledCursor !== undefined) return

      hovering = false

      pinned = false

      dismissed = false

      select(x, true)
    } }

  peers.add(peer)

  const announceSelection = (x: number | string | null): void => {
    if (!announcement) return

    const point = points.find(item => item.x === x)

    announcement.textContent = point ?
      [...point.element.children]
        .filter(child => !child.hasAttribute('hidden')).map(child => child.textContent).join('. ') :
      ''
  }

  const synchronize = (x: number | string | null): void => {
    for (const other of peers) {
      if (other !== peer && peer.group && other.group === peer.group) other.select(x)
    }
  }

  const emit = (x: number | string | null, announce = false): void => {
    if (controlledCursor === undefined) {
      select(x, announce)

      if (announce) announceSelection(x)

      synchronize(x)
    } else pendingAnnouncement = announce ? x : undefined

    const EventClass = root.ownerDocument.defaultView?.CustomEvent

    if (EventClass) root.dispatchEvent(new EventClass<LumenChartCursorChangeDetail>('ui:chart-cursor-change', {
      bubbles: true, detail: { x }
    }))
  }

  const closest = (event: PointerEvent): number | string | null => {
    if (!svg) return null

    const matrix = svg.getScreenCTM()

    if (!matrix) return null

    const point = svg.createSVGPoint()

    point.x = event.clientX

    point.y = event.clientY

    const position = point.matrixTransform(matrix.inverse()).x
    let distance = Infinity
    let result: number | string | null = null

    for (const candidate of points) {
      const difference = Math.abs(candidate.position - position)

      if (difference < distance) {
        result = candidate.x

        distance = difference
      }
    }

    return result
  }

  const nextIndex = (key: string): number => {
    if (key === 'Home') return 0

    if (key === 'End') return points.length - 1

    const index = points.findIndex(point => point.x === selected)

    if (index < 0) return 0

    return Math.max(0, Math.min(points.length - 1, index + (key === 'ArrowRight' ? 1 : -1)))
  }

  const keydown = (event: KeyboardEvent): void => {
    if (event.defaultPrevented || event.isComposing || event.target !== plot || points.length === 0) return

    if (event.key === 'Escape') {
      event.preventDefault()

      pinned = false

      dismissed = true

      emit(null, true)

      return
    }

    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return

    event.preventDefault()

    pinned = true

    dismissed = false

    hovering = false

    const next = nextIndex(event.key)

    emit(points[next]?.x ?? null, true)
  }

  const move = (event: PointerEvent): void => {
    if (event.pointerType === 'touch' || pinned || dismissed) return

    const x = closest(event)

    hovering = true

    if (x !== selected) emit(x)
  }

  const down = (event: PointerEvent): void => {
    if (event.button !== 0) return

    pinned = true

    dismissed = false

    hovering = false

    plot?.focus({ preventScroll: true })

    emit(closest(event), true)
  }

  const leave = (): void => {
    dismissed = false

    if (hovering && !pinned) emit(null)

    hovering = false
  }

  plot?.addEventListener('keydown', keydown)

  plot?.addEventListener('pointermove', move)

  plot?.addEventListener('pointerdown', down)

  root.addEventListener('pointerleave', leave)

  const reposition = (): void => {
    if (selected !== null) select(selected)
  }

  cleanups.push(observeChartLayout(root, plot, reposition))

  cleanups.push(() => {
    plot?.removeEventListener('keydown', keydown)

    plot?.removeEventListener('pointermove', move)

    plot?.removeEventListener('pointerdown', down)

    root.removeEventListener('pointerleave', leave)
  })

  for (const button of legend) {
    button.hidden = false

    button.disabled = false

    button.classList.remove('ui-button--disabled')

    const toggle = (): void => {
      const id = button.dataset.uiChartToggle ?? ''

      if (hiddenSeries.has(id)) hiddenSeries.delete(id)
      else hiddenSeries.add(id)

      button.setAttribute('aria-pressed', String(!hiddenSeries.has(id)))

      for (const mark of root.querySelectorAll<SVGElement>('[data-ui-chart-series]')) {
        mark.style.display = hiddenSeries.has(mark.dataset.uiChartSeries ?? '') ? 'none' : ''
      }

      for (const value of root.querySelectorAll<HTMLElement>('[data-ui-chart-series-value]')) {
        value.hidden = hiddenSeries.has(value.dataset.uiChartSeriesValue ?? '')
      }
    }

    button.addEventListener('click', toggle)

    cleanups.push(() => {
      button.removeEventListener('click', toggle)

      button.disabled = true

      button.classList.add('ui-button--disabled')
    })
  }

  root.dataset.uiChartEnhanced = 'true'

  return {
    destroy: () => {
      cleanups.forEach(cleanup => {
        cleanup()
      })

      peers.delete(peer)

      select(null)

      for (const mark of root.querySelectorAll<SVGElement>('[data-ui-chart-series]')) mark.style.display = ''

      for (const value of root.querySelectorAll<HTMLElement>('[data-ui-chart-series-value]')) value.hidden = false

      for (const button of legend) button.setAttribute('aria-pressed', 'true')

      delete root.dataset.uiChartEnhanced
    },
    select,
    setControlledCursor: value => {
      controlledCursor = value

      if (value === undefined) return

      const changed = value !== selected

      select(value, true)

      if (pendingAnnouncement === value) announceSelection(value)

      pendingAnnouncement = undefined

      if (changed) synchronize(value)
    }
  }
}
