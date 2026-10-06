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

  test.each([
    ['en-US', '1.2,3'], ['en-US', '1.2,,3'], ['es-CO', '1,2.3'], ['es-CO', '1,2..3']
  ])('rejects fractional group separators in %s paste %s', (locale, source) => {
    expect(parseLumenAmountDraft(source, { locale })).toBeUndefined()
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

test('amount resets follow current external form ownership and respect cancellation and disposal', async () => {
  const container = document.createElement('div')

  container.innerHTML = '<form id="amount-a"></form><form id="amount-b"></form><span default-value="1"><input data-ui-amount-input form="amount-a"><input data-ui-amount-value type="hidden" form="amount-a"></span>'

  document.body.append(container)

  const root = container.querySelector('span')
  const input = container.querySelector('input')
  const submission = container.querySelector<HTMLInputElement>('[data-ui-amount-value]')
  const a = container.querySelector<HTMLFormElement>('#amount-a')
  const b = container.querySelector<HTMLFormElement>('#amount-b')

  if (!root || !input || !submission || !a || !b) throw new Error('Missing amount ownership fixture')

  const controller = createLumenAmountFieldController(root)
  const settle = () => new Promise<void>(resolve => setTimeout(resolve, 0))

  try {
    input.setAttribute('form', 'amount-b')

    submission.setAttribute('form', 'amount-b')

    controller.setValue('9')

    a.reset()

    await settle()

    expect(submission.value).toBe('9')

    b.reset()

    await settle()

    expect(input.value).toBe('1')

    expect(submission.value).toBe('1')

    controller.setValue('7')

    b.addEventListener('reset', event => {
      event.preventDefault()
    }, { once: true })

    b.reset()

    await settle()

    expect(submission.value).toBe('7')

    controller.setValue('8')

    b.reset()

    controller.destroy()

    await settle()

    expect(submission.value).toBe('8')
  } finally {
    controller.destroy()

    container.remove()
  }
})

test.each([false, true])('amount edits honor disabled fieldset state and first legend=%s', legend => {
  const fieldset = document.createElement('fieldset')

  fieldset.disabled = true

  fieldset.innerHTML = '<legend></legend><span default-value="1"><input data-ui-amount-input><input data-ui-amount-value type="hidden"></span>'

  const root = fieldset.querySelector('span')
  const input = fieldset.querySelector('input')
  const submission = fieldset.querySelector<HTMLInputElement>('[data-ui-amount-value]')
  const firstLegend = fieldset.querySelector('legend')

  if (!root || !input || !submission || !firstLegend) throw new Error('Missing disabled amount fixture')

  if (legend) firstLegend.append(root)

  document.body.append(fieldset)

  const changes: string[] = []
  const controller = createLumenAmountFieldController(root, detail => changes.push(detail.draft))

  try {
    input.value = '3'

    input.dispatchEvent(new Event('input'))

    expect(submission.value).toBe(legend ? '3' : '1')

    expect(changes).toEqual(legend ? ['3'] : [])
  } finally {
    controller.destroy()

    fieldset.remove()
  }
})

test('invalid locale tags use deterministic English amount presentation and parsing', () => {
  const options = { locale: 'en_US' }

  expect(formatLumenAmountDraft('1234.50', options)).toBe('1,234.50')

  expect(parseLumenAmountDraft('1,234.50', options)).toBe('1234.50')

  const root = document.createElement('span')

  root.setAttribute('locale', 'en_US')

  root.setAttribute('default-value', '1234.50')

  root.innerHTML = '<input data-ui-amount-input><input data-ui-amount-value type="hidden">'

  const controller = createLumenAmountFieldController(root)

  try {
    expect(root.querySelector('input')?.value).toBe('1,234.50')
  } finally {
    controller.destroy()
  }
})

test('amount refresh moves reset ownership and cannot resurrect a destroyed controller', async () => {
  const frame = document.createElement('iframe')
  const form = document.createElement('form')

  form.innerHTML = '<span default-value="1"><input data-ui-amount-input><input data-ui-amount-value type="hidden"></span>'

  document.body.append(form, frame)

  const destination = frame.contentDocument
  const root = form.querySelector('span')
  const input = form.querySelector('input')
  const submission = form.querySelector<HTMLInputElement>('[data-ui-amount-value]')

  if (!destination || !root || !input || !submission) throw new Error('Missing amount refresh fixture')

  const controller = createLumenAmountFieldController(root)
  const settle = () => new Promise<void>(resolve => setTimeout(resolve, 0))

  try {
    controller.setValue('9.')

    form.reset()

    destination.body.append(destination.adoptNode(form))

    controller.refresh()

    await settle()

    expect(submission.value).toBe('')

    controller.setValue('8')

    form.reset()

    await settle()

    expect(submission.value).toBe('1')

    controller.setValue('7')

    controller.destroy()

    controller.refresh()

    form.reset()

    await settle()

    expect(submission.value).toBe('7')
  } finally {
    controller.destroy()

    form.remove()

    frame.remove()
  }
})
