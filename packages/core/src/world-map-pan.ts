interface MapDrag {
  id: number
  x: number
  y: number
  left: number
  top: number
  moved: boolean
}

/** Mouse and pen dragging complements native touch and keyboard scrolling. */
export const initLumenWorldMapPan = (viewport: HTMLElement, signal: AbortSignal): void => {
  let drag: MapDrag | undefined
  let suppressClick = false
  let clickTimer: ReturnType<typeof setTimeout> | undefined

  const end = (): void => {
    if (!drag) return

    suppressClick = drag.moved

    if (viewport.hasPointerCapture(drag.id)) viewport.releasePointerCapture(drag.id)

    drag = undefined

    viewport.removeAttribute('data-panning')

    clearTimeout(clickTimer)

    clickTimer = setTimeout(() => {
      suppressClick = false
    }, 0)
  }

  viewport.addEventListener('pointerdown', event => {
    if (event.button !== 0 || event.pointerType === 'touch' || viewport.dataset.panEnabled !== 'true') return

    drag = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      left: viewport.scrollLeft,
      top: viewport.scrollTop,
      moved: false
    }
  }, { signal })

  viewport.addEventListener('pointerleave', () => {
    if (!drag?.moved) drag = undefined
  }, { signal })

  viewport.addEventListener('pointermove', event => {
    if (drag?.id !== event.pointerId) return

    const x = event.clientX - drag.x
    const y = event.clientY - drag.y

    if (!drag.moved && Math.hypot(x, y) < 4) return

    drag.moved = true

    viewport.setPointerCapture(drag.id)

    viewport.dataset.panning = ''

    viewport.scrollLeft = drag.left - x

    viewport.scrollTop = drag.top - y

    event.preventDefault()
  }, { signal })

  viewport.addEventListener('pointerup', end, { signal })

  viewport.addEventListener('pointercancel', end, { signal })

  viewport.addEventListener('lostpointercapture', () => {
    drag = undefined

    viewport.removeAttribute('data-panning')
  }, { signal })

  viewport.addEventListener('click', event => {
    if (!suppressClick) return

    event.preventDefault()

    event.stopImmediatePropagation()

    suppressClick = false
  }, { capture: true, signal })

  signal.addEventListener('abort', () => {
    end()

    clearTimeout(clickTimer)
  }, { once: true })
}
