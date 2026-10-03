/** Bounded, ungrouped decimal drafts. Arithmetic never passes through a floating-point number. */
export type LumenDecimalDraft =
  | { kind: 'empty' | 'incomplete' | 'invalid' } |
  { coefficient: bigint, kind: 'valid', scale: number }

export interface LumenDecimalOptions {
  locale?: string
  max?: string
  min?: string
  step?: string
}

const decimalSymbols = (locale?: string): { decimal: string, digits: readonly string[], minus: string } => {
  const formatter = new Intl.NumberFormat(locale, { useGrouping: false })
  const parts = formatter.formatToParts(-1.1)

  return {
    decimal: parts.find(part => part.type === 'decimal')?.value ?? '.',
    digits: Array.from({ length: 10 }, (_, digit) => formatter.format(digit)),
    minus: parts.find(part => part.type === 'minusSign')?.value ?? '-'
  }
}

const numericDigit = (character: string): number | null => {
  if (!/^\p{Decimal_Number}$/u.test(character)) return null

  const code = character.codePointAt(0)

  if (code === undefined) return null

  let start = code

  while (/^\p{Decimal_Number}$/u.test(String.fromCodePoint(start - 1))) start -= 1

  return (code - start) % 10
}

const scanDecimalDigits = (value: string, separator: string): { digits: string, scale: number } | null => {
  let digits = ''
  let decimalSeen = false
  let scale = 0

  for (const character of value) {
    const digit = numericDigit(character)

    if (digit !== null) {
      digits += String(digit)

      if (decimalSeen) scale += 1
    } else if (character === separator && !decimalSeen) decimalSeen = true
    else return null
  }

  return { digits, scale }
}

export const parseLumenDecimalDraft = (value: string, locale?: string): LumenDecimalDraft => {
  if (value === '') return { kind: 'empty' }

  if (value.length > 128) return { kind: 'invalid' }

  const symbols = decimalSymbols(locale)
  const negative = value.startsWith(symbols.minus) || value.startsWith('-')
  const signLength = value.startsWith(symbols.minus) ? symbols.minus.length : 1
  const unsigned = negative ? value.slice(signLength) : value
  const scanned = scanDecimalDigits(unsigned, symbols.decimal)

  if (!scanned) return { kind: 'invalid' }

  if (scanned.digits === '' || unsigned.endsWith(symbols.decimal)) return { kind: 'incomplete' }

  return { coefficient: BigInt(scanned.digits) * (negative ? -1n : 1n), kind: 'valid', scale: scanned.scale }
}

type ValidDecimal = Extract<LumenDecimalDraft, { kind: 'valid' }>

const parseConfiguration = (value: string | undefined): ValidDecimal | undefined => {
  if (value === undefined) return undefined

  for (const character of value) {
    if (!'0123456789.-'.includes(character)) throw new RangeError('Decimal configuration must use ASCII digits.')
  }

  const parsed = parseLumenDecimalDraft(value, 'en-US')

  if (parsed.kind !== 'valid') throw new RangeError('Decimal configuration must be a complete ungrouped decimal of at most 128 characters.')

  return parsed
}

const compareDecimals = (left: ValidDecimal, right: ValidDecimal): number => {
  const scale = Math.max(left.scale, right.scale)

  const difference = left.coefficient * 10n ** BigInt(scale - left.scale) -
    right.coefficient * 10n ** BigInt(scale - right.scale)

  return difference < 0n ? -1 : Number(difference > 0n)
}

const decimalConfiguration = (options: LumenDecimalOptions) => {
  const min = parseConfiguration(options.min)
  const max = parseConfiguration(options.max)
  const step = parseConfiguration(options.step ?? '1')

  if (!step || step.coefficient <= 0n) throw new RangeError('Decimal step must be positive.')

  if (min && max && compareDecimals(min, max) > 0) throw new RangeError('Decimal minimum must not exceed maximum.')

  return { max, min, step }
}

export const isLumenDecimalInBounds = (value: string, options: LumenDecimalOptions = {}): boolean => {
  const { max, min } = decimalConfiguration(options)
  const draft = parseLumenDecimalDraft(value, options.locale)

  return draft.kind === 'valid' &&
    (!min || compareDecimals(draft, min) >= 0) &&
    (!max || compareDecimals(draft, max) <= 0)
}

