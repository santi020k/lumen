export interface LumenAmountOptions {
  locale?: string
  fractionDigits?: number
  allowNegative?: boolean
}

export interface LumenAmountChangeDetail {
  /** Editable ASCII decimal draft; intermediate '-' and trailing decimal points are retained. */
  draft: string
  /** Complete decimal string. Undefined for an empty or intermediate draft. */
  value: string | undefined
}

const amountLimit = 1024

const validateFractionDigits = (digits: number): void => {
  if (!Number.isInteger(digits) || digits < 0 || digits > 20) {
    throw new RangeError('Amount fractionDigits must be an integer from 0 to 20.')
  }
}

const amountFormat = (options: LumenAmountOptions) => {
  const fractionDigits = options.fractionDigits ?? 2
  let locale = options.locale ?? 'en-US'

  validateFractionDigits(fractionDigits)

  let formatter: Intl.NumberFormat

  try {
    formatter = new Intl.NumberFormat(locale, { useGrouping: true, maximumFractionDigits: 0 })
  } catch {
    locale = 'en-US'

    formatter = new Intl.NumberFormat(locale, { useGrouping: true, maximumFractionDigits: 0 })
  }

  const decimal = new Intl.NumberFormat(locale).formatToParts(1.1).find(part => part.type === 'decimal')?.value ?? '.'
  const group = formatter.formatToParts(1000000).find(part => part.type === 'group')?.value
  const minus = formatter.formatToParts(-1).find(part => part.type === 'minusSign')?.value ?? '-'
  const digitFormatter = new Intl.NumberFormat(locale, { useGrouping: false })
  const digits = Array.from({ length: 10 }, (_, digit) => digitFormatter.format(digit))

  return { formatter, decimal, group, minus, digits, fractionDigits }
}

const validDraft = (draft: string, options: LumenAmountOptions): boolean => {
  if (draft.length > amountLimit) return false

  const { fractionDigits } = amountFormat(options)
  const negative = draft.startsWith('-')

  if (negative && !options.allowNegative) return false

  const unsigned = negative ? draft.slice(1) : draft
  const pieces = unsigned.split('.')

  if (pieces.length > 2 || (pieces.length === 2 && fractionDigits === 0)) return false

  const fraction = pieces[1] ?? ''

  return pieces.every(piece => /^[0-9]*$/u.test(piece)) && fraction.length <= fractionDigits
}

export const getLumenAmountValue = (draft: string): string | undefined => {
  if (!/^-?[0-9]+(?:\.[0-9]+)?$/u.test(draft) || draft.length > amountLimit) return undefined

  return draft
}

export const formatLumenAmountDraft = (draft: string, options: LumenAmountOptions = {}): string => {
  if (!validDraft(draft, options)) throw new RangeError('Amount value must be an ASCII decimal draft within the configured precision.')

  if (draft === '') return ''

  const { formatter, decimal, minus, digits } = amountFormat(options)
  const negative = draft.startsWith('-')
  const unsigned = negative ? draft.slice(1) : draft
  const [integer = '', fraction] = unsigned.split('.')
  const formattedInteger = integer ? formatter.format(BigInt(integer)) : ''
  const localizedFraction = Array.from(fraction ?? '', digit => digits[Number(digit)] ?? digit).join('')

  // Use an unsigned formatter so intermediate negative drafts never acquire a rounded sign.
  return `${negative ? minus : ''}${formattedInteger}${fraction !== undefined ? decimal + localizedFraction : ''}`
}

/** Strict grouping for paste; ordinary editing can temporarily disturb existing group separators. */
const normalizeLeadingDecimal = (draft: string): string => {
  if (draft.startsWith('.')) return `0${draft}`

  return draft.startsWith('-.') ? `-0${draft.slice(1)}` : draft
}

const translateAmountCharacters = (source: string, options: LumenAmountOptions): string | undefined => {
  const { decimal, group, minus, digits } = amountFormat(options)
  const characters = new Map<string, string>(digits.map((digit, index) => [digit, String(index)]))

  for (let index = 0; index < 10; index += 1) characters.set(String(index), String(index))

  characters.set(decimal, '.')

  characters.set(minus, '-')

  characters.set('-', '-')

  if (group) characters.set(group, '')

  for (const mark of ['\u061c', '\u200e', '\u200f']) characters.set(mark, '')

  let draft = ''

  for (const character of source.trim()) {
    const translated = characters.get(character)

    if (translated === undefined) return undefined

    draft += translated
  }

  return draft
}

const validGrouping = (source: string, draft: string, options: LumenAmountOptions): boolean => {
  const { decimal, group } = amountFormat(options)

  if (!group || !source.includes(group)) return true

  const [integer, fraction = ''] = source.trim().split(decimal)

  return !fraction.includes(group) && integer === formatLumenAmountDraft(draft, options).split(decimal)[0]
}

