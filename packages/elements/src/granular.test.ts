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
  LumenBadgeElement as CatalogBadgeElement,
  LumenButtonElement as CatalogButtonElement,
  LumenCardElement as CatalogCardElement,
  LumenElement } from './define.js'

beforeAll(() => {
  defineLumenBadge()
  defineLumenButton()
  defineLumenCard()
})

describe('granular element entrypoints', () => {
  test('reuse the exact constructors exposed by the complete catalog', () => {
    expect(LumenBadgeElement).toBe(CatalogBadgeElement)
    expect(LumenButtonElement).toBe(CatalogButtonElement)
    expect(LumenCardElement).toBe(CatalogCardElement)
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

    expect([...constructors.keys()]).toEqual([
      'lumen-badge',
      'lumen-button',
      'lumen-card'
    ])
    expect(registry.define).toHaveBeenCalledTimes(3)
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
    expect(card.className).toBe('ui-card')

    badge.setAttribute('variant', 'success')
    button.setAttribute('loading', '')
    card.setAttribute('glass', 'strong')

    expect(badge.className).toBe('ui-badge ui-badge--success')
    expect(button.className).toContain('ui-button--loading')
    expect(card.className).toBe('ui-card ui-card--glass ui-glass-strong')
  })
})
