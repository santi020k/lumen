// @vitest-environment jsdom

import { act, createElement } from 'react'
import { createRoot } from 'react-dom/client'

import { afterEach, describe, expect, test } from 'vitest'

import { DataTable, type DataTableRow } from './index.js'

const mountedRoots: ReturnType<typeof createRoot>[] = []

const renderDataTable = () => {
  const container = document.createElement('div')
  const root = createRoot(container)
  const rows: DataTableRow[] = [
    { count: { sortValue: 2, value: '2' }, id: 'beta', name: 'Beta' },
    { count: { sortValue: 10, value: '10' }, id: 'alpha', name: 'Alpha' }
  ]

  mountedRoots.push(root)

  act(() => {
    root.render(
      createElement(DataTable, {
        columns: [
          { header: 'Name', key: 'name', sortable: true },
          { header: 'Count', key: 'count', sort: 'number', sortable: true }
        ],
        rows
      })
    )
  })

  return { container, rows }
}

const rowLabels = (container: HTMLElement): string[] => Array.from(container.querySelectorAll('tbody tr')).map(
  row => row.querySelector('td')?.textContent ?? ''
)

const requireElement = (root: ParentNode, selector: string): Element => {
  const element = root.querySelector(selector)

  if (!element) throw new Error(`Expected DataTable element: ${selector}`)

  return element
}

const click = (element: Element): void => {
  act(() => {
    element.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  })
}

afterEach(() => {
  while (mountedRoots.length > 0) {
    const root = mountedRoots.pop()

    if (root) {
      act(() => {
        root.unmount()
      })
    }
  }
})

describe('DataTable', () => {
  test('sorts rows from accessible header buttons without mutating input rows', () => {
    const { container, rows } = renderDataTable()
    const nameHeader = requireElement(container, 'th:nth-child(1)')
    const countHeader = requireElement(container, 'th:nth-child(2)')
    const nameButton = requireElement(nameHeader, 'button')
    const countButton = requireElement(countHeader, 'button')

    expect(nameButton.textContent).toBe('Name')
    expect(countButton.textContent).toBe('Count')
    expect(nameHeader.getAttribute('aria-sort')).toBe('none')
    expect(rowLabels(container)).toEqual(['Beta', 'Alpha'])

    click(nameButton)

    expect(nameHeader.getAttribute('aria-sort')).toBe('ascending')
    expect(rowLabels(container)).toEqual(['Alpha', 'Beta'])

    click(nameButton)

    expect(nameHeader.getAttribute('aria-sort')).toBe('descending')
    expect(rowLabels(container)).toEqual(['Beta', 'Alpha'])

    click(countButton)

    expect(nameHeader.getAttribute('aria-sort')).toBe('none')
    expect(countHeader.getAttribute('aria-sort')).toBe('ascending')
    expect(rowLabels(container)).toEqual(['Beta', 'Alpha'])
    expect(rows.map(row => row.id)).toEqual(['beta', 'alpha'])
  })
})
