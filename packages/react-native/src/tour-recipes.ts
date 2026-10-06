export interface LumenTourStep { id: string, targetId: string, title: string, content: string, disabled?: boolean }
export interface LumenTourRect { x: number, y: number, width: number, height: number }
export interface LumenTourLayout { highlight: LumenTourRect | null, panel: LumenTourRect }

const isTourStep = (input: unknown): input is LumenTourStep => {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) return false

  const strings = ['id', 'targetId', 'title', 'content'] as const

  return strings.every(key => key in input && typeof Reflect.get(input, key) === 'string') &&
    (!('disabled' in input) || input.disabled === undefined || typeof input.disabled === 'boolean')
}

export const isLumenTourStepsValid = (steps: readonly LumenTourStep[]): boolean => {
  if (!Array.isArray(steps)) return false

  const ids = new Set<string>()
  const inputs: readonly unknown[] = steps

  for (const input of inputs) {
    if (!isTourStep(input) || !input.id.trim() || !input.targetId.trim() || ids.has(input.id)) return false

    ids.add(input.id)
  }

  return true
}
export const resolveLumenTourStep = (steps: readonly LumenTourStep[], index: number): LumenTourStep | null => {
  if (!isLumenTourStepsValid(steps) || !Number.isInteger(index)) return null

  return steps[index] ?? null
}
export const moveLumenTourStep = (steps: readonly LumenTourStep[], index: number, direction: 'next' | 'previous'): number | null => {
  const current = resolveLumenTourStep(steps, index)

  if (!current || current.disabled) return null

  const delta = direction === 'next' ? 1 : -1

  for (let target = index + delta; target >= 0 && target < steps.length; target += delta) {
    if (steps[target]?.disabled === false || steps[target]?.disabled === undefined) return target
  }

  return null
}

const validRect = (rect: LumenTourRect): boolean => {
  const finite = [rect.x, rect.y, rect.width, rect.height].every(Number.isFinite)

  return finite && rect.width > 0 && rect.height > 0
}

const clipTourAnchor = (anchor: LumenTourRect | null, width: number, height: number): LumenTourRect | null => {
  if (!anchor || !validRect(anchor)) return null

  const x = Math.max(0, anchor.x)
  const y = Math.max(0, anchor.y)
  const right = Math.min(width, anchor.x + anchor.width)
  const bottom = Math.min(height, anchor.y + anchor.height)

  if (right <= x || bottom <= y) return null

  return { x, y, width: right - x, height: bottom - y }
}

export const resolveLumenTourLayout = (
  anchor: LumenTourRect | null, viewport: LumenTourRect
): LumenTourLayout | null => {
  if (!validRect(viewport) || viewport.width < 48 || viewport.height < 48) return null

  const width = viewport.width
  const height = viewport.height
  const margin = 12
  const panelWidth = Math.min(320, width - margin * 2)
  const panelHeight = Math.min(240, height - margin * 2)
  const highlight = clipTourAnchor(anchor, width, height)

  if (highlight) {
    const below = height - margin - highlight.y - highlight.height - 8
    const above = highlight.y - margin - 8
    const available = Math.max(below, above)

    if (available >= 88) {
      const h = Math.min(panelHeight, available)
      const y = below >= h ? highlight.y + highlight.height + 8 : highlight.y - 8 - h

      return { highlight,
        panel: {
          x: Math.min(Math.max(margin, highlight.x), width - margin - panelWidth), y, width: panelWidth, height: h
        } }
    }
  }

  return { highlight: null,
    panel: {
      x: (width - panelWidth) / 2, y: (height - panelHeight) / 2, width: panelWidth, height: panelHeight
    } }
}
