// @vitest-environment jsdom
import { afterEach, expect, test, vi } from 'vitest'

import { initWorldMapControllers } from './runtime/controllers/world-map.js'

afterEach(() => {
  document.body.replaceChildren()
})

const fixture = (interactive = true) => {
  document.body.innerHTML = `<figure data-ui-world-map data-interactive="${interactive}">
    <svg class="ui-world-map__plot">
      <g class="ui-world-map__countries">
        <path class="ui-world-map__country ui-world-map__country--highlighted" data-ui-world-map-country="CO" data-label="Colombia" data-label-x="300" data-label-y="220"></path>
        <path class="ui-world-map__country" data-ui-world-map-country="JP" data-label="Japan" data-label-x="820" data-label-y="140"></path>
      </g>

    </svg>
    <span data-ui-world-map-inspection hidden></span>
    <select data-ui-world-map-select disabled>
      <option value=""></option>
      <option value="CO">Colombia</option>
      <option value="JP">Japan</option>
    </select>
  </figure>`

  const root = document.querySelector<HTMLElement>('[data-ui-world-map]')
  const colombia = document.querySelector<SVGPathElement>('[data-ui-world-map-country="CO"]')
  const japan = document.querySelector<SVGPathElement>('[data-ui-world-map-country="JP"]')
  const label = document.querySelector<HTMLSpanElement>('[data-ui-world-map-inspection]')
  const select = document.querySelector<HTMLSelectElement>('[data-ui-world-map-select]')

  if (!root || !colombia || !japan || !label || !select) throw new Error('Expected world map fixture')

  return { colombia, japan, label, root, select }
}

test('enables the native select and clicking a country dispatches a typed select event', () => {
  const { colombia, label, root, select } = fixture()
  const onSelect = vi.fn()

  root.addEventListener('ui:world-map-select', onSelect)
  initWorldMapControllers(document)
  expect(select.disabled).toBe(false)

  colombia.dispatchEvent(new MouseEvent('click', { bubbles: true }))

  expect(colombia.classList.contains('ui-world-map__country--selected')).toBe(true)
  expect(select.value).toBe('CO')
  expect(label.textContent).toBe('Colombia')
  expect(label.hidden).toBe(false)
  expect(onSelect).toHaveBeenCalledOnce()

  const event: unknown = onSelect.mock.calls[0]?.[0]

  if (!(event instanceof CustomEvent)) throw new Error('Expected a CustomEvent')

  expect(event.detail).toEqual({ countryId: 'CO', highlighted: true, label: 'Colombia' })
})

test('selecting from the native control mirrors clicking the shape and swaps the previous selection', () => {
  const { colombia, japan, select } = fixture()

  initWorldMapControllers(document)
  colombia.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  expect(colombia.classList.contains('ui-world-map__country--selected')).toBe(true)

  select.value = 'JP'
  select.dispatchEvent(new Event('change', { bubbles: true }))

  expect(japan.classList.contains('ui-world-map__country--selected')).toBe(true)
  expect(colombia.classList.contains('ui-world-map__country--selected')).toBe(false)
})

test('hovering shows a transient label and leaving reverts to the current selection', () => {
  const { colombia, japan, label } = fixture()

  initWorldMapControllers(document)
  colombia.dispatchEvent(new MouseEvent('click', { bubbles: true }))

  japan.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }))
  expect(label.textContent).toBe('Japan')

  const group = document.querySelector('.ui-world-map__countries')

  group?.dispatchEvent(new MouseEvent('mouseleave'))
  expect(label.textContent).toBe('Colombia')
})

test('non-interactive maps do not enable the select or select on click', () => {
  const { colombia, select } = fixture(false)

  initWorldMapControllers(document)
  expect(select.disabled).toBe(true)

  colombia.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  expect(colombia.classList.contains('ui-world-map__country--selected')).toBe(false)
})

test('binds once per root: a second init does not duplicate event handling', () => {
  const { colombia, root } = fixture()
  const onSelect = vi.fn()

  root.addEventListener('ui:world-map-select', onSelect)
  initWorldMapControllers(document)
  initWorldMapControllers(document)
  colombia.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  expect(onSelect).toHaveBeenCalledOnce()
})

test('rebinds replaced controls and stops detached shapes from updating the map', () => {
  const { colombia, root } = fixture()
  const onSelect = vi.fn()

  root.addEventListener('ui:world-map-select', onSelect)
  initWorldMapControllers(root)
  const replacement = root.cloneNode(true)

  if (!(replacement instanceof HTMLElement)) throw new Error('Expected cloned map')

  root.replaceChildren(...replacement.childNodes)
  initWorldMapControllers(root)
  const nextSelect = root.querySelector<HTMLSelectElement>('select')

  if (!nextSelect) throw new Error('Expected replacement select')

  nextSelect.value = 'JP'
  nextSelect.dispatchEvent(new Event('change', { bubbles: true }))
  expect(root.querySelector('.ui-world-map__country--selected')?.getAttribute('data-ui-world-map-country')).toBe('JP')
  colombia.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  expect(nextSelect.value).toBe('JP')
  expect(onSelect).toHaveBeenCalledOnce()
})

test('does not interpret country identifiers as CSS selectors', () => {
  const { colombia, select } = fixture()
  const id = 'COUNTRY["custom"]'

  colombia.dataset.uiWorldMapCountry = id
  select.add(new Option('Custom country', id))
  initWorldMapControllers(document)
  select.value = id
  expect(() => select.dispatchEvent(new Event('change', { bubbles: true }))).not.toThrow()
  expect(colombia.classList.contains('ui-world-map__country--selected')).toBe(true)
})
