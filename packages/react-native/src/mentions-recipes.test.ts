import { expect, test } from 'vitest'

import { filterLumenMentionOptions, insertLumenMention, isLumenMentionsSelectionValid,
  type LumenMentionsValue, resolveLumenMentionQuery } from './mentions-recipes.js'

const value = (text: string, start = text.length, end = start): LumenMentionsValue => (
  { text, selection: { start, end } }
)
const alice = { id: 'alice', label: 'Alice 🐈', value: 'alice' }

test('finds bounded ASCII tokens, custom prefixes and preserves the entire suffix', () => {
  expect(resolveLumenMentionQuery(value('Hello @AL tail', 9))).toEqual({ start: 6, end: 9, query: 'al', trigger: '@' })
  expect(insertLumenMention(value('😀 @al!', 6), alice)).toEqual(value('😀 @alice !', 10))
  expect(resolveLumenMentionQuery(value('alice@bo'))).toBeNull()
  expect(resolveLumenMentionQuery(value('x (@bo'))?.query).toBe('bo')
  expect(resolveLumenMentionQuery(value('Hi ::al'), '::')?.query).toBe('al')
  for (const trigger of ['', 'a', '123456789', '🧡']) expect(resolveLumenMentionQuery(value('@al'), trigger)).toBeNull()
  expect(resolveLumenMentionQuery(value('@ál'))).toBeNull()
})

test('rejects invalid UTF-16 ranges without repairing host state', () => {
  for (const input of [value('😀 @al', 1),
    value('@al', -1),
    value('@al', 1, 4),
    value('@al', 2, 1),
    value('@al', Number.NaN),
    value('@al', 1.5)]) {
    const before = structuredClone(input)
    expect(isLumenMentionsSelectionValid(input)).toBe(false)
    expect(resolveLumenMentionQuery(input)).toBeNull()
    expect(insertLumenMention(input, alice)).toBeNull()
    expect(input).toEqual(before)
  }
  expect(resolveLumenMentionQuery(value('@al', 1, 3))).toBeNull()
  expect(isLumenMentionsSelectionValid(value('😀 @al', 2))).toBe(true)
})

test('filters host options with deterministic identity, guards disabled/stale insertions and linear long input', () => {
  const query = resolveLumenMentionQuery(value('@al'))
  const disabled = { id: 'archived', label: 'Archived', value: 'albert', disabled: true }
  const options = [alice,
    { ...alice, value: 'alex' },
    disabled,
    { id: 'bad', label: 'Bad', value: 'alice smith' },
    { id: '', label: 'Bad', value: 'alice' },
    { id: 'long', label: 'Long', value: 'a'.repeat(129) }]
  expect(filterLumenMentionOptions(options, query)).toEqual([alice, disabled])
  expect(insertLumenMention(value('@al'), disabled)).toBeNull()
  expect(insertLumenMention(value('@bo'), alice)).toBeNull()
  expect(filterLumenMentionOptions(options, null)).toEqual([])
  expect(resolveLumenMentionQuery(value('a'.repeat(1_000_000)))).toBeNull()
})
