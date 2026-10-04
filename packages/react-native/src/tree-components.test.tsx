import { act, createElement, type ReactElement } from 'react'

import { createRoot, type Root, type TestInstance } from 'test-renderer'
import { afterEach, expect, test, vi } from 'vitest'

import { LumenTree } from './tree-components.js'

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
vi.mock('react-native', () => ({ View: (props: Record<string, unknown>): ReactElement => createElement('View', props) }))
vi.mock('./primitives.js', () => ({
  LumenButton: (props: Record<string, unknown>): ReactElement => createElement('Button', props),
  LumenText: (props: Record<string, unknown>): ReactElement => createElement('Text', props)
}))
vi.mock('./selection-components.js', () => ({
  LumenCheckbox: (props: Record<string, unknown>): ReactElement => createElement('Checkbox', props)
}))
vi.mock('./theme-context.js', () => ({ useLumenTheme: () => ({ spacing: { md: 16, xs: 4 } }) }))
const roots: Root[] = []

afterEach(() => {
  act(() => {
    for (const root of roots) root.unmount()
  })
  roots.length = 0
})
const render = (element: ReactElement): Root => {
  const root = createRoot()

  roots.push(root)
  act(() => {
    root.render(element)
  })

  return root
}
const read = (instance: TestInstance, key: string): unknown => {
  const props = instance.props as Record<string, unknown>

  return props[key]
}
const find = (root: Root, type: string): TestInstance => {
  const match = root.container.queryAll(instance => instance.type === type)[0]

  if (!match) throw new Error(`Missing ${type}`)

  return match
}
const invoke = (instance: TestInstance, key: string): void => {
  const action = read(instance, key)

  if (typeof action !== 'function') throw new Error('Missing action')

  Reflect.apply(action, undefined, [])
}
const nodes = [{ id: 'r', label: 'Root' }, { id: 'c', label: 'Child', parentId: 'r' }]

test('read-only selection keeps expansion interactive and localizes names', () => {
  const expansion = vi.fn()
  const selection = vi.fn()
  const root = render(
    <LumenTree
      label="Files"
      nodes={nodes}
      expandedIds={new Set()}
      onExpandedChange={expansion}
      selectedIds={new Set(['missing'])}
      onSelectionChange={selection}
      readOnly
      formatDisclosure={(label, expanded) => `${label}: ${expanded ? 'close' : 'open'}`}
      formatLevel={depth => `Depth ${depth}`}
    />
  )
  const button = find(root, 'Button')
  const checkbox = find(root, 'Checkbox')

  expect(read(button, 'accessibilityLabel')).toBe('Root: open')
  act(() => {
    invoke(button, 'onPress')
  })
  expect(expansion).toHaveBeenCalledWith(new Set(['r']))
  expect(read(checkbox, 'disabled')).toBe(true)
  act(() => {
    invoke(checkbox, 'onCheckedChange')
  })
  expect(selection).not.toHaveBeenCalled()
})

test('disabled branches block callbacks, loading and error hide stale controls', () => {
  const expansion = vi.fn()
  const selection = vi.fn()
  const root = render(
    <LumenTree
      label="Files"
      nodes={nodes}
      expandedIds={new Set(['r'])}
      onExpandedChange={expansion}
      onSelectionChange={selection}
      disabled
    />
  )

  act(() => {
    invoke(find(root, 'Button'), 'onPress')
  })
  act(() => {
    invoke(find(root, 'Checkbox'), 'onCheckedChange')
  })
  expect(expansion).not.toHaveBeenCalled()
  expect(selection).not.toHaveBeenCalled()
  act(() => {
    root.render(
      <LumenTree
        label="Files"
        nodes={nodes}
        expandedIds={new Set(['r'])}
        onExpandedChange={expansion}
        loading
        loadingLabel="Waiting"
      />
    )
  })
  expect(root.container.queryAll(instance => instance.type === 'Button')).toHaveLength(0)
  expect(root.container.queryAll(instance => instance.type === 'Text').some(text => read(text, 'children') === 'Waiting')).toBe(true)
  act(() => {
    root.render(
      <LumenTree
        label="Files"
        nodes={nodes}
        expandedIds={new Set(['r'])}
        onExpandedChange={expansion}
        error="Unavailable"
      />
    )
  })
  expect(root.container.queryAll(instance => instance.type === 'Checkbox')).toHaveLength(0)
})
