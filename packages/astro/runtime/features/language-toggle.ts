import { formatLumenLanguageLabel, getLumenLocalePair, type LumenLocaleOption, normalizeLumenLocales } from '@santi020k/lumen-core'

import { queryScope } from '../scope.js'

const isUnknownArray = (value: unknown): value is unknown[] => Array.isArray(value)

const parseLanguageToggleLocales = (value: string | undefined): readonly LumenLocaleOption[] => {
  if (!value) return normalizeLumenLocales(undefined)

  try {
    const parsed: unknown = JSON.parse(value)

    if (!isUnknownArray(parsed)) return normalizeLumenLocales(undefined)

    const locales = parsed.flatMap(item => {
      if (!item || typeof item !== 'object' || !('label' in item) || !('value' in item)) return []

      const { label, value: localeValue } = item

      return typeof label === 'string' && typeof localeValue === 'string' ?
        [{ label, value: localeValue }] :
        []
    })

    return normalizeLumenLocales(locales)
  } catch {
    return normalizeLumenLocales(undefined)
  }
}

const readStoredLanguage = (controlled: boolean, storageKey: string | undefined): string | null => {
  let storedValue: string | null = null

  if (!controlled && storageKey) {
    try {
      storedValue = localStorage.getItem(storageKey)
    } catch {
      // Storage can be unavailable in privacy modes.
    }
  }

  return storedValue
}

const bindLanguageToggles = (control: HTMLButtonElement): void => {
  if (control.dataset.uiBound === 'true') return

  control.dataset.uiBound = 'true'

  const locales = parseLanguageToggleLocales(control.dataset.uiLanguageLocales)
  const storageKey = control.dataset.uiLanguageStorageKey
  const controlled = control.hasAttribute('data-ui-language-controlled')

  const labelTemplate = control.dataset.uiLanguageLabelTemplate ??
    'Change language from {current} to {next}'

  const sync = (value: string): void => {
    const { current, next } = getLumenLocalePair(locales, value)
    const label = control.querySelector<HTMLElement>('[data-ui-language-label]')

    control.dataset.uiLanguageValue = current.value

    control.dataset.uiLanguageNextValue = next.value

    control.setAttribute('aria-label', formatLumenLanguageLabel(labelTemplate, current, next))

    if (label) {
      label.lang = next.value

      label.textContent = next.label
    }
  }

  const storedValue = readStoredLanguage(controlled, storageKey)
  const documentValue = document.documentElement.lang || undefined

  const initialValue = controlled ?
    control.dataset.uiLanguageValue :
    storedValue ?? control.dataset.uiLanguageInitialValue ?? documentValue

  const initialPair = getLumenLocalePair(locales, initialValue)

  sync(initialPair.current.value)

  if (!controlled) document.documentElement.lang = initialPair.current.value

  control.addEventListener('click', () => {
    const { current, next } = getLumenLocalePair(locales, control.dataset.uiLanguageValue)

    if (!controlled) {
      document.documentElement.lang = next.value

      sync(next.value)

      if (storageKey) {
        try {
          localStorage.setItem(storageKey, next.value)
        } catch {
          // Storage can be unavailable in privacy modes.
        }
      }
    }

    control.dispatchEvent(new CustomEvent('ui:language-change', {
      bubbles: true,
      detail: { previousValue: current.value, value: next.value }
    }))
  })
}

export const initLanguageToggles = (scope: ParentNode): void => {
  for (const control of queryScope(scope, '[data-ui-language-toggle]', 'button')) bindLanguageToggles(control)
}