const localizeDigits = (value: string, digits: readonly string[]): string => {
  let result = ''

  for (const digit of value) result += digits[Number(digit)] ?? digit

  return result
}

const startingDecimal = (draft: LumenDecimalDraft, min?: ValidDecimal, max?: ValidDecimal): ValidDecimal | null => {
  if (draft.kind === 'valid') return draft

  if (draft.kind !== 'empty') return null

  if (min) return min

  if (max && max.coefficient < 0n) return max

  return { coefficient: 0n, kind: 'valid', scale: 0 }
}

const formatDecimal = (value: ValidDecimal, locale?: string): string => {
  const symbols = decimalSymbols(locale)
  const negative = value.coefficient < 0n
  const absolute = negative ? -value.coefficient : value.coefficient
  const digits = absolute.toString().padStart(value.scale + 1, '0')
  let fraction = value.scale > 0 ? digits.slice(-value.scale) : ''

  while (fraction.endsWith('0')) fraction = fraction.slice(0, -1)

  const integer = value.scale > 0 ? digits.slice(0, -value.scale) : digits
  const localized = localizeDigits(integer, symbols.digits)
  const localizedFraction = localizeDigits(fraction, symbols.digits)

  return `${negative ? symbols.minus : ''}${localized}${fraction ? symbols.decimal + localizedFraction : ''}`
}

export const stepLumenDecimalDraft = (
  value: string,
  direction: -1 | 1,
  options: LumenDecimalOptions = {}
): string | null => {
  const { max, min, step } = decimalConfiguration(options)
  const draft = parseLumenDecimalDraft(value, options.locale)
  const start = startingDecimal(draft, min, max)

  if (!start) return null

  const scale = Math.max(start.scale, step.scale)

  let result: ValidDecimal = {
    coefficient: start.coefficient * 10n ** BigInt(scale - start.scale) +
      BigInt(direction) * step.coefficient * 10n ** BigInt(scale - step.scale),
    kind: 'valid',
    scale
  }

  if (min && compareDecimals(result, min) < 0) result = min

  if (max && compareDecimals(result, max) > 0) result = max

  const formatted = formatDecimal(result, options.locale)

  return formatted.length <= 128 ? formatted : null
}

/** Single-editor numeric OTP normalization; separators are accepted, unrelated text is rejected. */
const validateOTPLength = (length: number): void => {
  if (!Number.isInteger(length) || length < 1 || length > 12) {
    throw new RangeError('OTP length must be between 1 and 12.')
  }
}

export const normalizeLumenNumericOTP = (proposal: string, length = 6): string | null => {
  validateOTPLength(length)

  if (proposal.length > 128) return null

  let result = ''

  for (const character of proposal) {
    const digit = numericDigit(character)

    if (digit !== null) result += String(digit)
    else if (character !== '-' && character.trim() !== '') return null

    if (result.length > length) return null
  }

  return result
}

export interface LumenTimeSelection { hour: number, minute: number }

export const isLumenTimeSelection = (value: LumenTimeSelection): boolean => (
  Number.isInteger(value.hour) && value.hour >= 0 && value.hour < 24 &&
  Number.isInteger(value.minute) && value.minute >= 0 && value.minute < 60
)

const timeMinutes = (time: LumenTimeSelection): number => time.hour * 60 + time.minute

const validateTimeBounds = (min?: LumenTimeSelection, max?: LumenTimeSelection): void => {
  if ((min && !isLumenTimeSelection(min)) || (max && !isLumenTimeSelection(max))) {
    throw new RangeError('Time bounds must contain valid wall-clock values.')
  }

  if (min && max && timeMinutes(min) > timeMinutes(max)) {
    throw new RangeError('Time bounds must be ordered within one day.')
  }
}

export const isLumenTimeInBounds = (
  value: LumenTimeSelection,
  min?: LumenTimeSelection,
  max?: LumenTimeSelection
): boolean => {
  validateTimeBounds(min, max)

  return isLumenTimeSelection(value) &&
    (!min || timeMinutes(value) >= timeMinutes(min)) &&
    (!max || timeMinutes(value) <= timeMinutes(max))
}
