// @vitest-environment jsdom
import { afterEach, beforeAll, expect, test } from 'vitest'

import {
  defineLumenFoundations,
  LumenSkeletonElement,
  LumenSpinnerElement
} from './components/foundations.js'
import {
  LumenSkeletonElement as CatalogSkeletonElement,
  LumenSpinnerElement as CatalogSpinnerElement
} from './define.js'

const create = (tagName: 'lumen-skeleton' | 'lumen-spinner', attributes: Record<string, string> = {}): HTMLElement => {
  const element = document.createElement(tagName)

  for (const [name, value] of Object.entries(attributes)) element.setAttribute(name, value)

  document.body.append(element)

  return element
}

const semantics = (element: HTMLElement) => ({
  hidden: element.getAttribute('aria-hidden'),
  role: element.getAttribute('role')
})

beforeAll(() => {
  defineLumenFoundations()
})

afterEach(() => {
  document.body.replaceChildren()
})

test('granular and catalog entry points share the loading indicator elements', () => {
  expect(CatalogSkeletonElement).toBe(LumenSkeletonElement)
  expect(CatalogSpinnerElement).toBe(LumenSpinnerElement)
  expect(customElements.get('lumen-skeleton')).toBe(LumenSkeletonElement)
})

for (const tagName of ['lumen-skeleton', 'lumen-spinner'] as const) {
  test(`${tagName} is decorative until named and follows dynamic labels`, () => {
    const element = create(tagName)

    expect(semantics(element)).toEqual({ hidden: 'true', role: null })

    element.setAttribute('aria-label', 'Loading activity')
    expect(semantics(element)).toEqual({ hidden: null, role: 'status' })

    element.removeAttribute('aria-label')
    expect(semantics(element)).toEqual({ hidden: 'true', role: null })

    element.setAttribute('aria-labelledby', 'loading-title')
    expect(semantics(element)).toEqual({ hidden: null, role: 'status' })
  })

  test(`${tagName} preserves explicit ARIA overrides`, () => {
    const named = create(tagName, { 'aria-label': 'Saving', role: 'img' })

    expect(semantics(named)).toEqual({ hidden: null, role: 'img' })

    named.removeAttribute('aria-label')
    expect(semantics(named)).toEqual({ hidden: 'true', role: 'img' })

    const visible = create(tagName, { 'aria-hidden': 'false' })

    expect(semantics(visible)).toEqual({ hidden: 'false', role: null })

    const decorative = create(tagName)

    decorative.setAttribute('aria-hidden', 'true')
    decorative.setAttribute('aria-label', 'Loading')
    expect(semantics(decorative)).toEqual({ hidden: 'true', role: 'status' })
  })

  test(`${tagName} keeps the same semantics after reconnecting`, () => {
    const element = create(tagName, { 'aria-label': 'Loading' })

    element.remove()
    element.removeAttribute('aria-label')
    document.body.append(element)

    expect(semantics(element)).toEqual({ hidden: 'true', role: null })
  })
}

test('lumen-skeleton shape and animation attributes update and reset classes', () => {
  const skeleton = create('lumen-skeleton', { animation: 'pulse', shape: 'circle' })

  expect([...skeleton.classList]).toEqual(['ui-skeleton', 'ui-skeleton--pulse', 'ui-skeleton--circle'])

  skeleton.setAttribute('shape', 'text')
  skeleton.setAttribute('animation', 'none')
  expect([...skeleton.classList]).toEqual(['ui-skeleton', 'ui-skeleton--static', 'ui-skeleton--text'])

  skeleton.setAttribute('shape', 'triangle')
  skeleton.removeAttribute('animation')
  expect([...skeleton.classList]).toEqual(['ui-skeleton'])
})

test('lumen-skeleton width and height set validated size variables and clear them on removal', () => {
  const skeleton = create('lumen-skeleton', { height: '8', width: 'calc(var(--Row_width) - 1rem)' })

  expect(skeleton.style.getPropertyValue('--ui-skeleton-height')).toBe('8px')
  expect(skeleton.style.getPropertyValue('--ui-skeleton-width')).toBe('calc(var(--Row_width) - 1rem)')

  skeleton.setAttribute('height', '1rem; background: red')
  expect(skeleton.style.getPropertyValue('--ui-skeleton-height')).toBe('')
  expect(skeleton.style.getPropertyValue('background')).toBe('')

  skeleton.removeAttribute('width')
  expect(skeleton.style.getPropertyValue('--ui-skeleton-width')).toBe('')
})

test('lumen-skeleton leaves consumer-owned size variables alone', () => {
  const skeleton = create('lumen-skeleton')

  skeleton.style.setProperty('--ui-skeleton-height', '0.5rem')
  skeleton.setAttribute('shape', 'text')

  expect(skeleton.style.getPropertyValue('--ui-skeleton-height')).toBe('0.5rem')
})

test('lumen-skeleton preserves preexisting inline dimensions when size attributes change', () => {
  const skeleton = document.createElement('lumen-skeleton')

  skeleton.style.setProperty('--ui-skeleton-height', '3px')
  skeleton.setAttribute('height', '8')
  document.body.append(skeleton)
  expect(skeleton.style.getPropertyValue('--ui-skeleton-height')).toBe('3px')

  skeleton.setAttribute('height', '12')
  skeleton.removeAttribute('height')
  expect(skeleton.style.getPropertyValue('--ui-skeleton-height')).toBe('3px')
})

test('lumen-skeleton preserves a consumer style that replaces an applied dimension', () => {
  const skeleton = create('lumen-skeleton', { height: '8' })

  skeleton.style.setProperty('--ui-skeleton-height', '2px')
  skeleton.setAttribute('shape', 'text')
  skeleton.removeAttribute('height')
  skeleton.remove()
  document.body.append(skeleton)
  expect(skeleton.style.getPropertyValue('--ui-skeleton-height')).toBe('2px')
})
