import { beforeAll, describe, expect, test, vi } from 'vitest'

import {
  defineLumenBadge,
  LumenBadgeElement
} from './components/badge.js'
import {
  defineLumenButton,
  LumenButtonElement
} from './components/button.js'
import {
  defineLumenCard,
  LumenCardElement
} from './components/card.js'
import {
  defineLumenCombobox,
  LumenComboboxElement
} from './components/combobox.js'
import {
  defineLumenFoundations,
  LumenCardContentElement,
  LumenContainerElement,
  LumenGridElement,
  LumenStackElement,
  LumenVisuallyHiddenElement
} from './components/foundations.js'
import {
  LumenBadgeElement as CatalogBadgeElement,
  LumenButtonElement as CatalogButtonElement,
  LumenCardContentElement as CatalogCardContentElement,
  LumenCardElement as CatalogCardElement,
  LumenComboboxElement as CatalogComboboxElement,
  LumenContainerElement as CatalogContainerElement,
  LumenElement,
  LumenGridElement as CatalogGridElement,
  LumenStackElement as CatalogStackElement,
  LumenVisuallyHiddenElement as CatalogVisuallyHiddenElement
} from './define.js'

beforeAll(() => {
  defineLumenBadge()
  defineLumenButton()
  defineLumenCard()
  defineLumenCombobox()
  defineLumenFoundations()
})

describe('granular element entrypoints', () => {
  test('reuse the exact constructors exposed by the complete catalog', () => {
    expect(LumenBadgeElement).toBe(CatalogBadgeElement)
    expect(LumenButtonElement).toBe(CatalogButtonElement)
    expect(LumenCardElement).toBe(CatalogCardElement)
    expect(LumenComboboxElement).toBe(CatalogComboboxElement)
    expect(LumenCardContentElement).toBe(CatalogCardContentElement)
    expect(LumenContainerElement).toBe(CatalogContainerElement)
    expect(LumenGridElement).toBe(CatalogGridElement)
    expect(LumenStackElement).toBe(CatalogStackElement)
    expect(LumenVisuallyHiddenElement).toBe(CatalogVisuallyHiddenElement)
  })

  test('register independently and remain idempotent', () => {
    const constructors = new Map<string, CustomElementConstructor>()
    const registry = {
      define: vi.fn((name: string, constructor: CustomElementConstructor) => {
        constructors.set(name, constructor)
      }),
      get: vi.fn((name: string) => constructors.get(name))
    }

    defineLumenBadge(registry)
    defineLumenButton(registry)
    defineLumenCard(registry)
    defineLumenCard(registry)
    defineLumenCombobox(registry)
    defineLumenFoundations(registry)

    expect([...constructors.keys()]).toEqual([
      'lumen-badge',
      'lumen-button',
      'lumen-card',
      'lumen-combobox',
      'lumen-card-content',
      'lumen-card-description',
      'lumen-card-footer',
      'lumen-card-header',
      'lumen-card-title',
      'lumen-container',
      'lumen-direction',
      'lumen-grid',
      'lumen-label',
      'lumen-separator',
      'lumen-skeleton',
      'lumen-spinner',
      'lumen-stack',
      'lumen-typography',
      'lumen-visually-hidden'
    ])
    expect(registry.define).toHaveBeenCalledTimes(19)
  })

  test('applies defaults and responds to styling attributes', () => {
    const badge = document.createElement('lumen-badge')
    const button = document.createElement('lumen-button')
    const card = document.createElement('lumen-card')

    document.body.append(badge, button, card)

    expect(badge).toBeInstanceOf(LumenElement)
    expect(button).toBeInstanceOf(LumenElement)
    expect(card).toBeInstanceOf(LumenElement)
    expect(badge.className).toBe('ui-badge ui-badge--default')
    expect(button.className).toBe('ui-button ui-button--default ui-button--default-size')
    expect(button.getAttribute('role')).toBe('button')
    expect(card.className).toBe('ui-card ui-card--comfortable')

    badge.setAttribute('variant', 'success')
    button.setAttribute('loading', '')
    card.setAttribute('glass', 'strong')

    expect(badge.className).toBe('ui-badge ui-badge--success')
    expect(button.className).toContain('ui-button--loading')
    expect(card.className).toBe('ui-card ui-card--comfortable ui-card--glass ui-glass-strong')
  })
})

test('combobox binds late children, replaces controls and stops binding when disconnected', async () => {
  const root = document.createElement('lumen-combobox')

  document.body.append(root)
  const markup = '<input role="combobox"><div role="listbox"><button type="button" role="option">Astro</button></div>'

  root.innerHTML = markup
  await Promise.resolve()
  const input = root.querySelector('input')

  if (!input) throw new Error('Expected input')

  input.focus()
  expect(input.getAttribute('aria-expanded')).toBe('true')
  root.innerHTML = markup
  await Promise.resolve()
  const replacement = root.querySelector('input')

  if (!replacement) throw new Error('Expected replacement input')

  replacement.focus()
  expect(replacement.getAttribute('aria-expanded')).toBe('true')
  input.dispatchEvent(new Event('focus'))
  expect(input.getAttribute('aria-expanded')).toBe('false')
  root.remove()
  root.innerHTML = markup
  await Promise.resolve()
  expect(root.querySelector('input')?.hasAttribute('aria-controls')).toBe(false)
  document.body.append(root)
  root.querySelector('input')?.focus()
  expect(root.querySelector('input')?.getAttribute('aria-expanded')).toBe('true')
  root.remove()
})
