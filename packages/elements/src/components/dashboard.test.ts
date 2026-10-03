// @vitest-environment jsdom
import { describe, expect, test } from 'vitest'

import { defineLumenChangeSummary, LumenChangeSummaryElement } from './dashboard.js'

defineLumenChangeSummary()

describe('change summary element', () => {
  test('renders text safely, retains authored audit notes, and validates setters', () => {
    const element = new LumenChangeSummaryElement()
    const note = document.createElement('p')

    note.textContent = 'Audit note'
    element.append(note)
    element.setAttribute('label', 'Review')
    element.items = [{ id: 'x', label: '<img>', before: '0', after: '1', changed: true }]
    document.body.append(element)
    expect(element.querySelector('img')).toBeNull()
    expect(element.querySelector('dt')?.textContent).toBe('<img>Changed')
    expect(element.contains(note)).toBe(true)
    element.setAttribute('before-label', 'Current')
    expect(element.querySelector('dd')?.textContent).toBe('Current0')
    const items = element.items

    expect(items).toHaveLength(1)
    element.remove()
  })
})
