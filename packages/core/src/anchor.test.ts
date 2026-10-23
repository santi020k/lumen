// @vitest-environment jsdom
import { afterEach, expect, test, vi } from 'vitest'

import { decodeLumenAnchorFragment, getLumenActiveAnchorIndex } from './anchor.js'

afterEach(() => {
  document.body.replaceChildren()
  document.documentElement.removeAttribute('style')
  vi.restoreAllMocks()
})

const fixture = (tops = [-200, 200, 600]) => {
  vi.spyOn(document.documentElement, 'scrollHeight', 'get').mockReturnValue(2400)
  vi.spyOn(document.documentElement, 'clientHeight', 'get').mockReturnValue(800)
  vi.spyOn(document.documentElement, 'scrollTop', 'get').mockReturnValue(300)
  return tops.map(top => {
    const heading = document.createElement('h2')
    document.body.append(heading)
    vi.spyOn(heading, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, top, 100, 40))
    return heading
  })
}

test('empty targets have no active index', () => {
  expect(getLumenActiveAnchorIndex([])).toBe(-1)
})

test.each([
  ['100%', '100%'],
  ['invalid%g', 'invalid%g'],
  ['caf%C3%A9', 'café']
])('decodes fragment %s safely', (fragment, expected) => {
  expect(decodeLumenAnchorFragment(fragment)).toBe(expected)
})

test.each(['160px', '20%'])('matches native scroll padding %s plus target margin', padding => {
  const targets = fixture()
  document.documentElement.style.scrollPaddingTop = padding
  for (const target of targets) target.style.scrollMarginTop = '40px'
  expect(getLumenActiveAnchorIndex(targets, 96)).toBe(1)
})

test('uses each heading margin and refreshes styles after text or responsive layout changes', () => {
  const targets = fixture()
  document.documentElement.style.scrollPaddingTop = '100px'
  expect(getLumenActiveAnchorIndex(targets, 96)).toBe(0)
  const second = targets[1]
  if (!second) throw new Error('Expected second heading')
  second.style.scrollMarginTop = '100px'
  expect(getLumenActiveAnchorIndex(targets, 96)).toBe(1)
  second.style.scrollMarginTop = '20px'
  expect(getLumenActiveAnchorIndex(targets, 96)).toBe(0)
  document.documentElement.style.scrollPaddingTop = '180px'
  expect(getLumenActiveAnchorIndex(targets, 96)).toBe(1)
})

test('retains an explicit activation offset beyond the native landing line', () => {
  const targets = fixture()
  document.documentElement.style.scrollPaddingTop = '80px'
  expect(getLumenActiveAnchorIndex(targets, 200)).toBe(1)
})

test.each([Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY, -100])('handles invalid or negative offset %s', offset => {
  const targets = fixture()
  expect(getLumenActiveAnchorIndex(targets, offset)).toBe(0)
})

test('tolerates one CSS pixel of native fragment rounding without selecting the next heading early', () => {
  expect(getLumenActiveAnchorIndex(fixture([-200, 200.9, 202]), 200)).toBe(1)
})

test('keeps the first heading on a page that cannot scroll', () => {
  const targets = fixture([20, 200, 600])
  vi.spyOn(document.documentElement, 'scrollHeight', 'get').mockReturnValue(800)
  vi.spyOn(document.documentElement, 'scrollTop', 'get').mockReturnValue(0)
  expect(getLumenActiveAnchorIndex(targets, 96)).toBe(0)
})

test('marks the final heading at the end of a scrollable page', () => {
  const targets = fixture()
  vi.spyOn(document.documentElement, 'scrollTop', 'get').mockReturnValue(1599.5)
  expect(getLumenActiveAnchorIndex(targets, 96)).toBe(2)
})

test('does not treat the top of a page with one pixel of overflow as the document end', () => {
  const targets = fixture([20, 200, 600])
  vi.spyOn(document.documentElement, 'scrollHeight', 'get').mockReturnValue(801)
  vi.spyOn(document.documentElement, 'scrollTop', 'get').mockReturnValue(0)
  expect(getLumenActiveAnchorIndex(targets, 96)).toBe(0)
  vi.spyOn(document.documentElement, 'scrollTop', 'get').mockReturnValue(1)
  expect(getLumenActiveAnchorIndex(targets, 96)).toBe(2)
})
