import { isComponentBoundary, isLayoutLayer } from './contracts.js'
import type { DesignNode } from './model.js'

// Observed component owners in the Lumen library. The progress specimen in
// Templates uses a separate caption and drawn track instead of this component.
const controlKeys = {
  Label: 'cf1f941d67edc5ac6bf9157e0a5217927d6671a0',
  Checkbox: '962cdd43e4e24be04ed68f9964c9db3b5f98f6cd',
  Progress: '9a260692bf62accfb6cd13d5caf0189efc8b0260'
} as const

export type NativeControl = keyof typeof controlKeys

export const matchesControl = (node: DesignNode | undefined, name: NativeControl) => {
  const key = controlKeys[name]

  return node?.component?.key === key || node?.component?.setKey === key
}

const plainLayout = (node: DesignNode) => isLayoutLayer(node) && !isComponentBoundary(node)

export const labelText = (node: DesignNode | undefined): string | null => {
  if (!node) return null

  if (node.type === 'TEXT') return node.text?.trim() ? node.text : null

  if (plainLayout(node) && node.children.length === 1) return labelText(node.children[0])

  return null
}

export const percentValue = (raw: unknown): number | null => {
  if (typeof raw !== 'string' || raw.length > 8 || !/^\d{1,3}(?:\.\d{1,3})?$/u.test(raw)) return null

  const value = Number(raw)

  return value <= 100 ? value : null
}

const isDrawnTrack = (track: DesignNode | undefined) => {
  if (!track || !plainLayout(track) || track.children.length !== 1) return false

  const fill = track.children[0]

  return fill && plainLayout(fill) && fill.name.toLowerCase() === 'progress bar' && fill.children.length === 0
}

const progressCaption = (caption: DesignNode | undefined) => {
  if (!caption || !plainLayout(caption) || caption.children.length !== 2) return null

  const [title, amount] = caption.children
  const label = labelText(title)
  const percent = labelText(amount)?.trim()

  if (!label || !percent?.endsWith('%')) return null

  const value = percentValue(percent.slice(0, -1))

  return value === null ? null : { label, value }
}

export const drawnProgress = (node: DesignNode) => {
  const [caption, track] = node.children

  if (node.children.length !== 2 || !track || !isDrawnTrack(track)) return null

  const progress = progressCaption(caption)

  return progress ? { track, ...progress } : null
}
