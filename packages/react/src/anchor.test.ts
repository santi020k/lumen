// @vitest-environment jsdom
import { act, createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'

import { afterEach, expect, test, vi } from 'vitest'

import { Anchor } from './components.js'

let root: Root | undefined

afterEach(() => {
  act(() => root?.unmount())
  document.body.replaceChildren()
  document.documentElement.removeAttribute('style')
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

test.each([
  { height: 800, top: 0, padding: '', expected: '#first' },
  { height: 801, top: 0, padding: '', expected: '#first' },
  { height: 2000, top: 300, padding: '20%', expected: '#100%', targetId: '100%' },
  { height: 2000, top: 300, padding: '20%', expected: '#last' },
  { height: 2000, top: 1200, padding: '', expected: '#last' }
])('Anchor selects $expected at scroll position $top with padding $padding', ({ height, top, padding, expected, targetId = 'last' }) => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  document.body.innerHTML = '<div id="root"></div><h2 id="first">First</h2><h2 id="last">Last</h2>'
  const container = document.getElementById('root')
  if (!container) throw new Error('Expected root')
  vi.spyOn(document.documentElement, 'scrollHeight', 'get').mockReturnValue(height)
  vi.spyOn(document.documentElement, 'clientHeight', 'get').mockReturnValue(800)
  vi.spyOn(document.documentElement, 'scrollTop', 'get').mockReturnValue(top)
  document.documentElement.style.scrollPaddingTop = padding
  for (const [index, heading] of [...document.querySelectorAll('h2')].entries()) {
    heading.style.scrollMarginTop = '40px'
    vi.spyOn(heading, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, index * 200, 100, 40))
  }
  const last = document.getElementById('last')
  if (last) last.id = targetId
  root = createRoot(container)
  act(() => root?.render(createElement(Anchor, {
    items: [{ href: '#invalid%g', label: 'Missing' }, { href: '#first', label: 'First' }, { href: `#${targetId}`, label: 'Last' }]
  })))
  expect(container.querySelector('[aria-current="location"]')?.getAttribute('href')).toBe(expected)
})
