// @vitest-environment jsdom
import { act, createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'

import { afterEach, beforeEach, expect, test, vi } from 'vitest'

import { WorldMap } from './world-map.js'

let container: HTMLDivElement
let root: Root

const countries = [
  { id: 'CO', labelX: 300, labelY: 220, name: 'Colombia', path: 'M0 0L10 0L10 10Z' },
  { id: 'JP', labelX: 820, labelY: 140, name: 'Japan', path: 'M20 20L30 20L30 30Z' }
]

beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
})

afterEach(() => {
  act(() => {
    root.unmount()
  })
  container.remove()
})

const path = (id: string): SVGPathElement => {
  const expectedPath = countries.find(country => country.id === id)?.path
  const match = Array.from(container.querySelectorAll<SVGPathElement>('.ui-world-map__country'))
    .find(candidate => candidate.getAttribute('d') === expectedPath)

  if (!match) throw new Error(`Expected a rendered path for country ${id}`)

  return match
}

test('clicking an uncontrolled map selects the country and fires a typed callback', () => {
  const onCountrySelect = vi.fn()

  act(() => {
    root.render(createElement(WorldMap, { countries, label: 'World map', onCountrySelect }))
  })

  act(() => {
    path('CO').dispatchEvent(new MouseEvent('click', { bubbles: true }))
  })

  expect(path('CO').classList.contains('ui-world-map__country--selected')).toBe(true)
  expect(onCountrySelect).toHaveBeenCalledWith({ countryId: 'CO', highlighted: false, label: 'Colombia' })
  expect(container.querySelector('.ui-world-map__inspection')?.textContent).toBe('Colombia')
})

test('a controlled selection persists through re-render and source updates', () => {
  const onCountrySelect = vi.fn()

  act(() => {
    root.render(createElement(WorldMap, {
      countries, label: 'World map', onCountrySelect, selectedCountry: 'CO'
    }))
  })
  expect(path('CO').classList.contains('ui-world-map__country--selected')).toBe(true)

  act(() => {
    path('JP').dispatchEvent(new MouseEvent('click', { bubbles: true }))
  })

  expect(onCountrySelect).toHaveBeenCalledWith({ countryId: 'JP', highlighted: false, label: 'Japan' })
  expect(path('JP').classList.contains('ui-world-map__country--selected')).toBe(false)
  expect(path('CO').classList.contains('ui-world-map__country--selected')).toBe(true)

  act(() => {
    root.render(createElement(WorldMap, {
      countries, label: 'World map', onCountrySelect, selectedCountry: 'JP'
    }))
  })
  expect(path('JP').classList.contains('ui-world-map__country--selected')).toBe(true)
  expect(path('CO').classList.contains('ui-world-map__country--selected')).toBe(false)
})

test('marks highlighted countries, separate from selection, and lists their names', () => {
  act(() => {
    root.render(createElement(WorldMap, { countries, highlightedCountries: ['co'], label: 'World map' }))
  })
  expect(path('CO').classList.contains('ui-world-map__country--highlighted')).toBe(true)
  expect(path('CO').classList.contains('ui-world-map__country--selected')).toBe(false)
  expect(container.querySelector('.ui-world-map__highlights')?.textContent).toContain('Colombia')
})

test('renders markers at projected coordinates', () => {
  act(() => {
    root.render(createElement(WorldMap, {
      countries, label: 'World map', markers: [{ id: 'bogota', label: 'Bogotá', latitude: 4.711, longitude: -74.072 }]
    }))
  })
  const marker = container.querySelector('.ui-world-map__marker')

  expect(marker?.querySelector('title')?.textContent).toBe('Bogotá')
})

test('non-interactive maps omit the select control and ignore clicks', () => {
  const onCountrySelect = vi.fn()

  act(() => {
    root.render(createElement(WorldMap, { countries, interactive: false, label: 'World map', onCountrySelect }))
  })
  expect(container.querySelector('select')).toBeNull()

  act(() => {
    path('CO').dispatchEvent(new MouseEvent('click', { bubbles: true }))
  })
  expect(onCountrySelect).not.toHaveBeenCalled()
})

test('the accessible select control performs the same selection as a click', () => {
  const onCountrySelect = vi.fn()

  act(() => {
    root.render(createElement(WorldMap, { countries, label: 'World map', onCountrySelect }))
  })
  const select = container.querySelector('select')

  if (!select) throw new Error('Expected a select control')

  act(() => {
    select.value = 'JP'
    select.dispatchEvent(new Event('change', { bubbles: true }))
  })
  expect(onCountrySelect).toHaveBeenCalledWith({ countryId: 'JP', highlighted: false, label: 'Japan' })
  expect(path('JP').classList.contains('ui-world-map__country--selected')).toBe(true)
})

test('normalizes selected country codes and clears stale selection after geometry changes', () => {
  act(() => {
    root.render(createElement(WorldMap, { countries, label: 'World map', defaultSelectedCountry: ' jp ' }))
  })
  expect(path('JP').classList.contains('ui-world-map__country--selected')).toBe(true)
  expect(container.querySelector('select')?.value).toBe('JP')
  act(() => {
    root.render(createElement(WorldMap, { countries: countries.filter(country => country.id === 'CO'), label: 'World map' }))
  })
  expect(container.querySelector('.ui-world-map__country--selected')).toBeNull()
  expect(container.querySelector('select')?.value).toBe('')
})

test('enhances zoom controls and keeps zoom through country selection', () => {
  act(() => {
    root.render(createElement(WorldMap, { countries, label: 'Map' }))
  })
  const zoomIn = container.querySelector<HTMLButtonElement>('[data-ui-world-map-zoom="in"]')

  if (!zoomIn) throw new Error('Expected zoom control')

  act(() => {
    zoomIn.click()
  })
  expect(container.querySelector('output')?.value).toBe('150%')
  act(() => {
    path('CO').dispatchEvent(new MouseEvent('click', { bubbles: true }))
  })
  expect(container.querySelector('output')?.value).toBe('150%')
  act(() => {
    root.render(createElement(WorldMap, { countries, label: 'Map', zoomable: false }))
  })
  expect(container.querySelector('[data-ui-world-map-zoom]')).toBeNull()
  expect(container.querySelector<HTMLElement>('[data-ui-world-map-viewport]')?.style.getPropertyValue('--ui-world-map-zoom')).toBe('1')
})
