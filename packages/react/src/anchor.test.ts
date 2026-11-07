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

test('Anchor hands focus to a destination and respects cancellation after bubbling', async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  document.body.innerHTML = '<div id="root"></div><h2 id="heading">Heading</h2>'
  const container = document.getElementById('root')
  const target = document.getElementById('heading')
  if (!container || !target) throw new Error('Expected anchor fixture')
  root = createRoot(container)
  act(() => root?.render(createElement(Anchor, { items: [{ href: '#heading', label: 'Heading' }] })))
  const link = container.querySelector('a')
  if (!link) throw new Error('Expected anchor link')
  await act(async () => {
    link.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
    await new Promise(resolve => setTimeout(resolve, 0))
  })
  expect(document.activeElement).toBe(target)
  target.blur()
  document.body.addEventListener('click', event => {
    event.preventDefault()
  }, { once: true })
  await act(async () => {
    link.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
    await new Promise(resolve => setTimeout(resolve, 0))
  })
  expect(document.activeElement).not.toBe(target)
  expect(container.querySelector('nav')?.dataset.uiOwner).toBe('react')
})

test('Anchor uses the rendering document for headings and listeners', async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  const iframe = document.createElement('iframe')
  document.body.append(iframe)
  const owner = iframe.contentDocument
  if (!owner) throw new Error('Expected frame document')
  owner.head.innerHTML = '<base href="about:blank">'
  owner.body.innerHTML = '<div id="root"></div><h2 id="heading">Frame heading</h2>'
  const container = owner.getElementById('root')
  const target = owner.getElementById('heading')
  if (!container || !target) throw new Error('Expected frame fixture')
  root = createRoot(container)
  act(() => root?.render(createElement(Anchor, { items: [{ href: '#heading', label: 'Heading' }] })))
  const link = container.querySelector('a')
  if (!link) throw new Error('Expected frame link')
  await act(async () => {
    link.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
    await new Promise(resolve => setTimeout(resolve, 0))
  })
  expect(owner.activeElement).toBe(target)
})
