import { describe, expect, test } from 'vitest'

import { defineLumenCard } from './components/card.js'
import { defineLumenFoundations } from './components/foundations.js'

describe('content flow attributes', () => {
  test('changes spacing and density without retaining the previous class', () => {
    defineLumenCard()
    defineLumenFoundations()

    const stack = document.createElement('lumen-stack')
    const grid = document.createElement('lumen-grid')
    const card = document.createElement('lumen-card')

    document.body.append(stack, grid, card)
    expect(stack.classList.contains('ui-stack--gap-group')).toBe(true)
    expect(grid.classList.contains('ui-grid--gap-group')).toBe(true)
    expect(card.classList.contains('ui-card--comfortable')).toBe(true)

    stack.setAttribute('gap', 'section')
    grid.setAttribute('gap', 'xs')
    card.setAttribute('density', 'compact')
    expect(stack.classList.contains('ui-stack--gap-section')).toBe(true)
    expect(stack.classList.contains('ui-stack--gap-group')).toBe(false)
    expect(grid.classList.contains('ui-grid--gap-xs')).toBe(true)
    expect(card.classList.contains('ui-card--compact')).toBe(true)
    expect(card.classList.contains('ui-card--comfortable')).toBe(false)

    stack.removeAttribute('gap')
    card.removeAttribute('density')
    expect(stack.classList.contains('ui-stack--gap-group')).toBe(true)
    expect(card.classList.contains('ui-card--comfortable')).toBe(true)
    stack.remove()
    grid.remove()
    card.remove()
  })
})
