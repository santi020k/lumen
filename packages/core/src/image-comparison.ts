/** Display modes preserve the reveal value when switching views. */
export type LumenImageComparisonMode = 'reveal' | 'side-by-side' | 'before' | 'after'

export const normalizeLumenImageComparisonMode = (value: unknown): LumenImageComparisonMode => (
  value === 'side-by-side' || value === 'before' || value === 'after' ? value : 'reveal'
)

/** Synchronizes authored media without replacing application-owned nodes. */
export const syncLumenImageComparisonMode = (root: HTMLElement, mode: LumenImageComparisonMode): void => {
  if (root.dataset.mode !== mode) root.dataset.mode = mode

  const before = root.querySelector<HTMLElement>('.ui-image-comparison__before')
  const after = root.querySelector<HTMLElement>('.ui-image-comparison__after')
  const control = root.querySelector<HTMLElement>('.ui-image-comparison__control')
  const labels = root.querySelectorAll<HTMLElement>('.ui-image-comparison__labels > span')

  if (before) before.hidden = mode === 'after'

  if (after) after.hidden = mode === 'before'

  if (control) control.hidden = mode !== 'reveal'

  const beforeLabel = labels[0]
  const afterLabel = labels[1]

  if (beforeLabel) beforeLabel.hidden = mode === 'after'

  if (afterLabel) afterLabel.hidden = mode === 'before'
}

export interface LumenImageComparisonChangeDetail {
  value: number
}

export type LumenImageComparisonChangeEvent = CustomEvent<LumenImageComparisonChangeDetail>

const comparisonNumber = (value: unknown): number => {
  if (typeof value === 'number') return value

  if (typeof value === 'string' && value.trim() !== '') return Number(value)

  return NaN
}

/** Percentage of the after image revealed, rounded to the native control's step. */
export const normalizeLumenImageComparisonValue = (value: unknown): number => {
  const number = comparisonNumber(value)

  return Number.isFinite(number) ? Math.round(Math.min(100, Math.max(0, number))) : 50
}

export const normalizeLumenImageComparisonRatio = (ratio: unknown): number => {
  const number = comparisonNumber(ratio)

  return Number.isFinite(number) && number > 0 ? number : 16 / 9
}

export const formatLumenImageComparisonValue = (
  value: number,
  afterLabel: string,
  locale?: string
): string => {
  let formatter: Intl.NumberFormat

  try {
    formatter = new Intl.NumberFormat(locale, { style: 'percent' })
  } catch {
    formatter = new Intl.NumberFormat('en', { style: 'percent' })
  }

  return `${formatter.format(normalizeLumenImageComparisonValue(value) / 100)} ${afterLabel}`
}
