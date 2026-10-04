import { type LumenChartDatumActivationDetail, type LumenChartLabels, parseLumenChartDatumActivation } from '@santi020k/lumen-core'

export interface ReactChartDatumAction {
  key: string
  label: string
  serialized: string
}

const datumActionKey = (detail: LumenChartDatumActivationDetail): string => {
  if (detail.kind === 'series') return JSON.stringify([detail.kind, detail.seriesId, detail.x, detail.datumId])

  if (detail.kind === 'heatmap') return JSON.stringify([detail.kind, detail.x, detail.y, detail.datumId])

  return JSON.stringify([detail.kind, detail.x, detail.datumId])
}

export const createReactChartDatumAction = (
  detail: LumenChartDatumActivationDetail | null,
  context: string,
  labels: Readonly<LumenChartLabels>
): ReactChartDatumAction | null => detail ?
  {
    key: datumActionKey(detail),
    label: labels.formatDatumAction(context),
    serialized: JSON.stringify(detail)
  } :
  null

export const readReactChartDatumActivation = (
  root: HTMLElement,
  target: EventTarget | null
): LumenChartDatumActivationDetail | null => {
  if (!root.isConnected || !(target instanceof Element)) return null

  const element = target.closest('[data-ui-chart-datum]')

  if (element?.closest('[data-ui-chart-activation]') !== root) return null

  if (element.closest('[inert], [hidden], [disabled], [aria-disabled="true"]')) return null

  const serialized = element.getAttribute('data-ui-chart-datum')

  if (!serialized) return null

  try {
    const input: unknown = JSON.parse(serialized)

    return parseLumenChartDatumActivation(input)
  } catch {
    return null
  }
}

export const formatReactChartTableValue = (
  value: number | null | undefined,
  formatValue: (value: number) => string,
  notAvailable = 'Not available'
): string => value === null || value === undefined || !Number.isFinite(value) ?
  notAvailable :
  formatValue(value)
