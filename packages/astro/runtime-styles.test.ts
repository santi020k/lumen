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
