import { afterEach, expect, test, vi } from 'vitest'

import { defineLumenWorldMap, LumenWorldMapElement } from './components/world-map.js'

defineLumenWorldMap()

const countries = [
  { id: 'CO', labelX: 300, labelY: 220, name: 'Colombia', path: 'M0 0L10 0L10 10Z' },
  { id: 'JP', labelX: 820, labelY: 140, name: 'Japan', path: 'M20 0L30 0L30 10Z' }
]

const fixture = () => {
  const map = document.createElement('lumen-world-map')

  if (!(map instanceof LumenWorldMapElement)) throw new Error('Expected registered map')

  map.countries = countries
  map.highlightedCountries = ['co']
  map.setAttribute('label', 'Destinations')
  document.body.append(map)

  return map
}

afterEach(() => {
  document.body.replaceChildren()
})

test('renders explicit geometry with unique pattern ids and accessible country names', () => {
  const first = fixture()
  const second = fixture()

  expect(first.querySelector('[role="img"]')?.getAttribute('aria-label')).toBe('Destinations')
  expect(first.querySelector('.ui-world-map__highlights')?.textContent).toBe('Colombia')
  expect(first.querySelector('pattern')?.id).not.toBe(second.querySelector('pattern')?.id)
})

test('country clicks and the keyboard chooser share the reflected selection event', () => {
  const map = fixture()
  const listener = vi.fn()

  map.addEventListener('ui:world-map-select', listener)
  map.querySelector('[data-country="CO"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  expect(map.selectedCountry).toBe('CO')
  expect(map.querySelector('.ui-world-map__inspection')?.textContent).toBe('Colombia')
  const select = map.querySelector('select')

  if (!select) throw new Error('Expected country chooser')

  select.focus()
  select.value = 'JP'
  select.dispatchEvent(new Event('change'))
  expect(map.querySelector('.ui-world-map__selection')?.getAttribute('d')).toBe(map.querySelector('[data-country="JP"]')?.getAttribute('d'))
  expect(map.selectedCountry).toBe('JP')
  expect(document.activeElement).toBe(select)
  expect(listener).toHaveBeenCalledTimes(2)
  const event: unknown = listener.mock.calls[1]?.[0]

  if (!(event instanceof CustomEvent)) throw new Error('Expected select event')

  expect(event.detail).toEqual({ countryId: 'JP', highlighted: false, label: 'Japan' })
})

test('malformed JSON and invalid records degrade to an empty map without injecting HTML', () => {
  const map = fixture()

  map.setAttribute('countries', '{broken')
  expect(map.countries).toEqual([])
  map.setAttribute('countries', JSON.stringify([null, {}, countries[0], countries[0]]))
  expect(map.countries).toHaveLength(1)
  map.labels = { CO: '<img src=x onerror=alert(1)>' }
  expect(map.querySelector('img')).toBeNull()
  expect(map.querySelector('title')?.textContent).toContain('<img')
})

test('updates geometry, labels, markers and selection through properties and attributes', () => {
  const map = fixture()

  map.selectedCountry = ' jp '
  map.labels = { JP: '日本' }
  map.markers = [{ id: 'tokyo', label: 'Tokyo', latitude: 35.68, longitude: 139.69 }]
  expect(map.querySelector('select')?.value).toBe('JP')
  expect(map.querySelector('.ui-world-map__inspection')?.textContent).toBe('日本')
  expect(map.querySelector('[aria-label="Map markers"]')?.textContent).toBe('Tokyo')
  map.countries = countries.filter(country => country.id === 'CO')
  expect(map.selectedCountry).toBe('')
  expect(map.querySelector('.ui-world-map__country--selected')).toBeNull()
})

test('reconnects without duplicate listeners and aborts detached controls', () => {
  const map = fixture()
  const listener = vi.fn()
  const detached = map.querySelector('[data-country="JP"]')

  map.addEventListener('ui:world-map-select', listener)
  map.remove()
  document.body.append(map)
  detached?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  expect(map.selectedCountry).toBe('')
  map.querySelector('[data-country="JP"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  expect(listener).toHaveBeenCalledOnce()
})

test('noninteractive solid maps retain highlights and suppress country selection', () => {
  const map = fixture()

  map.setAttribute('interactive', 'false')
  map.setAttribute('variant', 'solid')
  expect(map.querySelector('select')).toBeNull()
  expect(map.querySelector('pattern')).toBeNull()
  map.querySelector('[data-country="JP"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  expect(map.selectedCountry).toBe('')
  expect(map.querySelector('.ui-world-map__highlights')?.textContent).toBe('Colombia')
})

test('zoom controls work independently of country selection and can be disabled', () => {
  const map = fixture()

  map.querySelector<HTMLButtonElement>('[data-ui-world-map-zoom="in"]')?.click()
  expect(map.querySelector('output')?.value).toBe('150%')
  map.selectedCountry = 'JP'
  expect(map.querySelector('output')?.value).toBe('150%')
  map.setAttribute('zoomable', 'false')
  expect(map.querySelector('[data-ui-world-map-zoom]')).toBeNull()
})
