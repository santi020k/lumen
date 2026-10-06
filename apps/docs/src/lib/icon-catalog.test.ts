// @vitest-environment jsdom
import { afterEach, expect, test, vi } from 'vitest'

import { brandEntries, iconEntries } from '../data/icon-catalogs'

import { createCatalogSvg, filterIconEntries, parseIconEntries } from './icon-catalog'
import { setupIconCatalogs } from './icon-catalog-client'

const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M1 1h2" /></svg>'
const entries = Array.from({ length: 110 }, (_, index) => ({ name: `icon-${index}`, svg, terms: `icon-${index} alias-${index}` }))

test('accepts the generated interface and brand catalogs including aliases and SVG geometry', () => {
  for (const catalog of [iconEntries, brandEntries]) {
    expect(parseIconEntries(catalog)).toHaveLength(catalog.length)

    for (const entry of catalog) expect(createCatalogSvg(entry.svg).localName).toBe('svg')
  }
}, 30000)

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  document.body.replaceChildren()
})

test('searches the full catalog by aliases, case, and whitespace', () => {
  expect(filterIconEntries(entries, ' ALIAS-109 ')).toEqual([entries[109]])
  expect(filterIconEntries(entries, 'missing')).toEqual([])
  expect(filterIconEntries(entries, '')).toHaveLength(110)
})

test('rejects malformed and duplicate entries and active SVG content', () => {
  expect(() => parseIconEntries(null)).toThrow()
  expect(() => parseIconEntries([{ name: 'icon', terms: 1, svg }])).toThrow()
  expect(() => parseIconEntries([entries[0], entries[0]])).toThrow()
  expect(() => createCatalogSvg('<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"/>')).toThrow()
  expect(() => createCatalogSvg('<svg xmlns="http://www.w3.org/2000/svg"><script /></svg>')).toThrow()
  expect(() => createCatalogSvg('<svg xmlns="http://www.w3.org/2000/svg"><path fill="url(https://example.com)" /></svg>')).toThrow()
  expect(createCatalogSvg(svg).querySelector('path')).not.toBeNull()
})

const mount = () => {
  document.body.innerHTML = `<section data-icon-catalog data-icon-source="/icons.json">
    <input data-icon-search disabled><p data-icon-status>Showing 48 of 110 icons</p>
    <p data-icon-empty hidden>No matches</p><div data-icon-grid></div>
    <template data-icon-template><button><span data-icon-art></span><span data-icon-label></span></button></template>
    <button data-icon-more hidden>Show more icons</button></section>`
  const search = document.querySelector('input')
  const more = document.querySelector<HTMLButtonElement>('[data-icon-more]')

  if (!search || !more) throw new Error('Missing test controls.')

  setupIconCatalogs()
  setupIconCatalogs()

  return { more, search }
}

test('loads on demand, shares pending requests, searches beyond the first page, and resets pagination', async () => {
  const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify(entries)))

  vi.stubGlobal('fetch', fetcher)

  const { more, search } = mount()

  expect(fetcher).not.toHaveBeenCalled()
  expect(search.disabled).toBe(false)
  search.value = 'alias-109'
  search.dispatchEvent(new Event('input'))
  search.value = 'ALIAS-108'
  search.dispatchEvent(new Event('input'))
  await vi.waitFor(() => {
    expect(document.querySelector('[data-icon-name]')?.getAttribute('data-icon-name')).toBe('icon-108')
  })
  expect(fetcher).toHaveBeenCalledTimes(1)
  expect(more.hidden).toBe(true)
  search.value = ''
  search.dispatchEvent(new Event('input'))
  await vi.waitFor(() => {
    expect(document.querySelectorAll('[data-icon-name]')).toHaveLength(48)
  })
  more.click()
  await vi.waitFor(() => {
    expect(document.querySelectorAll('[data-icon-name]')).toHaveLength(96)
  })
  more.click()
  await vi.waitFor(() => {
    expect(document.querySelectorAll('[data-icon-name]')).toHaveLength(110)
  })
  expect(more.hidden).toBe(true)
  search.value = 'no-such-icon'
  search.dispatchEvent(new Event('input'))
  await vi.waitFor(() => {
    expect(document.querySelectorAll('[data-icon-name]')).toHaveLength(0)
  })
  expect(document.querySelector('[data-icon-empty]')?.hasAttribute('hidden')).toBe(false)
}, 15000)

test('recovers from network failures and reports blocked clipboard access', async () => {
  const fetcher = vi.fn().mockRejectedValueOnce(new Error('Offline')).mockResolvedValueOnce(new Response(JSON.stringify(entries)))

  vi.stubGlobal('fetch', fetcher)
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: vi.fn().mockRejectedValue(new Error('Blocked')) } })

  const { more } = mount()

  more.click()
  await vi.waitFor(() => {
    expect(more.textContent).toBe('Retry loading icons')
  })
  expect(more.disabled).toBe(false)
  more.click()
  await vi.waitFor(() => {
    expect(document.querySelectorAll('[data-icon-name]')).toHaveLength(48)
  })
  document.querySelector<HTMLButtonElement>('[data-icon-name]')?.click()
  await vi.waitFor(() => {
    expect(document.querySelector('[data-icon-status]')?.textContent).toContain('Could not copy. Icon name: icon-0')
  })
})
