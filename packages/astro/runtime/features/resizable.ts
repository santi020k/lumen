import { getLumenDirectionalKey } from '@santi020k/lumen-core'

import { queryScope } from '../scope.js'

const parseNumberList = (value: string | undefined, count: number, fallback: number): number[] => {
  const values = (value ?? '')
    .split(',')
    .map(item => Number.parseFloat(item.trim()))
    .filter(Number.isFinite)

  return Array.from({ length: count }, (_, index) => values[index] ?? values[0] ?? fallback)
}

const normalizeSizes = (sizes: number[], count: number): number[] => {
  const fallbackSize = 100 / Math.max(1, count)

  const usableSizes = Array.from({ length: count }, (_, index) => {
    const size = sizes[index] ?? fallbackSize

    return Number.isFinite(size) && size > 0 ? size : fallbackSize
  })

  const total = usableSizes.reduce((sum, size) => sum + size, 0)

  if (total <= 0) return Array.from({ length: count }, () => fallbackSize)

  return usableSizes.map(size => (size / total) * 100)
}

const getResizeAxes = (root: HTMLElement) => {
  const direction = root.dataset.orientation === 'vertical' ? 'vertical' : 'horizontal'
  const separatorOrientation = direction === 'horizontal' ? 'vertical' : 'horizontal'
  const axis = direction === 'horizontal' ? 'clientX' : 'clientY'
  const sizeProperty = direction === 'horizontal' ? 'width' : 'height'

  return { direction, separatorOrientation, axis, sizeProperty } as const
}

const bindResizableGroups = (root: HTMLElement): void => {
  if (root.dataset.uiBound === 'true') return

  const panes = [...root.children].filter((child): child is HTMLElement => child instanceof HTMLElement &&
    !child.hasAttribute('data-ui-resizable-handle') &&
    !child.hasAttribute('data-ui-resizable-handle-template'))

  if (panes.length < 2) return

  root.dataset.uiBound = 'true'

  root.dataset.uiResizableEnhanced = 'true'

  const { direction, separatorOrientation, axis, sizeProperty } = getResizeAxes(root)
  const minSizes = parseNumberList(root.dataset.uiResizableMinSize, panes.length, 12)
  const maxSizes = parseNumberList(root.dataset.uiResizableMaxSize, panes.length, 88)

  const initialSizes = normalizeSizes(
    parseNumberList(root.dataset.uiResizableDefaultSizes, panes.length, 100 / panes.length), panes.length
  )

  const handleTemplate = root.querySelector<HTMLTemplateElement>(':scope > [data-ui-resizable-handle-template]')
  let sizes = [...initialSizes]

  const applySizes = (): void => {
    for (const [index, pane] of panes.entries()) {
      pane.dataset.uiResizablePanel = ''

      pane.style.setProperty('--ui-resizable-size', `${sizes[index] ?? 0}%`)
    }

    for (const handle of root.querySelectorAll<HTMLElement>('[data-ui-resizable-handle]')) {
      const index = Number.parseInt(handle.dataset.index ?? '0', 10)

      handle.setAttribute('aria-valuemin', String(Math.round(minSizes[index] ?? 0)))

      handle.setAttribute('aria-valuemax', String(Math.round(maxSizes[index] ?? 100)))

      handle.setAttribute('aria-valuenow', String(Math.round(sizes[index] ?? 0)))
    }
  }

  const resizePair = (index: number, nextSize: number): void => {
    const nextIndex = index + 1
    const current = sizes[index]
    const next = sizes[nextIndex]

    if (current === undefined || next === undefined) return

    const total = current + next
    const min = Math.max(minSizes[index] ?? 0, total - (maxSizes[nextIndex] ?? 100))
    const max = Math.min(maxSizes[index] ?? 100, total - (minSizes[nextIndex] ?? 0))
    const paneSize = Math.min(max, Math.max(min, nextSize))

    sizes[index] = paneSize

    sizes[nextIndex] = total - paneSize

    applySizes()
  }

  for (const [index, pane] of panes.entries()) {
    pane.dataset.uiResizablePanel = ''

    if (index >= panes.length - 1) continue

    const handleFromTemplate = handleTemplate?.content
      .querySelector<HTMLButtonElement>('[data-ui-resizable-handle]')
      ?.cloneNode(true)

    const handle = handleFromTemplate instanceof HTMLButtonElement ?
      handleFromTemplate :
      document.createElement('button')

    handle.type = 'button'

    handle.className = 'ui-resizable__handle'

    handle.dataset.uiResizableHandle = ''

    handle.dataset.index = String(index)

    handle.tabIndex = 0

    handle.setAttribute('aria-label', `Resize panel ${index + 1}`)

    handle.setAttribute('role', 'separator')

    handle.setAttribute('aria-orientation', separatorOrientation)

    pane.after(handle)

    let startPosition = 0
    let startSize = 0
    let containerSize = 1

    handle.addEventListener('pointerdown', event => {
      if (event.button !== 0) return

      event.preventDefault()

      startPosition = event[axis]

      startSize = sizes[index] ?? 0

      containerSize = Math.max(1, root.getBoundingClientRect()[sizeProperty])

      root.dataset.resizing = 'true'

      handle.dataset.active = 'true'

      handle.setPointerCapture(event.pointerId)
    })

    handle.addEventListener('pointermove', event => {
      if (handle.dataset.active !== 'true') return

      const delta = ((event[axis] - startPosition) / containerSize) * 100
      const multiplier = direction === 'horizontal' && getLumenDirectionalKey(handle, 'ArrowRight') === 'ArrowLeft' ? -1 : 1

      resizePair(index, startSize + delta * multiplier)
    })

    const finishResize = (event: PointerEvent): void => {
      if (handle.dataset.active !== 'true') return

      delete handle.dataset.active

      delete root.dataset.resizing

      if (handle.hasPointerCapture(event.pointerId)) handle.releasePointerCapture(event.pointerId)
    }

    handle.addEventListener('pointerup', finishResize)

    handle.addEventListener('pointercancel', finishResize)

    handle.addEventListener('lostpointercapture', finishResize)

    handle.addEventListener('dblclick', () => {
      if (root.dataset.uiResizableReset !== 'true') return

      sizes = [...initialSizes]

      applySizes()
    })

    handle.addEventListener('keydown', event => {
      const step = event.shiftKey ? 10 : 2

      const keyDeltas: Record<string, number> = direction === 'horizontal' ?
        { ArrowLeft: -step, ArrowRight: step } :
        { ArrowDown: step, ArrowUp: -step }

      if (event.key === 'Home') {
        event.preventDefault()

        resizePair(index, minSizes[index] ?? 0)

        return
      }

      if (event.key === 'End') {
        event.preventDefault()

        resizePair(index, maxSizes[index] ?? 100)

        return
      }

      const delta = keyDeltas[getLumenDirectionalKey(handle, event.key)]

      if (delta === undefined) return

      event.preventDefault()

      resizePair(index, (sizes[index] ?? 0) + delta)
    })
  }

  applySizes()
}

export const initResizableGroups = (scope: ParentNode): void => {
  for (const root of queryScope(scope, '[data-ui-resizable]')) bindResizableGroups(root)
}
