import {
  getLumenPhoneCountry,
  getLumenPhoneFlagSource,
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

    root.dataset.phoneEnhanced = 'true'

    const locale = root.lang || document.documentElement.lang || undefined
    const phoneOptions = locale ? { locale } : {}
    const errorId = root.dataset.errorId ?? ''
    const descriptions = (numberInput.getAttribute('aria-describedby') ?? '').split(' ').filter(id => id && id !== errorId)

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

      const errorMessage = root.dataset.errorMessage || (root.dataset.showValidationError !== 'false' && hasInput && !phoneNumber.isValid ? invalidMessage : '')
      const error = document.getElementById(root.dataset.errorId ?? '')
      const describedBy = [...descriptions, ...(errorMessage && error ? [error.id] : [])].join(' ')

      if (describedBy) numberInput.setAttribute('aria-describedby', describedBy)
      else numberInput.removeAttribute('aria-describedby')

      numberInput.setCustomValidity(errorMessage)

      numberInput.setAttribute('aria-invalid', String(Boolean(errorMessage)))

      root.dataset.invalid = String(Boolean(errorMessage))

      if (error) {
        error.textContent = errorMessage

        error.hidden = !errorMessage
      }

      if (errorMessage && error) numberInput.setAttribute('aria-errormessage', error.id)
      else numberInput.removeAttribute('aria-errormessage')

      const flag = root.querySelector<HTMLImageElement>('[data-slot="country-flag"] img')
      const flagSource = getLumenPhoneFlagSource(phoneNumber.country.regionCode)

      if (flag && flagSource) flag.src = flagSource

      const code = root.querySelector('[data-ui-phone-code]')

      if (code) code.textContent = phoneNumber.country.callingCode

      root.dataset.e164 = phoneNumber.e164 ?? ''

      root.dataset.valid = String(phoneNumber.isValid)

      root.dispatchEvent(new CustomEvent('ui:phone-change', {
        bubbles: true,
        detail: phoneNumber
      }))
    }

    countrySelect.addEventListener('change', commit)

    numberInput.addEventListener('input', commit)

    numberInput.form?.addEventListener('reset', () => {
      queueMicrotask(commit)
    })

    commit()
  }
}
