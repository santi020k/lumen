import {
  getLumenPhoneCountry,
  resolveLumenPhoneNumber
} from '@santi020k/lumen-core'

/* eslint-disable complexity -- Phone normalization keeps detection, allowed-country fallback, validity, and emitted state in one atomic commit. */

const phoneInputSelector = '[data-ui-phone-input]'

export const initPhoneInputControllers = (scope: ParentNode): void => {
  for (const root of scope.querySelectorAll<HTMLElement>(phoneInputSelector)) {
    if (root.dataset.uiPhoneBound === 'true') continue

    const countrySelect = root.querySelector<HTMLSelectElement>('.ui-phone-input__country')
    const numberInput = root.querySelector<HTMLInputElement>('.ui-phone-input__number')

    if (!countrySelect || !numberInput) continue

    root.dataset.uiPhoneBound = 'true'

    const locale = root.lang || document.documentElement.lang || undefined
    const phoneOptions = locale ? { locale } : {}

    const commit = (): void => {
      const selectedOption = countrySelect.selectedOptions[0]
      const regionCode = selectedOption?.dataset.region ?? countrySelect.value
      const country = getLumenPhoneCountry(regionCode, phoneOptions)

      if (!country) return

      const detectedPhoneNumber = resolveLumenPhoneNumber(
        country, numberInput.value, phoneOptions
      )

      const detectedCountryIsAllowed = Array.from(countrySelect.options).some(option => (
        option.value === detectedPhoneNumber.country.regionCode
      ))

      const phoneNumber = detectedCountryIsAllowed ?
        detectedPhoneNumber :
        resolveLumenPhoneNumber(
          country,
          detectedPhoneNumber.nationalNumber.startsWith('+') ?
            detectedPhoneNumber.nationalNumber.slice(1) :
            detectedPhoneNumber.nationalNumber,
          phoneOptions
        )

      const hasInput = phoneNumber.nationalNumber.length > 0

      const invalidMessage = root.dataset.invalidNumberMessage ??
        'Enter a complete phone number.'

      numberInput.value = phoneNumber.nationalNumber

      countrySelect.value = phoneNumber.country.regionCode

      numberInput.setCustomValidity(
        hasInput && !phoneNumber.isValid ? invalidMessage : ''
      )

      numberInput.setAttribute(
        'aria-invalid', String(hasInput && !phoneNumber.isValid)
      )

      root.dataset.e164 = phoneNumber.e164 ?? ''

      root.dataset.valid = String(phoneNumber.isValid)

      root.dispatchEvent(new CustomEvent('ui:phone-change', {
        bubbles: true,
        detail: phoneNumber
      }))
    }

    countrySelect.addEventListener('change', commit)

    numberInput.addEventListener('input', commit)

    if (numberInput.value) commit()
  }
}
