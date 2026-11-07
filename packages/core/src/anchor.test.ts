// @vitest-environment jsdom
import { afterEach, expect, test, vi } from 'vitest'

import { activateLumenAnchor, decodeLumenAnchorFragment, getLumenActiveAnchorIndex } from './anchor.js'

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

const activationFixture = (markup = '<h2 id="destination">Destination</h2>') => {
  document.body.innerHTML = `<a href="#destination">Read</a>${markup}<button>Next</button>`
  const link = document.querySelector('a')
  const target = document.getElementById('destination')
  if (!link || !target) throw new Error('Expected activation fixture')
  return { link, target }
}

test('activation focuses the destination without scrolling and cleans temporary tab order on blur', () => {
  const { link, target } = activationFixture()
  const focus = vi.spyOn(target, 'focus')
  expect(activateLumenAnchor(link, new MouseEvent('click'))).toBe(true)
  expect(document.activeElement).toBe(target)
  expect(focus).toHaveBeenCalledWith({ preventScroll: true })
  expect(target.getAttribute('tabindex')).toBe('-1')
  document.querySelector('button')?.focus()
  expect(target.hasAttribute('tabindex')).toBe(false)
})

test.each(['<h2 id="destination" tabindex="0">Title</h2>', '<h2 id="destination" tabindex="-1">Title</h2>', '<button id="destination">Action</button>'])('preserves authored tab order: %s', markup => {
  const { link, target } = activationFixture(markup)
  const original = target.getAttribute('tabindex')
  expect(activateLumenAnchor(link, new MouseEvent('click'))).toBe(true)
  target.blur()
  expect(target.getAttribute('tabindex')).toBe(original)
})

test('preserves tab order changed by the application while focused', () => {
  const { link, target } = activationFixture()
  activateLumenAnchor(link, new MouseEvent('click'))
  target.tabIndex = 0
  target.blur()
  expect(target.tabIndex).toBe(0)
})

test.each([{ ctrlKey: true }, { metaKey: true }, { altKey: true }, { shiftKey: true }, { button: 1 }])('ignores modified activation %j', options => {
  const { link, target } = activationFixture()
  expect(activateLumenAnchor(link, new MouseEvent('click', options))).toBe(false)
  expect(target.hasAttribute('tabindex')).toBe(false)
})

test('ignores canceled activation, missing destinations, downloads, and other browsing targets', () => {
  const { link, target } = activationFixture()
  const event = new MouseEvent('click', { cancelable: true })
  event.preventDefault()
  expect(activateLumenAnchor(link, event)).toBe(false)
  for (const attribute of ['download', 'target']) {
    link.setAttribute(attribute, '_blank')
    expect(activateLumenAnchor(link, new MouseEvent('click'))).toBe(false)
    link.removeAttribute(attribute)
  }
  link.href = '#missing'
  expect(activateLumenAnchor(link, new MouseEvent('click'))).toBe(false)
  expect(target.hasAttribute('tabindex')).toBe(false)
})

test('removes temporary tab order when the destination cannot receive focus', () => {
  const { link, target } = activationFixture()
  vi.spyOn(target, 'focus').mockImplementation(() => undefined)
  expect(activateLumenAnchor(link, new MouseEvent('click'))).toBe(false)
  expect(target.hasAttribute('tabindex')).toBe(false)
})

test.each(['100%', 'café'])('finds encoded or literal destination %s', id => {
  const { link, target } = activationFixture()
  target.id = id
  link.setAttribute('href', `#${id === 'café' ? encodeURIComponent(id) : id}`)
  expect(activateLumenAnchor(link, new MouseEvent('click'))).toBe(true)
})

test('respects base URL and inherited browsing target', () => {
  const { link } = activationFixture()
  const base = document.createElement('base')
  document.head.append(base)
  try {
    base.target = '_blank'
    expect(activateLumenAnchor(link, new MouseEvent('click'))).toBe(false)
    base.removeAttribute('target')
    base.href = 'https://example.com/elsewhere'
    expect(activateLumenAnchor(link, new MouseEvent('click'))).toBe(false)
  } finally {
    base.remove()
  }
})

test('activation resolves and focuses within the link owner document', () => {
  const iframe = document.createElement('iframe')
  document.body.append(iframe)
  const owner = iframe.contentDocument
  if (!owner) throw new Error('Expected frame document')
  owner.head.innerHTML = '<base href="about:blank">'
  owner.body.innerHTML = '<a href="#destination">Read</a><h2 id="destination">Frame destination</h2>'
  const link = owner.querySelector('a')
  const target = owner.getElementById('destination')
  if (!link || !target) throw new Error('Expected frame fixture')
  expect(activateLumenAnchor(link, new MouseEvent('click'))).toBe(true)
  expect(owner.activeElement).toBe(target)
})

test('ignores unresolved fragments under a non-hierarchical base URL', () => {
  const { link } = activationFixture()
  const base = document.createElement('base')
  base.href = 'mailto:reader@example.com'
  document.head.append(base)
  try {
    expect(activateLumenAnchor(link, new MouseEvent('click'))).toBe(false)
  } finally {
    base.remove()
  }
})

test('ignores empty fragments and disconnected links', () => {
  const { link, target } = activationFixture()
  link.setAttribute('href', '#')
  expect(activateLumenAnchor(link, new MouseEvent('click'))).toBe(false)
  link.setAttribute('href', '#destination')
  link.remove()
  expect(activateLumenAnchor(link, new MouseEvent('click'))).toBe(false)
  expect(target.hasAttribute('tabindex')).toBe(false)
})
