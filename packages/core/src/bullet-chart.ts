import { type LumenChartDomain, type LumenChartTone, lumenChartTones, scaleLumenChartValue } from './charts.js'

export interface LumenBulletRange {
  end: number
  label: string
  tone?: LumenChartTone
}

export interface LumenBulletOptions {
  domain?: LumenChartDomain | undefined
  ranges?: readonly LumenBulletRange[] | undefined
}

const validBulletTone = (value: unknown): boolean => value === undefined || lumenChartTones.some(tone => tone === value)

const validBulletRange = (range: unknown): range is LumenBulletRange => {
  if (typeof range !== 'object' || range === null) return false

  if (!('end' in range) || !('label' in range)) return false

  return Number.isFinite(range.end) && typeof range.label === 'string' &&
    validBulletTone('tone' in range ? range.tone : undefined)
}

const automaticBulletDomain = (values: readonly number[]): LumenChartDomain => {
  let minimum = 0
  let maximum = 0

  for (const number of values) {
    if (!Number.isFinite(number)) continue

    minimum = Math.min(minimum, number)

    maximum = Math.max(maximum, number)
  }

  return { min: minimum, max: minimum === maximum ? minimum + 1 : maximum }
}

const validBulletDomain = (domain: LumenChartDomain): boolean => {
  const finite = Number.isFinite(domain.min) && Number.isFinite(domain.max)

  return finite && domain.min < domain.max && domain.min <= 0 && domain.max >= 0
}

const orderedBulletRanges = (ranges: readonly LumenBulletRange[], domain: LumenChartDomain): boolean => {
  let previousEnd = domain.min

  return ranges.every(range => {
    const valid = range.label.trim().length > 0 && range.end > previousEnd

    previousEnd = range.end

    return valid
  })
}

const resolveBulletModel = (value: number | null, target: number, options: LumenBulletOptions) => {
  const inputRanges = options.ranges ?? []
  const finiteRanges = inputRanges.every(validBulletRange)
  const ranges = finiteRanges ? [...inputRanges].sort((left, right) => left.end - right.end) : []
  const values = [0, target, ...ranges.map(range => range.end), ...value === null ? [] : [value]]
  const requested = options.domain ?? automaticBulletDomain(values)
  const domain = validBulletDomain(requested) ? requested : { min: 0, max: 1 }
  const withinDomain = values.every(number => Number.isFinite(number) && number >= domain.min && number <= domain.max)
  const valid = finiteRanges && validBulletDomain(requested) && withinDomain && orderedBulletRanges(ranges, domain)

  return { domain, ranges, valid }
}

/** A zero-based actual-versus-target comparison with optional qualitative ranges. */
export const createLumenBulletGeometry = (value: number | null, target: number, options: LumenBulletOptions = {}) => {
  const { domain, ranges, valid } = resolveBulletModel(value, target, options)
  const position = (number: number) => scaleLumenChartValue(number, domain, 0, 1)
  const zero = position(0)
  const actual = valid && value !== null ? position(value) : zero
  let start = domain.min

  return {
    domain,
    ranges: valid ?
      ranges.map(range => {
        const segment = { ...range, start, startRatio: position(start), endRatio: position(range.end) }

        start = range.end

        return segment
      }) :
      [],
    target,
    targetRatio: valid ? position(target) : zero,
    ticks: valid ?
      [domain.min, domain.min / 2 + domain.max / 2, domain.max].map(tick => ({
        value: tick, position: position(tick)
      })) :
      [],
    valid,
    value,
    valueStartRatio: Math.min(zero, actual),
    valueWidthRatio: Math.abs(actual - zero)
  }
}
