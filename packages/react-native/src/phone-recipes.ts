import {
  type LumenPhoneCountry,
  type LumenPhoneCountryOptions,
  type LumenPhoneNumber,
  resolveLumenPhoneNumber
} from '@santi020k/lumen-core'

export const resolveLumenPhoneInputValue = (
  countries: readonly LumenPhoneCountry[],
  country: LumenPhoneCountry,
  input: string,
  options: LumenPhoneCountryOptions
): LumenPhoneNumber => {
  const detectedNumber = resolveLumenPhoneNumber(country, input, options)

  const detectedCountryIsAllowed = countries.some(candidate => (
    candidate.regionCode === detectedNumber.country.regionCode
  ))

  if (detectedCountryIsAllowed) return detectedNumber

  const allowedCountryInput = detectedNumber.nationalNumber.startsWith('+') ?
    detectedNumber.nationalNumber.slice(1) :
    detectedNumber.nationalNumber

  return resolveLumenPhoneNumber(country, allowedCountryInput, options)
}

export const resolveLumenPhoneControlledValue = (
  countries: readonly LumenPhoneCountry[],
  value: LumenPhoneNumber,
  options: LumenPhoneCountryOptions
): LumenPhoneNumber => {
  if (countries.some(country => country.regionCode === value.country.regionCode)) return value

  const fallbackCountry = countries[0]

  return fallbackCountry ?
    resolveLumenPhoneInputValue(countries, fallbackCountry, value.nationalNumber, options) :
    value
}