export const parseLumenAmountDraft = (
  source: string, options: LumenAmountOptions = {}, strictGrouping = true
): string | undefined => {
  if (source.length > amountLimit) return undefined

  const translated = translateAmountCharacters(source, options)

  if (translated === undefined || !validDraft(translated, options)) return undefined

  const draft = normalizeLeadingDecimal(translated)

  if (strictGrouping && !validGrouping(source, draft, options)) return undefined

  return draft
}

export interface LumenAmountFieldController {
  destroy: () => void
  /** Rebind reset handling after moving the existing control to another document or shadow root. */
  refresh: () => void
  setValue: (draft: string) => void
}

const placeAmountCaret = (input: HTMLInputElement, group: string | undefined, logical: number) => {
  let caret = 0
  let count = 0

  while (caret < input.value.length && count < logical) {
    if (input.value[caret] !== group) count += 1

    caret += 1
  }

  input.setSelectionRange(caret, caret)
}

export const createLumenAmountFieldController = (
  root: HTMLElement, onChange?: (detail: LumenAmountChangeDetail) => void
): LumenAmountFieldController => {
  const input = root.querySelector<HTMLInputElement>('[data-ui-amount-input]')
  const submission = root.querySelector<HTMLInputElement>('[data-ui-amount-value]')

  if (!input || !submission) throw new Error('AmountField requires visible and submission inputs.')

  const options: LumenAmountOptions = {
    locale: root.getAttribute('locale') ?? 'en-US',
    fractionDigits: Number(root.getAttribute('fraction-digits') ?? 2),
    allowNegative: root.hasAttribute('allow-negative')
  }

  const initial = root.getAttribute('default-value') ?? root.getAttribute('value') ?? ''
  let draft = root.getAttribute('value') ?? initial
  let composing = false
  let destroyed = false
  let resetTimer: ReturnType<typeof setTimeout> | undefined

  const sync = () => {
    input.value = formatLumenAmountDraft(draft, options)

    submission.value = getLumenAmountValue(draft) ?? ''

    input.setCustomValidity(draft !== '' && getLumenAmountValue(draft) === undefined ? root.getAttribute('invalid-message') ?? 'Enter a complete amount.' : '')
  }

  const group = amountFormat(options).group
  const logicalCount = (text: string) => Array.from(text).filter(character => character !== group).length

  const emitChange = () => {
    const detail: LumenAmountChangeDetail = { draft, value: getLumenAmountValue(draft) }
    const EventType = root.ownerDocument.defaultView?.CustomEvent

    if (EventType) root.dispatchEvent(new EventType<LumenAmountChangeDetail>('ui:amount-change', { bubbles: true, detail }))

    onChange?.(detail)
  }

  const update = (event: Event) => {
    if (composing || input.matches(':disabled') || input.readOnly) return

    const logical = logicalCount(input.value.slice(0, input.selectionStart ?? input.value.length))
    const parsed = parseLumenAmountDraft(input.value, options, 'inputType' in event && event.inputType === 'insertFromPaste')

    if (parsed === undefined) {
      sync()

      input.setCustomValidity(root.getAttribute('invalid-message') ?? 'Enter a valid amount using the displayed locale and precision.')

      return
    }

    draft = parsed

    sync()

    placeAmountCaret(input, group, logical)

    emitChange()
  }

  const startComposition = () => {
    composing = true
  }

  const endComposition = (event: Event) => {
    composing = false

    update(event)
  }

  const reset = (event: Event) => {
    if (event.target !== input.form) return

    clearTimeout(resetTimer)

    resetTimer = setTimeout(() => {
      if (destroyed || event.defaultPrevented || event.target !== input.form) return

      draft = root.getAttribute('default-value') ?? initial

      sync()

      onChange?.({ draft, value: getLumenAmountValue(draft) })
    })
  }

  sync()

  input.addEventListener('input', update)

  input.addEventListener('compositionstart', startComposition)

  input.addEventListener('compositionend', endComposition)

  let eventRoot: Node | undefined

  const refresh = () => {
    const current = input.getRootNode()

    if (destroyed || current === eventRoot) return

    clearTimeout(resetTimer)

    eventRoot?.removeEventListener('reset', reset, { capture: true })

    eventRoot = current

    eventRoot.addEventListener('reset', reset, { capture: true })
  }

  refresh()

  return {
    refresh,
    setValue: value => {
      draft = value

      sync()
    },
    destroy: () => {
      destroyed = true

      clearTimeout(resetTimer)

      input.removeEventListener('input', update)

      input.removeEventListener('compositionstart', startComposition)

      input.removeEventListener('compositionend', endComposition)

      eventRoot?.removeEventListener('reset', reset, { capture: true })
    }
  }
}
