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

const copyByClone = (element: HTMLElement): HTMLElement => {
  const copy = element.cloneNode(true)

  if (!(copy instanceof HTMLElement)) throw new Error('Expected an element copy.')

  document.body.append(copy)

  return copy
}

const copyByHtml = (element: HTMLElement): HTMLElement => {
  const host = document.createElement('div')

  host.innerHTML = element.outerHTML
  document.body.append(host)

  const copy = host.firstElementChild

  if (!(copy instanceof HTMLElement)) throw new Error('Expected a parsed copy.')

  return copy
}

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

  test(`${tagName} copies keep generated semantics generated after cloning or parsing their HTML`, () => {
    const decorative = create(tagName)
    const named = create(tagName, { 'aria-label': 'Loading' })
    const clonedDecorative = copyByClone(decorative)
    const clonedNamed = copyByClone(named)
    const parsedCopy = copyByHtml(decorative)

    clonedDecorative.setAttribute('aria-label', 'Loading orders')
    expect(semantics(clonedDecorative)).toEqual({ hidden: null, role: 'status' })
    clonedNamed.removeAttribute('aria-label')
    expect(semantics(clonedNamed)).toEqual({ hidden: 'true', role: null })
    parsedCopy.setAttribute('aria-labelledby', 'loading-title')
    expect(semantics(parsedCopy)).toEqual({ hidden: null, role: 'status' })
    parsedCopy.removeAttribute('aria-labelledby')
    expect(semantics(parsedCopy)).toEqual({ hidden: 'true', role: null })
  })

  test(`${tagName} copies keep consumer ARIA overrides explicit`, () => {
    const visible = create(tagName, { 'aria-hidden': 'false' })
    const image = create(tagName, { 'aria-label': 'Saving', role: 'img' })
    const takenOver = create(tagName)

    // Rewriting the generated value while connected makes it the consumer's.
    takenOver.setAttribute('aria-hidden', 'true')

    const copies = [copyByClone(visible), copyByHtml(image), copyByClone(takenOver)]

    for (const copy of copies) copy.setAttribute('aria-label', 'Loading')

    expect(copies.map(semantics)).toEqual([
      { hidden: 'false', role: 'status' },
      { hidden: null, role: 'img' },
      { hidden: 'true', role: 'status' }
    ])
    copies[1]?.removeAttribute('aria-label')
    expect(copies[1] && semantics(copies[1])).toEqual({ hidden: 'true', role: 'img' })
  })

  test(`${tagName} keeps overrides written while detached or on a clone before its first attachment`, () => {
    const decorative = create(tagName)
    const named = create(tagName, { 'aria-label': 'Loading' })

    decorative.remove()
    decorative.setAttribute('aria-hidden', 'true')
    document.body.append(decorative)
    decorative.setAttribute('aria-label', 'Loading orders')
    expect(semantics(decorative)).toEqual({ hidden: 'true', role: 'status' })

    named.remove()
    named.setAttribute('role', 'status')
    named.removeAttribute('aria-label')
    document.body.append(named)
    expect(semantics(named)).toEqual({ hidden: 'true', role: 'status' })

    const clone = create(tagName).cloneNode(true)

    if (!(clone instanceof HTMLElement)) throw new Error('Expected an element copy.')

    clone.setAttribute('aria-hidden', 'true')
    document.body.append(clone)
    clone.setAttribute('aria-label', 'Loading invoices')
    expect(semantics(clone)).toEqual({ hidden: 'true', role: 'status' })
    // Only values Lumen generated after the override stay recorded; the overridden attributes never return.
    expect([decorative, named, clone].map(element => element.getAttribute('data-ui-loading-managed'))).toEqual([
      'role', 'aria-hidden', 'role'
    ])
  })

  test(`${tagName} ignores ownership records that do not match the generated values`, () => {
    const host = document.createElement('div')

    host.innerHTML = `<${tagName} aria-hidden="false" role="img" data-ui-loading-managed="aria-hidden role class bogus"></${tagName}>`
    document.body.append(host)

    const forged = host.firstElementChild

    if (!(forged instanceof HTMLElement)) throw new Error('Expected a loading indicator.')

    forged.setAttribute('aria-label', 'Loading')
    expect(semantics(forged)).toEqual({ hidden: 'false', role: 'img' })
    forged.removeAttribute('aria-label')
    expect(semantics(forged)).toEqual({ hidden: 'false', role: 'img' })
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
