import { describe, expect, test, vi } from 'vitest'

import type { DocsSearchItem } from './docs-search'
import { createDocsSearchIndexLoader, isDocsSearchItem, parseDocsSearchIndex } from './docs-search-loader'

const validItem: DocsSearchItem = {
  category: 'Forms',
  description: 'Button documentation',
  href: '/docs/button',
  keywords: 'button action control',
  title: 'Button',
  type: 'Component'
}

const jsonResponse = (payload: unknown): Response => new Response(JSON.stringify(payload), {
  headers: { 'content-type': 'application/json' },
  status: 200
})

const failedResponse = (status: number): Response => new Response(null, { status })

describe('isDocsSearchItem', () => {
  test('accepts a value with every required string field and a known type', () => {
    expect(isDocsSearchItem(validItem)).toBe(true)
  })

  test.each([
    ['null', null],
    ['an array', [validItem]],
    ['a missing field', { ...validItem, href: undefined }],
    ['a non-string field', { ...validItem, title: 42 }],
    ['an unknown type', { ...validItem, type: 'Page' }]
  ])('rejects %s', (_name, value) => {
    expect(isDocsSearchItem(value)).toBe(false)
  })
})

describe('parseDocsSearchIndex', () => {
  test('returns the array when every item matches the DocsSearchItem shape', () => {
    expect(parseDocsSearchIndex([validItem])).toEqual([validItem])
  })

  test.each([
    ['a non-array payload', { items: [validItem] }],
    ['an array with one malformed item', [validItem, { ...validItem, category: undefined }]]
  ])('throws for %s', (_name, payload) => {
    expect(() => parseDocsSearchIndex(payload)).toThrow(TypeError)
  })
})

describe('createDocsSearchIndexLoader', () => {
  test('caches and shares a single successful request across concurrent and later callers', async () => {
    const fetchIndex = vi.fn(() => Promise.resolve(jsonResponse([validItem])))
    const loader = createDocsSearchIndexLoader(fetchIndex)

    const [first, second] = await Promise.all([loader.load(), loader.load()])

    expect(first).toEqual([validItem])
    expect(second).toEqual([validItem])
    expect(fetchIndex).toHaveBeenCalledTimes(1)

    await loader.load()

    expect(fetchIndex).toHaveBeenCalledTimes(1)
  })

  test('dedupes concurrent callers while a request is in flight', async () => {
    let resolveFetch: ((response: Response) => void) | undefined
    const fetchIndex = vi.fn(() => new Promise<Response>(resolve => {
      resolveFetch = resolve
    }))
    const loader = createDocsSearchIndexLoader(fetchIndex)

    const first = loader.load()
    const second = loader.load()

    expect(fetchIndex).toHaveBeenCalledTimes(1)

    resolveFetch?.(jsonResponse([validItem]))

    await expect(first).resolves.toEqual([validItem])
    await expect(second).resolves.toEqual([validItem])
  })

  test('retries after an HTTP failure instead of caching the failure', async () => {
    const fetchIndex = vi.fn<() => Promise<Response>>()
      .mockResolvedValueOnce(failedResponse(503))
      .mockResolvedValueOnce(jsonResponse([validItem]))
    const loader = createDocsSearchIndexLoader(fetchIndex)

    await expect(loader.load()).rejects.toThrow('503')
    await expect(loader.load()).resolves.toEqual([validItem])
    expect(fetchIndex).toHaveBeenCalledTimes(2)
  })

  test('retries after a network failure instead of caching the failure', async () => {
    const fetchIndex = vi.fn<() => Promise<Response>>()
      .mockRejectedValueOnce(new Error('network down'))
      .mockResolvedValueOnce(jsonResponse([validItem]))
    const loader = createDocsSearchIndexLoader(fetchIndex)

    await expect(loader.load()).rejects.toThrow('network down')
    await expect(loader.load()).resolves.toEqual([validItem])
    expect(fetchIndex).toHaveBeenCalledTimes(2)
  })

  test('retries after an invalid JSON payload instead of caching the failure', async () => {
    const invalidJsonResponse = new Response('{not valid json', {
      headers: { 'content-type': 'application/json' },
      status: 200
    })
    const fetchIndex = vi.fn<() => Promise<Response>>()
      .mockResolvedValueOnce(invalidJsonResponse)
      .mockResolvedValueOnce(jsonResponse([validItem]))
    const loader = createDocsSearchIndexLoader(fetchIndex)

    await expect(loader.load()).rejects.toThrow(SyntaxError)
    await expect(loader.load()).resolves.toEqual([validItem])
    expect(fetchIndex).toHaveBeenCalledTimes(2)
  })

  test('retries after a payload that does not match the DocsSearchItem shape', async () => {
    const fetchIndex = vi.fn<() => Promise<Response>>()
      .mockResolvedValueOnce(jsonResponse([{ title: 'Incomplete' }]))
      .mockResolvedValueOnce(jsonResponse([validItem]))
    const loader = createDocsSearchIndexLoader(fetchIndex)

    await expect(loader.load()).rejects.toThrow(TypeError)
    await expect(loader.load()).resolves.toEqual([validItem])
    expect(fetchIndex).toHaveBeenCalledTimes(2)
  })
})
