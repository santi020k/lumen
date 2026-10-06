import {
  getLumenPhoneCountry,
  getLumenPhoneFlagSource,
  type LumenPhoneCountryOptions,
  type LumenPhoneNumber,
  resolveLumenPhoneNumber
} from '@santi020k/lumen-core'

const phoneInputSelector = '[data-ui-phone-input]'

const getPhoneOptions = (root: HTMLElement): LumenPhoneCountryOptions => {
  const locale = root.lang || root.ownerDocument.documentElement.lang || undefined

  return locale ? { locale } : {}
}

const resolvePhoneInput = (
  countrySelect: HTMLSelectElement,
  numberInput: HTMLInputElement,
  phoneOptions: LumenPhoneCountryOptions
): LumenPhoneNumber | undefined => {
  const selectedOption = countrySelect.selectedOptions[0]
  const regionCode = selectedOption?.dataset.region ?? countrySelect.value
  const country = getLumenPhoneCountry(regionCode, phoneOptions)

  if (!country) return undefined

  const detectedPhoneNumber = resolveLumenPhoneNumber(
    country, numberInput.value, phoneOptions
  )

  const detectedCountryIsAllowed = Array.from(countrySelect.options).some(option => (
    option.value === detectedPhoneNumber.country.regionCode
  ))

  return detectedCountryIsAllowed ?
    detectedPhoneNumber :
    resolveLumenPhoneNumber(
      country,
      detectedPhoneNumber.nationalNumber.startsWith('+') ?
        detectedPhoneNumber.nationalNumber.slice(1) :
        detectedPhoneNumber.nationalNumber,
      phoneOptions
    )
}

const getPhoneErrorMessage = (root: HTMLElement, phoneNumber: LumenPhoneNumber): string => {
  if (root.dataset.errorMessage) return root.dataset.errorMessage

  if (root.dataset.showValidationError === 'false' || !phoneNumber.nationalNumber || phoneNumber.isValid) return ''

  return root.dataset.invalidNumberMessage ?? 'Enter a complete phone number.'
}

const syncPhoneValidation = (
  root: HTMLElement,
  numberInput: HTMLInputElement,
  phoneNumber: LumenPhoneNumber,
  descriptions: string[]
): void => {
  const errorMessage = getPhoneErrorMessage(root, phoneNumber)
  const error = root.ownerDocument.getElementById(root.dataset.errorId ?? '')
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
}

const syncPhoneCountry = (root: HTMLElement, phoneNumber: LumenPhoneNumber): void => {
  const flag = root.querySelector<HTMLImageElement>('[data-slot="country-flag"] img')
  const flagSource = getLumenPhoneFlagSource(phoneNumber.country.regionCode)

  if (flag && flagSource) flag.src = flagSource

  const code = root.querySelector('[data-ui-phone-code]')

  if (code) code.textContent = phoneNumber.country.callingCode
}

export const initPhoneInputControllers = (scope: ParentNode): void => {
  for (const root of scope.querySelectorAll<HTMLElement>(phoneInputSelector)) {
    if (root.dataset.uiPhoneBound === 'true') continue

    const countrySelect = root.querySelector<HTMLSelectElement>('.ui-phone-input__country')
    const numberInput = root.querySelector<HTMLInputElement>('.ui-phone-input__number')

    if (!countrySelect || !numberInput) continue

    root.dataset.uiPhoneBound = 'true'

    root.dataset.phoneEnhanced = 'true'

    const errorId = root.dataset.errorId ?? ''
    const descriptions = (numberInput.getAttribute('aria-describedby') ?? '').split(' ').filter(id => id && id !== errorId)

    const commit = (): void => {
      const phoneNumber = resolvePhoneInput(countrySelect, numberInput, getPhoneOptions(root))

      if (!phoneNumber) return

      numberInput.value = phoneNumber.nationalNumber

      countrySelect.value = phoneNumber.country.regionCode

      syncPhoneValidation(root, numberInput, phoneNumber, descriptions)

      syncPhoneCountry(root, phoneNumber)

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
