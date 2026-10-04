export interface LumenMentionsSelection { start: number, end: number }
export interface LumenMentionsValue { text: string, selection: LumenMentionsSelection }
export interface LumenMentionOption { id: string, label: string, value: string, disabled?: boolean }
export interface LumenMentionQuery { start: number, end: number, query: string, trigger: string }

const word = (unit: string): boolean => (
  (unit >= 'a' && unit <= 'z') || (unit >= 'A' && unit <= 'Z') ||
  (unit >= '0' && unit <= '9') || unit === '_'
)

const boundary = (unit: string): boolean => ' \t\n\r\v\f([{"\',;:!?'.includes(unit)

const surrogateBoundary = (text: string, offset: number): boolean => {
  const before = text.charCodeAt(offset - 1)
  const after = text.charCodeAt(offset)

  return !(before >= 0xD800 && before <= 0xDBFF && after >= 0xDC00 && after <= 0xDFFF)
}

export const isLumenMentionsSelectionValid = ({ text, selection }: LumenMentionsValue): boolean => (
  Number.isInteger(selection.start) && Number.isInteger(selection.end) && selection.start >= 0 &&
  selection.end >= selection.start && selection.end <= text.length &&
  surrogateBoundary(text, selection.start) && surrogateBoundary(text, selection.end)
)

const validTrigger = (trigger: string): boolean => {
  if (!trigger.length || trigger.length > 8) return false

  for (const unit of trigger) if (unit < '!' || unit > '~' || word(unit)) return false

  return true
}

const queryable = (value: LumenMentionsValue): boolean => (
  isLumenMentionsSelectionValid(value) && value.selection.start === value.selection.end
)

const tokenMatches = (text: string, start: number, tokenStart: number, trigger: string): boolean => (
  tokenStart >= 0 && text.slice(tokenStart, start) === trigger &&
  (tokenStart === 0 || boundary(text[tokenStart - 1] ?? ''))
)

export const resolveLumenMentionQuery = (value: LumenMentionsValue, trigger = '@'): LumenMentionQuery | null => {
  if (!queryable(value) || !validTrigger(trigger)) {
    return null
  }

  const end = value.selection.start
  let start = end

  while (start > 0 && word(value.text[start - 1] ?? '')) start--

  const tokenStart = start - trigger.length

  if (!tokenMatches(value.text, start, tokenStart, trigger)) return null

  return { start: tokenStart, end, query: value.text.slice(start, end).toLowerCase(), trigger }
}

const optionValid = (option: LumenMentionOption): boolean => {
  if (!option.id.length || !option.value.length || option.value.length > 128) return false

  for (const unit of option.value) if (!word(unit)) return false

  return true
}

export const filterLumenMentionOptions = (
  options: readonly LumenMentionOption[], query: LumenMentionQuery | null
): readonly LumenMentionOption[] => {
  if (!query) return []

  const used = new Set<string>()

  return options.filter(option => {
    if (!optionValid(option) || used.has(option.id)) return false

    used.add(option.id)

    return option.value.toLowerCase().startsWith(query.query)
  })
}

/** Revalidates the active token and preserves every UTF-16 unit after the caret. */
export const insertLumenMention = (
  value: LumenMentionsValue, option: LumenMentionOption, trigger = '@'
): LumenMentionsValue | null => {
  const query = resolveLumenMentionQuery(value, trigger)

  if (!query || option.disabled || !optionValid(option) ||
    !option.value.toLowerCase().startsWith(query.query)) return null

  const before = value.text.slice(0, query.start) + trigger + option.value + ' '

  return { text: before + value.text.slice(query.end), selection: { start: before.length, end: before.length } }
}
