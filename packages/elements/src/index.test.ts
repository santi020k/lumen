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

  test('applies glass attribute classes', () => {
    defineLumenElements(customElements)

    const card = document.createElement('lumen-card')
    const dialog = document.createElement('lumen-dialog')
    const table = document.createElement('lumen-table')

    card.setAttribute('glass', '')
    dialog.setAttribute('glass', '')
    table.setAttribute('glass', '')
    document.body.append(card, dialog, table)

    expect(card.classList.contains('ui-card--glass')).toBe(true)
    expect(dialog.classList.contains('ui-dialog--glass')).toBe(true)
    expect(table.classList.contains('ui-table-wrap--glass')).toBe(true)
    expect(dialog.getAttribute('surface')).toBe('default')
  })

  test('applies code defaults and variant classes', () => {
    defineLumenElements(customElements)

    const inlineCode = document.createElement('lumen-code')
    const blockCode = document.createElement('lumen-code')

    blockCode.setAttribute('variant', 'block')
    document.body.append(inlineCode, blockCode)

    expect([...inlineCode.classList].sort()).toEqual(['ui-code', 'ui-code--inline'].sort())
    expect(inlineCode.getAttribute('data-code-theme')).toBe('auto')
    expect(inlineCode.getAttribute('variant')).toBe('inline')
    expect(blockCode.classList.contains('ui-code--block')).toBe(true)
  })
})
