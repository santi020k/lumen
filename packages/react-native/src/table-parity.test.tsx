import { act, createElement, type ReactElement } from 'react'

import { createRoot, type TestInstance } from 'test-renderer'
import { expect, test, vi } from 'vitest'

import { LumenTable } from './table-components.js'
import type { LumenTableCell, LumenTableRow } from './table-recipes.js'

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
vi.mock('react-native', () => ({
  View: (props: Record<string, unknown>): ReactElement => createElement('View', props),
  ScrollView: (props: Record<string, unknown>): ReactElement => createElement('ScrollView', props)
}))
vi.mock('./primitives.js', () => ({
  LumenButton: (props: Record<string, unknown>): ReactElement => createElement('Button', props),
  LumenText: (props: Record<string, unknown>): ReactElement => createElement('Text', props)
}))
vi.mock('./selection-components.js', () => ({
  LumenCheckbox: (props: Record<string, unknown>): ReactElement => createElement('Checkbox', props)
}))
vi.mock('./theme-context.js', () => ({ useLumenTheme: () => ({ spacing: { xs: 4, sm: 8, md: 16 },
  radii: { md: 8 },
  colors: { line: '#888' } }) }))
const read = (node: TestInstance, key: string): unknown => (node.props as Record<string, unknown>)[key]
const columns = [{ key: 'description', label: 'Long description' }, { key: 'owner', label: 'Owner' }]
const multiline = 'Synthetic record with long content and Unicode 😀.\nSecond line preserved.'

test('record cells preserve long Unicode content, omit inherited cells and label missing values', () => {
  const root = createRoot()
  const cells: Record<string, LumenTableCell> = { description: { text: multiline } }

  Object.setPrototypeOf(cells, { owner: { text: 'Inherited cell must not render' } })
  const rows: readonly LumenTableRow[] = [{ id: 'one', label: 'One record', cells }]

  act(() => {
    root.render(<LumenTable label="Records" columns={columns} rows={rows} missingLabel="Missing" />)
  })
  expect(root.container.queryAll(node => node.type === 'View' &&
    read(node, 'accessibilityLabel') === `Long description, ${multiline}`)).toHaveLength(1)
  expect(root.container.queryAll(node => node.type === 'View' && read(node, 'accessibilityLabel') === 'Owner, Missing'))
    .toHaveLength(1)
  expect(root.container.queryAll(node => node.type === 'Text' && read(node, 'children') === 'Inherited cell must not render'))
    .toHaveLength(0)
  expect(root.container.queryAll(node => node.type === 'Checkbox' || node.type === 'Button')).toHaveLength(0)
  expect(rows[0]?.cells.description?.text).toBe(multiline)
  act(() => {
    root.unmount()
  })
})

test('invalid/empty tables replace cells and use host labels without mutating records', () => {
  const root = createRoot()
  const row: LumenTableRow = { id: 'one', label: 'One', cells: { description: { text: multiline } } }

  for (const [records, fields, expected] of [
    [[row, row], columns, 'Invalid identities'],
    [[], columns, 'Empty records'],
    [[row], [], 'Empty records'],
    [[row], [...columns, ...columns], 'Invalid identities']
  ] as const) {
    act(() => {
      root.render(
        <LumenTable
          label="Records"
          columns={fields}
          rows={records}
          emptyLabel="Empty records"
          invalidLabel="Invalid identities"
        />
      )
    })
    expect(root.container.queryAll(node => node.type === 'Text' && read(node, 'children') === expected)).toHaveLength(1)
    expect(root.container.queryAll(node => node.type === 'Text' && read(node, 'children') === multiline)).toHaveLength(0)
  }
  expect(row.cells.description?.text).toBe(multiline)
  act(() => {
    root.unmount()
  })
})

test('scroll layout puts every full-width column inside one native horizontal viewport', () => {
  const root = createRoot()

  act(() => {
    root.render(
      <LumenTable
        label="Records"
        columns={columns}
        rows={[{ id: 'one', label: 'One', cells: { description: { text: multiline } } }]}
        layout="scroll"
      />
    )
  })
  const viewports = root.container.queryAll(node => node.type === 'ScrollView')

  expect(viewports).toHaveLength(1)
  expect(viewports[0] && read(viewports[0], 'horizontal')).toBe(true)
  expect(root.container.queryAll(node => node.type === 'Text' && read(node, 'children') === multiline)).toHaveLength(1)
  act(() => {
    root.unmount()
  })
})
