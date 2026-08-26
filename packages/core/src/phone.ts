import {
  AsYouType,
  type CountryCode,
  getCountries,
  getCountryCallingCode,
  isSupportedCountry } from 'libphonenumber-js/max'

const regionalIndicatorA = 0x1F1E6

export interface LumenPhoneCountry {
  callingCode: `+${string}`
  displayName: string
  flag: string
  pickerLabel: string
  regionCode: CountryCode
}

export interface LumenPhoneNumber {
  country: LumenPhoneCountry
  e164: string | null
  isValid: boolean
  nationalNumber: string
}

export interface LumenPhoneCountryOptions {
  locale?: string | readonly string[]
}

const getRegionDisplayNames = (
  locale: string | readonly string[] | undefined
): Intl.DisplayNames | null => {
  if (typeof Intl.DisplayNames !== 'function') return null

  try {
    return new Intl.DisplayNames(locale, { type: 'region' })
  } catch {
    return null
  }
}

export const getLumenPhoneFlag = (regionCode: string): string => {
  const normalizedRegion = regionCode.toUpperCase()

  if (normalizedRegion.length !== 2) return ''

  const first = String.fromCodePoint(regionalIndicatorA + normalizedRegion.charCodeAt(0) - 65)
  const second = String.fromCodePoint(regionalIndicatorA + normalizedRegion.charCodeAt(1) - 65)

  return first + second
}

export const getLumenPhoneCountry = (
  regionCode: string,
  options: LumenPhoneCountryOptions = {}
): LumenPhoneCountry | null => {
  const normalizedRegion = regionCode.toUpperCase()

  if (!isSupportedCountry(normalizedRegion)) return null

  const displayNames = getRegionDisplayNames(options.locale)
  const displayName = displayNames?.of(normalizedRegion) ?? normalizedRegion
  const callingCode = `+${getCountryCallingCode(normalizedRegion)}` as const
  const flag = getLumenPhoneFlag(normalizedRegion)

  return {
    callingCode,
    displayName,
    flag,
    pickerLabel: `${flag} ${displayName} (${callingCode})`,
    regionCode: normalizedRegion
  }
}

export const getLumenPhoneCountries = (
  options: LumenPhoneCountryOptions = {}
): readonly LumenPhoneCountry[] => getCountries()
  .map(regionCode => getLumenPhoneCountry(regionCode, options))
  .filter((country): country is LumenPhoneCountry => country !== null)
  .sort((left, right) => left.displayName.localeCompare(right.displayName, options.locale))

export const createEmptyLumenPhoneNumber = (
  country: LumenPhoneCountry
): LumenPhoneNumber => ({
  country,
  e164: null,
  isValid: false,
  nationalNumber: ''
})

export const sanitizeLumenPhoneInput = (input: string): string => {
  let normalized = ''

  for (const character of input.trim()) {
    if (character >= '0' && character <= '9') {
      normalized += character
    } else if (character === '+' && normalized.length === 0) {
      normalized = character
    }
  }

  return normalized
}

const createLumenPhoneFormatter = (
  country: LumenPhoneCountry,
  normalized: string
): AsYouType => {
  if (normalized.startsWith('+')) return new AsYouType()

  return new AsYouType(country.regionCode)
}

const resolveParsedLumenPhoneCountry = (
  fallback: LumenPhoneCountry,
  normalized: string,
  parsedRegion: CountryCode | undefined,
  options: LumenPhoneCountryOptions
): LumenPhoneCountry => {
  if (!normalized.startsWith('+') || !parsedRegion) return fallback

  return getLumenPhoneCountry(parsedRegion, options) ?? fallback
}

const resolveLumenNationalPhoneNumber = (
  formattedInput: string,
  formattedNationalNumber: string | undefined,
  normalized: string
): string => {
  if (!normalized.startsWith('+') || formattedNationalNumber === undefined) return formattedInput

  return formattedNationalNumber
}

export const resolveLumenPhoneNumber = (
  country: LumenPhoneCountry,
  input: string,
  options: LumenPhoneCountryOptions = {}
): LumenPhoneNumber => {
  const normalized = sanitizeLumenPhoneInput(input)

  if (!normalized || normalized === '+') return createEmptyLumenPhoneNumber(country)

  const formatter = createLumenPhoneFormatter(country, normalized)
  const formattedInput = formatter.input(normalized)
  const parsedNumber = formatter.getNumber()
  const isValid = formatter.isValid() && parsedNumber !== undefined

  const parsedCountry = resolveParsedLumenPhoneCountry(
    country,
    normalized,
    parsedNumber?.country,
    options
  )

  const formattedNationalNumber = isValid ? parsedNumber.formatNational() : undefined

  return {
    country: parsedCountry,
    e164: isValid ? parsedNumber.number : null,
    isValid,
    nationalNumber: resolveLumenNationalPhoneNumber(
      formattedInput,
      formattedNationalNumber,
      normalized
    )
  }
}
