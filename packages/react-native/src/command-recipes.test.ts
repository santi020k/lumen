import { expect, test } from 'vitest'

import { isLumenCommandGroupsValid, type LumenCommandGroup, lumenCommandGroups, moveLumenCommandActive, resolveLumenCommandActive } from './command-recipes.js'
const groups: readonly LumenCommandGroup[] = [
  { id: 'navigation',
    label: 'Navigation',
    items: [
      { id: 'docs', label: 'Documentation', detail: 'Read guides', keywords: ['manual'], shortcut: 'Ctrl+D' },
      { id: 'blocked', label: 'Disabled', disabled: true }
    ] },
  { id: 'actions', label: 'Actions', items: [{ id: 'theme', label: 'Toggle theme' }] }
]
test('case-insensitive substring filtering retains groups/order and matches host synonyms', () => {
  for (const query of [' DOCUMENT ', 'guides', 'manual', 'ctrl+d']) {
    expect(lumenCommandGroups(groups, query)?.map(group => group.items.map(item => item.id))).toEqual([['docs']])
  }
  expect(lumenCommandGroups(groups, 'missing')).toEqual([])
  expect(groups[0]?.items).toHaveLength(2)
})
test('navigation wraps enabled commands, boundaries work, stale/disabled IDs cannot activate', () => {
  expect(moveLumenCommandActive(groups, '', null, 'next')).toBe('docs')
  expect(moveLumenCommandActive(groups, '', null, 'previous')).toBe('theme')
  expect(moveLumenCommandActive(groups, '', 'docs', 'next')).toBe('theme')
  expect(moveLumenCommandActive(groups, '', 'theme', 'next')).toBe('docs')
  expect(moveLumenCommandActive(groups, '', 'docs', 'previous')).toBe('theme')
  expect(moveLumenCommandActive(groups, '', 'docs', 'last')).toBe('theme')
  expect(moveLumenCommandActive(groups, '', 'theme', 'first')).toBe('docs')
  expect(resolveLumenCommandActive(groups, 'theme', 'docs')).toBeNull()
  expect(resolveLumenCommandActive(groups, '', 'blocked')).toBeNull()
  expect(resolveLumenCommandActive(groups, '', 'unknown')).toBeNull()
  expect(moveLumenCommandActive(groups, 'Disabled', null, 'next')).toBeNull()
})
test('identity is validated before filtering and handles large literal queries without regex', () => {
  for (const input of [[...groups, groups[0] ?? { id: 'navigation', label: '', items: [] }], [{ id: ' ', label: 'Blank', items: [] }], [{ id: 'a', label: 'A', items: [{ id: 'x', label: 'X' }] }, { id: 'b', label: 'B', items: [{ id: 'x', label: 'Duplicate' }] }]]) {
    expect(isLumenCommandGroupsValid(input)).toBe(false)
    expect(lumenCommandGroups(input, 'missing')).toBeNull()
  }
  expect(lumenCommandGroups(groups, '('.repeat(100000))).toEqual([])
  expect(lumenCommandGroups([], '')).toEqual([])
})

test('rejects decoded groups, nested items and searchable fields without throwing', () => {
  const malformed: unknown[] = [null,
    42,
    [],
    {},
    { id: null, label: '', items: [] },
    { id: 'g', label: null, items: [] },
    { id: 'g', label: '', items: null },
    ...[null,
      42,
      {},
      { id: null, label: '' },
      { id: 'a', label: 42 },
      { id: 'a', label: '', detail: 42 },
      { id: 'a', label: '', shortcut: {} },
      { id: 'a', label: '', keywords: 'word' },
      { id: 'a', label: '', keywords: [null] },
      { id: 'a', label: '', keywords: new Array<unknown>(1) }]
      .map(item => ({ id: 'g', label: '', items: [item] }))]

  for (const input of [...malformed.map(group => [group]), null, {}, 'groups', new Array<unknown>(1)]) {
    expect(Reflect.apply(isLumenCommandGroupsValid, undefined, [input])).toBe(false)
    expect(Reflect.apply(lumenCommandGroups, undefined, [input, 'a'])).toBeNull()
  }
})
