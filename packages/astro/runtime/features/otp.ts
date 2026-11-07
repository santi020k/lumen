import { queryScope } from '../scope.js'

import { isOwnedByAnotherAdapter } from './shared.js'

const sanitizeOtpValue = (input: HTMLInputElement, value: string, length: number): string => {
  const numericOnly = input.inputMode === 'numeric' || input.getAttribute('pattern') === '[0-9]*'
  const normalized = numericOnly ? value.replaceAll(/\D/g, '') : value.replaceAll(/\s/g, '')

  return normalized.slice(0, length)
}

const bindInputOtpFields = (root: HTMLElement): void => {
  if (root.dataset.uiBound === 'true' || isOwnedByAnotherAdapter(root)) return

  const input = root.querySelector<HTMLInputElement>('[data-ui-input-otp-native]')
  const segments = [...root.querySelectorAll<HTMLButtonElement>('[data-ui-input-otp-segment]')]

  if (!input || segments.length === 0) return

  root.dataset.uiBound = 'true'

  const length = Number.parseInt(root.dataset.uiInputOtpLength ?? '', 10) || segments.length

  input.dataset.uiEnhanced = 'true'

  const syncSegments = (): void => {
    const value = sanitizeOtpValue(input, input.value, length)

    if (input.value !== value) {
      input.value = value
    }

    const activeIndex = Math.min(length - 1, Math.max(0, input.selectionStart ?? value.length))

    root.dataset.disabled = input.disabled ? 'true' : 'false'

    root.dataset.invalid = input.getAttribute('aria-invalid') === 'true' ? 'true' : 'false'

    for (const [index, segment] of segments.entries()) {
      const char = segment.querySelector<HTMLElement>('[data-ui-input-otp-char]')

      segment.disabled = input.disabled

      segment.dataset.active = String(document.activeElement === input && index === activeIndex)

      if (char) {
        char.textContent = value[index] ?? '\u00a0'
      }
    }
  }

  const setSelection = (index: number): void => {
    const position = Math.min(input.value.length, Math.max(0, index))

    input.focus({ preventScroll: true })

    input.setSelectionRange(position, position)

    syncSegments()
  }

  const setValue = (value: string): void => {
    input.value = sanitizeOtpValue(input, value, length)

    input.setSelectionRange(input.value.length, input.value.length)

    input.dispatchEvent(new Event('input', { bubbles: true }))

    input.dispatchEvent(new Event('change', { bubbles: true }))

    syncSegments()
  }

  const segmentsRoot = root.querySelector<HTMLElement>('[data-ui-input-otp-segments]')

  if (segmentsRoot) {
    segmentsRoot.hidden = false
  }

  syncSegments()

  input.addEventListener('input', syncSegments)

  input.addEventListener('change', syncSegments)

  input.addEventListener('focus', syncSegments)

  input.addEventListener('blur', syncSegments)

  input.addEventListener('click', syncSegments)

  input.addEventListener('keyup', syncSegments)

  input.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault()

      setSelection((input.selectionStart ?? input.value.length) - 1)

      return
    }

    if (event.key === 'ArrowRight') {
      event.preventDefault()

      setSelection((input.selectionStart ?? input.value.length) + 1)

      return
    }

    if (event.key === 'Home') {
      event.preventDefault()

      setSelection(0)

      return
    }

    if (event.key === 'End') {
      event.preventDefault()

      setSelection(input.value.length)
    }
  })

  input.addEventListener('paste', event => {
    const pasted = event.clipboardData?.getData('text') ?? ''

    if (!pasted) return

    event.preventDefault()

    setValue(pasted)
  })

  input.form?.addEventListener('reset', () => {
    window.setTimeout(syncSegments)
  })

  for (const [index, segment] of segments.entries()) {
    segment.addEventListener('click', () => {
      setSelection(index)
    })
  }
}

export const initInputOtpFields = (scope: ParentNode): void => {
  for (const root of queryScope(scope, '[data-ui-input-otp]')) bindInputOtpFields(root)
}
