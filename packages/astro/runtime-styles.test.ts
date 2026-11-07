// @vitest-environment jsdom
import { expect, test } from 'vitest'

import { loadRuntimeStylesheet } from './runtime/styles.js'

test('runtime styles share in-flight requests and retain loaded links', async () => {
  const owner = document.implementation.createHTMLDocument()
  const first = loadRuntimeStylesheet(owner, '/toast.css')

  expect(loadRuntimeStylesheet(owner, '/toast.css')).toBe(first)
  expect(owner.querySelectorAll('link')).toHaveLength(1)
  owner.querySelector('link')?.dispatchEvent(new Event('load'))
  await first
  expect(loadRuntimeStylesheet(owner, '/toast.css')).toBe(first)
})

test('failed stylesheet requests remove the link and can retry', async () => {
  const owner = document.implementation.createHTMLDocument()
  const first = loadRuntimeStylesheet(owner, '/toast.css')
  const failure = first.catch((error: unknown) => error)

  owner.querySelector('link')?.dispatchEvent(new Event('error'))
  expect(await failure).toEqual(new Error('Lumen runtime styles failed to load. Reload to request the current deployment assets.'))
  expect(owner.querySelector('link')).toBeNull()
  const retry = loadRuntimeStylesheet(owner, '/toast.css')

  expect(retry).not.toBe(first)
  owner.querySelector('link')?.dispatchEvent(new Event('load'))
  await retry
})

test('Astro swaps retain a single loaded stylesheet without loading absent features', async () => {
  const owner = document.implementation.createHTMLDocument()
  const next = document.implementation.createHTMLDocument()
  const request = loadRuntimeStylesheet(owner, '/toast.css')

  owner.querySelector('link')?.dispatchEvent(new Event('load'))
  await request
  owner.dispatchEvent(Object.assign(new Event('astro:before-swap'), { newDocument: next }))
  expect(next.head.querySelectorAll('link')).toHaveLength(1)
  expect(next.head.querySelector('link')?.getAttribute('href')).toBe('/toast.css')
  owner.dispatchEvent(Object.assign(new Event('astro:before-swap'), { newDocument: next }))
  expect(next.head.querySelectorAll('link')).toHaveLength(1)
  expect(owner.head.querySelectorAll('link')).toHaveLength(1)
  expect(loadRuntimeStylesheet(owner, '/toast.css')).toBe(request)
})
