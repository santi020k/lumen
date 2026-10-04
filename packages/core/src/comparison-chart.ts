import type { LumenChartDomain, LumenChartTone } from './charts.js'
import { lumenChartTones, scaleLumenChartValue } from './charts.js'

export interface LumenComparisonDatum {
  id: string
  label: string
  value: number | null
  reference?: number | null
  tone?: LumenChartTone
}

export interface LumenComparisonOptions {
  domain?: LumenChartDomain | undefined
  paired?: boolean | undefined
}

const validMeasurement = (value: unknown): value is number | null => value === null || (typeof value === 'number' && Number.isFinite(value))
const validLabel = (value: unknown): boolean => typeof value === 'string' && value.trim().length > 0
const validReference = (value: unknown): boolean => value === undefined || validMeasurement(value)
const validTone = (value: unknown): boolean => value === undefined || lumenChartTones.some(tone => tone === value)

const encloses = (domain: LumenChartDomain, min: number, max: number): boolean => (
  Number.isFinite(domain.min) && Number.isFinite(domain.max) &&
  domain.min < domain.max && domain.min <= min && domain.max >= max
)

const optionalFieldsValid = (value: unknown): boolean => {
  if (typeof value !== 'object' || value === null) return false

  return (!('reference' in value) || validReference(value.reference)) && (!('tone' in value) || validTone(value.tone))
}

/** Validate a complete comparison dataset; never silently drop invalid rows. */
export const isLumenComparisonDatum = (value: unknown): value is LumenComparisonDatum => {
  if (typeof value !== 'object' || value === null) return false

  if (!('id' in value) || !('label' in value) || !('value' in value)) return false

  return validLabel(value.id) && validLabel(value.label) && validMeasurement(value.value) &&
    optionalFieldsValid(value)
}

/** Horizontal rankings and paired comparisons on one zero-inclusive scale. */
export const createLumenComparisonGeometry = (
  data: readonly LumenComparisonDatum[], options: LumenComparisonOptions = {}
) => {
  const ids = new Set<string>()
  let min = 0
  let max = 0

  const validData = data.every(item => {
    if (!isLumenComparisonDatum(item) || ids.has(item.id)) return false

    ids.add(item.id)

    for (const value of [item.value, ...(options.paired ? [item.reference ?? null] : [])]) {
      if (value !== null) {
        min = Math.min(min, value)

        max = Math.max(max, value)
      }
    }

    return true
  })

  const requested = options.domain ?? { min, max: max === min ? max + 1 : max }
  const valid = validData && encloses(requested, min, max)
  const domain = valid ? requested : { min: 0, max: 1 }
  const position = (value: number) => scaleLumenChartValue(value, domain, 0, 1)

  return {
    valid,
    domain,
    ticks: [domain.min, domain.min / 2 + domain.max / 2, domain.max],
    rows: valid ?
      data.map(item => {
        const reference = options.paired ? item.reference ?? null : 0
        const valuePosition = item.value === null ? null : position(item.value)
        const referencePosition = reference === null ? null : position(reference)

        return {
          ...item,
          reference,
          valuePosition,
          referencePosition,
          start: Math.min(valuePosition ?? 0, referencePosition ?? 0),
          width: valuePosition === null || referencePosition === null ? 0 : Math.abs(valuePosition - referencePosition)
        }
      }) :
      []
  }
}
