import { act, createElement, type ReactElement } from 'react'

import { createRoot, type TestInstance } from 'test-renderer'
import { expect, test, vi } from 'vitest'

import { LumenButton, LumenText } from './primitives.js'
import { LumenTimeline, LumenTimelineItem } from './timeline-components.js'

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
vi.mock('react-native', () => ({ View: (props: Record<string, unknown>): ReactElement => createElement('View', props) }))
vi.mock('./primitives.js', () => ({
  LumenText: (props: Record<string, unknown>): ReactElement => createElement('Text', props),
  LumenButton: (props: Record<string, unknown>): ReactElement => createElement('Button', props)
}))
vi.mock('./theme-context.js', () => ({ useLumenTheme: () => ({ spacing: { xs: 4, md: 16 },
  radii: { full: 999 },
  colors: { line: '#888', brandSolid: '#036' } }) }))
const read = (node: TestInstance, key: string): unknown => (node.props as Record<string, unknown>)[key]
const connector = (node: TestInstance): boolean => {
  const style = read(node, 'style')

  return node.type === 'View' && typeof style === 'object' && style !== null &&
    'borderLeftWidth' in style && style.borderLeftWidth === 1
}

test('terminal item suppresses only connector and retains host content/action/custom dot', () => {
  const root = createRoot()
  const action = vi.fn()

  for (const isLast of [false, true]) {
    act(() => {
      root.render(
        <LumenTimeline label="History">
          <LumenTimelineItem
            isLast={isLast}
            dot={<LumenText>Custom marker</LumenText>}
          >
            <LumenText>Full multiline content 😀</LumenText>
            <LumenButton onPress={action}>View record</LumenButton>
          </LumenTimelineItem>
        </LumenTimeline>
      )
    })
    expect(root.container.queryAll(connector)).toHaveLength(isLast ? 0 : 1)
    expect(root.container.queryAll(node => node.type === 'Text' && read(node, 'children') === 'Custom marker')).toHaveLength(1)
    const button = root.container.queryAll(node => node.type === 'Button')[0]

    if (!button) throw new Error('Missing host action')

    const callback = read(button, 'onPress')

    const callable = (value: unknown): value is () => void => typeof value === 'function'

    if (!callable(callback)) throw new Error('Missing host callback')

    act(() => {
      callback()
    })
  }
  expect(action).toHaveBeenCalledTimes(2)
  act(() => {
    root.unmount()
  })
})

test('hides decorative marker subtree while preserving host order and child controls', () => {
  const root = createRoot()
  const ids = ['first', 'second', 'third']

  for (const events of [ids, [...ids].reverse(), []]) {
    act(() => {
      root.render(
        <LumenTimeline label="Localized history">
          {events.map((id, index) => (
            <LumenTimelineItem key={id} isLast={index === events.length - 1}>
              <LumenText>{id}</LumenText>
            </LumenTimelineItem>
          ))}
        </LumenTimeline>
      )
    })
    const labels = root.container.queryAll(node => node.type === 'Text').map(node => read(node, 'children'))

    expect(labels).toEqual(events)
    const hidden = root.container.queryAll(node => node.type === 'View' && read(node, 'aria-hidden') === true)

    expect(hidden).toHaveLength(events.length)
    expect(hidden.every(node => read(node, 'importantForAccessibility') === 'no-hide-descendants')).toBe(true)
    expect(root.container.queryAll(connector)).toHaveLength(Math.max(0, events.length - 1))
  }
  act(() => {
    root.unmount()
  })
})
