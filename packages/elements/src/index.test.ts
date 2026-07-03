// @vitest-environment jsdom

import { describe, expect, test } from 'vitest'

import {
  defineLumenElements,
  LumenButtonElement,
  LumenCardElement
} from './index.js'

describe('@santi020k/lumen-elements', () => {
  test('registers custom elements once', () => {
    defineLumenElements(customElements)
    defineLumenElements(customElements)

    expect(customElements.get('lumen-button')).toBe(LumenButtonElement)
    expect(customElements.get('lumen-card')).toBe(LumenCardElement)
  })

  test('applies primitive classes when elements connect', () => {
    defineLumenElements(customElements)

    const button = document.createElement('lumen-button')
    const card = document.createElement('lumen-card')

    document.body.append(button, card)

    expect([...button.classList].sort()).toEqual(['ui-button', 'ui-button--default', 'ui-button--default-size'].sort())
    expect(button.getAttribute('role')).toBe('button')
    expect(button.tabIndex).toBe(0)
    expect([...card.classList]).toEqual(['ui-card'])
  })
})
