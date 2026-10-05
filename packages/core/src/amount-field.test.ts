// @vitest-environment jsdom

import { describe, expect, test } from 'vitest'

import { createLumenAmountFieldController, formatLumenAmountDraft, getLumenAmountValue, parseLumenAmountDraft } from './amount-field.js'

describe('exact amount presentation', () => {
  test('formats large values without floating-point rounding', () => {
    const draft = '9007199254740993123456789.05'

    expect(formatLumenAmountDraft(draft)).toBe('9,007,199,254,740,993,123,456,789.05')
    expect(parseLumenAmountDraft(formatLumenAmountDraft(draft))).toBe(draft)
    expect(getLumenAmountValue(draft)).toBe(draft)
  })

  test.each(['en-US', 'es-CO', 'de-DE', 'hi-IN', 'ar-EG'])('round trips locale %s including exact fraction zeroes', locale => {
    const options = { locale, allowNegative: true }
    const formatted = formatLumenAmountDraft('-1234567.50', options)

    expect(parseLumenAmountDraft(formatted, options)).toBe('-1234567.50')
  })

  test('preserves clearing and intermediate drafts without a submittable amount', () => {
    for (const draft of ['', '-', '1.', '-0.']) {
      expect(formatLumenAmountDraft(draft, { allowNegative: true })).toBe(draft)
      expect(getLumenAmountValue(draft)).toBeUndefined()
    }

    expect(parseLumenAmountDraft('.5')).toBe('0.5')
  })

  test.each(['1,23', '1e3', '$ 12', '12abc', '1.234', '--12', '-12', '9'.repeat(10000)])('rejects unsupported or ambiguous paste %s', source => {
    expect(parseLumenAmountDraft(source)).toBeUndefined()
  })

  test('permits temporary group disruption while editing and never truncates precision', () => {
    expect(parseLumenAmountDraft('1,23', {}, false)).toBe('123')
    expect(parseLumenAmountDraft('1.2', { fractionDigits: 0 })).toBeUndefined()
    expect(() => formatLumenAmountDraft('1', { fractionDigits: 21 })).toThrow(RangeError)
  })

  test('synchronizes native form values, caret, composition, validity, reset and disposal', async () => {
    const form = document.createElement('form')
    const root = document.createElement('span')

    root.setAttribute('default-value', '1234')

    root.innerHTML = '<input data-ui-amount-input required aria-label="Amount"><input data-ui-amount-value type="hidden" name="amount">'

    form.append(root)

    document.body.append(form)

    const input = root.querySelector('input')

    if (!input) throw new Error('Missing amount input')

    const changes: string[] = []
    const controller = createLumenAmountFieldController(root, detail => {
      changes.push(detail.draft)
    })

    expect(input.value).toBe('1,234')
    expect(new FormData(form).get('amount')).toBe('1234')

    input.value = '12,934'

    input.setSelectionRange(3, 3)

    input.dispatchEvent(new InputEvent('input', { inputType: 'insertText' }))

    expect(input.selectionStart).toBe(2)
    expect(new FormData(form).get('amount')).toBe('12934')

    input.value = '1,23'

    input.dispatchEvent(new InputEvent('input', { inputType: 'insertFromPaste' }))

    expect(input.value).toBe('12,934')
    expect(input.validity.customError).toBe(true)

    input.dispatchEvent(new CompositionEvent('compositionstart'))

    input.value = '9'

    input.dispatchEvent(new InputEvent('input'))

    expect(new FormData(form).get('amount')).toBe('12934')

    input.dispatchEvent(new CompositionEvent('compositionend'))

    expect(new FormData(form).get('amount')).toBe('9')

    input.value = '1.'

    input.dispatchEvent(new InputEvent('input'))

    expect(form.checkValidity()).toBe(false)
    expect(new FormData(form).get('amount')).toBe('')

    form.reset()

    await new Promise<void>(resolve => {
      setTimeout(resolve, 0)
    })

    expect(input.value).toBe('1,234')
    expect(form.checkValidity()).toBe(true)

    controller.destroy()

    input.value = '5'

    input.dispatchEvent(new InputEvent('input'))

    expect(changes.at(-1)).toBe('1234')

    form.remove()
  })
})
