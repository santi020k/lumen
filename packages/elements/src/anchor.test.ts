// @vitest-environment jsdom
import { afterEach, expect, test } from 'vitest'

import { defineLumenElements } from './define.js'

afterEach(() => {
  document.body.replaceChildren()
})

test('Anchor focuses local destinations and respects canceled activation', async () => {
  defineLumenElements()
  document.body.innerHTML = '<h2 id="heading">Heading</h2><lumen-anchor><a href="#heading">Heading</a></lumen-anchor>'
  const link = document.querySelector('a')
  const target = document.getElementById('heading')
  if (!link || !target) throw new Error('Expected anchor fixture')
  link.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
  await new Promise(resolve => setTimeout(resolve, 0))
  expect(document.activeElement).toBe(target)
  target.blur()
  document.body.addEventListener('click', event => {
    event.preventDefault()
  }, { once: true })
  link.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
  await new Promise(resolve => setTimeout(resolve, 0))
  expect(document.activeElement).not.toBe(target)
  window.dispatchEvent(new Event('scroll'))
  expect(document.activeElement).not.toBe(target)
})

test('Anchor uses its owner document after being moved into a frame', async () => {
  defineLumenElements()
  const iframe = document.createElement('iframe')
  document.body.append(iframe)
  const owner = iframe.contentDocument
  if (!owner) throw new Error('Expected frame document')
  owner.head.innerHTML = '<base href="about:blank">'
  owner.body.innerHTML = '<h2 id="heading">Frame heading</h2>'
  const anchor = document.createElement('lumen-anchor')
  anchor.innerHTML = '<a href="#heading">Heading</a>'
  owner.body.append(anchor)
  const link = anchor.querySelector('a')
  const target = owner.getElementById('heading')
  if (!link || !target) throw new Error('Expected frame fixture')
  link.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
  await new Promise(resolve => setTimeout(resolve, 0))
  expect(owner.activeElement).toBe(target)
})
