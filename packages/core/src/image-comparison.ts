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
