import type { LumenChartDatum, LumenHeatmapDatum, LumenRangeDatum } from './charts.js'

/** Data identities and values, never pixel coordinates or application navigation. */
export type LumenChartDatumActivationDetail =
  | { datumId?: string, kind: 'series', seriesId: string, x: number | string, y: number } |
  { datumId?: string, kind: 'heatmap', value: number, x: number | string, y: number | string } |
  { datumId?: string, high: number, kind: 'range', low: number, x: number | string }

const isAxisValue = (value: unknown): value is number | string => typeof value === 'string' || (typeof value === 'number' && Number.isFinite(value))
const isFiniteNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value)
const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value)

const parseSeries = (value: Record<string, unknown>): LumenChartDatumActivationDetail | null => {
  if (typeof value.seriesId !== 'string' || !isAxisValue(value.x) || !isFiniteNumber(value.y)) return null

  return { kind: 'series', seriesId: value.seriesId, x: value.x, y: value.y }
}

const parseHeatmap = (value: Record<string, unknown>): LumenChartDatumActivationDetail | null => {
  if (!isAxisValue(value.x) || !isAxisValue(value.y) || !isFiniteNumber(value.value)) return null

  return { kind: 'heatmap', value: value.value, x: value.x, y: value.y }
}

const parseRange = (value: Record<string, unknown>): LumenChartDatumActivationDetail | null => {
  if (!isAxisValue(value.x) || !isFiniteNumber(value.low) || !isFiniteNumber(value.high) ||
    value.low > value.high) return null

  return { high: value.high, kind: 'range', low: value.low, x: value.x }
}

const parseDatum = (value: Record<string, unknown>): LumenChartDatumActivationDetail | null => {
  switch (value.kind) {
    case 'series': return parseSeries(value)

    case 'heatmap': return parseHeatmap(value)

    case 'range': return parseRange(value)

    default: return null
  }
}

/** Validate untrusted event data and copy only the documented fields. */
export const parseLumenChartDatumActivation = (value: unknown): LumenChartDatumActivationDetail | null => {
  if (!isRecord(value)) return null

  if ('datumId' in value && typeof value.datumId !== 'string') return null

  const detail = parseDatum(value)

  if (!detail) return null

  return typeof value.datumId === 'string' ? { ...detail, datumId: value.datumId } : detail
}

export const createLumenChartDatumActivation = (
  seriesId: string,
  datum: LumenChartDatum
): LumenChartDatumActivationDetail | null => parseLumenChartDatumActivation({
  ...(datum.id === undefined ? {} : { datumId: datum.id }),
  kind: 'series',
  seriesId,
  x: datum.x,
  y: datum.y
})

export const createLumenHeatmapDatumActivation = (
  datum: LumenHeatmapDatum
): LumenChartDatumActivationDetail | null => parseLumenChartDatumActivation({
  ...(datum.id === undefined ? {} : { datumId: datum.id }),
  kind: 'heatmap',
  value: datum.value,
  x: datum.x,
  y: datum.y
})

export const createLumenRangeDatumActivation = (
  datum: LumenRangeDatum
): LumenChartDatumActivationDetail | null => parseLumenChartDatumActivation({
  ...(datum.id === undefined ? {} : { datumId: datum.id }),
  high: datum.high,
  kind: 'range',
  low: datum.low,
  x: datum.x
})

export interface LumenChartActivationController {
  destroy: () => void
}

const ownedActivationTarget = (root: HTMLElement, target: EventTarget | null): Element | null => {
  const ElementConstructor = root.ownerDocument.defaultView?.Element

  if (!ElementConstructor || !(target instanceof ElementConstructor)) return null

  const element = target.closest('[data-ui-chart-datum]')

  if (element?.closest('[data-ui-chart-activation]') !== root) return null

  if (element.closest('[inert], [hidden], [disabled], [aria-disabled="true"]')) return null

  return element
}

const parseSerializedDatum = (serialized: string): LumenChartDatumActivationDetail | null => {
  try {
    const value: unknown = JSON.parse(serialized)

    return parseLumenChartDatumActivation(value)
  } catch {
    return null
  }
}

/** Native buttons provide the keyboard path; decorative SVG marks use the same click path. */
export const createLumenChartActivationController = (root: HTMLElement): LumenChartActivationController => {
  const activate = (event: MouseEvent): void => {
    if (event.defaultPrevented || event.button !== 0 || !root.isConnected) return

    const target = ownedActivationTarget(root, event.target)
    const serialized = target?.getAttribute('data-ui-chart-datum')

    if (!serialized) return

    const detail = parseSerializedDatum(serialized)

    if (detail) root.dispatchEvent(new CustomEvent<LumenChartDatumActivationDetail>(
      'ui:chart-datum-activate', { bubbles: true, composed: true, detail }
    ))
  }

  root.addEventListener('click', activate)

  return { destroy: () => {
    root.removeEventListener('click', activate)
  } }
}
