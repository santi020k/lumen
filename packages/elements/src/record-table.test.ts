// @vitest-environment jsdom
import { afterEach, beforeAll, describe, expect, test } from 'vitest'

import { defineLumenElements } from './define.js'

beforeAll(() => {
  defineLumenElements()
})
afterEach(() => {
  document.body.replaceChildren()
})

describe('record table layout', () => {
  test('switches layout without replacing semantic table content', () => {
    const wrapper = document.createElement('lumen-table')
    const table = document.createElement('table')
    wrapper.append(table)
    document.body.append(wrapper)
    expect(wrapper.classList.contains('ui-table-wrap--records')).toBe(false)
    wrapper.setAttribute('layout', 'records')
    expect(wrapper.classList.contains('ui-table-wrap--records')).toBe(true)
    expect(wrapper.querySelector('table')).toBe(table)
    wrapper.setAttribute('layout', 'scroll')
    expect(wrapper.classList.contains('ui-table-wrap--records')).toBe(false)
    expect(wrapper.querySelector('table')).toBe(table)
  })
})
