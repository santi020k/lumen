import { expect, test } from 'vitest'

import { filterDataRecords, parseDataViewState, sortDataRecords } from './data.js'

test.each([
  ['__proto__', '[object Object]'],
  ['constructor', String(Object)],
  ['toString', Object.prototype.toString.toString()],
  ['valueOf', Object.prototype.valueOf.toString()]
])('filters ignore inherited %s but retain explicitly owned fields', (key, value) => {
  const inherited = { id: 'inherited' }
  const owned = { id: 'owned', [key]: value }
  const state = parseDataViewState(new URLSearchParams({ [`filter.${key}`]: value }).toString())

  expect(filterDataRecords([inherited, owned], state)).toEqual([owned])
})

test.each(['__proto__', 'constructor', 'toString', 'valueOf'])('sorting treats inherited %s as missing without changing owned values', key => {
  const inherited = { id: 'inherited' }
  const owned = { id: 'owned', [key]: 'a' }
  const records = [owned, inherited]

  Object.setPrototypeOf(inherited, { [key]: 'z' })

  expect(sortDataRecords(records, { key, direction: 'asc' })).toEqual([inherited, owned])
  expect(sortDataRecords(records, { key, direction: 'desc' })).toEqual([owned, inherited])
  expect(records).toEqual([owned, inherited])
})
