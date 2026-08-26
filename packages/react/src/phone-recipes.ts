import {
  getLumenPhoneCountry,
  type LumenPhoneCountry,
  type LumenPhoneCountryOptions,
  type LumenPhoneNumber,
  resolveLumenPhoneNumber } from '@santi020k/lumen-core'

export const resolveReactPhoneInputValue = (
  countries: readonly LumenPhoneCountry[],
  country: LumenPhoneCountry,
  input: string,
  options: LumenPhoneCountryOptions
): LumenPhoneNumber => {
  const detectedNumber = resolveLumenPhoneNumber(country, input, options)

  const detectedCountryIsAllowed = countries.some(candidate => (
    candidate.regionCode === detectedNumber.country.regionCode
  ))

  return detectedCountryIsAllowed ?
    detectedNumber :
    resolveLumenPhoneNumber(country, detectedNumber.nationalNumber, options)
}

export const resolveReactPhoneInputCountry = (
  countries: readonly LumenPhoneCountry[],
  defaultCountryValue: string,
  locale: LumenPhoneCountryOptions['locale'],
  value: LumenPhoneNumber | undefined
): LumenPhoneCountry => {
  const requestedCountry = value?.country

  const country = countries.find(candidate => (
    candidate.regionCode === requestedCountry?.regionCode ||
    candidate.callingCode === requestedCountry?.callingCode
  )) ?? countries.find(candidate => (
    candidate.regionCode === defaultCountryValue ||
    candidate.callingCode === defaultCountryValue
  )) ?? countries[0] ?? getLumenPhoneCountry('US', { ...(locale === undefined ? {} : { locale }) })

  if (!country) throw new Error('PhoneInput requires at least one supported country.')

  return country
}
