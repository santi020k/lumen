import { act, createElement, type ReactElement } from 'react'

import { createRoot, type Root, type TestInstance } from 'test-renderer'
import { afterEach, expect, test, vi } from 'vitest'

import { LumenStepper, type LumenStepperProps } from './stepper-components.js'
import { isLumenStepItemsValid, resolveLumenStepState } from './stepper-recipes.js'
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
const platform = vi.hoisted(() => ({ OS: 'web' }))
vi.mock('react-native', () => ({ Platform: platform,
  View: (props: Record<string, unknown>): ReactElement => createElement('View', props),
  Text: (props: Record<string, unknown>): ReactElement => createElement('Text', props),
  ScrollView: (props: Record<string, unknown>): ReactElement => createElement('ScrollView', props)
}))
vi.mock('./primitives.js', () => ({ LumenText: (props: Record<string, unknown>): ReactElement => createElement('Text', props) }))
vi.mock('./theme-context.js', () => ({ useLumenTheme: () => ({ colors: { surfaceMuted: '#ddd', brandSolid: '#08f', ink: '#111', onBrand: '#fff' }, spacing: { md: 16, sm: 8 }, radii: { full: 999 } }) }))
const roots: Root[] = []
afterEach(() => {
  act(() => {
    roots.forEach(root => {
      root.unmount()
    })
  })
  roots.length = 0
})
const render = (props: LumenStepperProps): Root => {
  const root = createRoot()
  roots.push(root)
  act(() => {
    root.render(<LumenStepper {...props} />)
  })
  return root
}
const steps = [
  { id: 'choose', title: 'Choose a longer accessible experience' },
  { id: 'review', title: 'Review', description: 'Details' },
  { id: 'confirm', title: 'Confirm' }
]
const states = (value: number): string[] => steps.map((_, index) => resolveLumenStepState(index, value, steps.length))
const read = (row: TestInstance, key: string): unknown => (row.props as Record<string, unknown>)[key]
test('controlled progression normalizes boundaries without changing host values', () => {
  expect(states(0)).toEqual(['current', 'upcoming', 'upcoming'])
  expect(states(1)).toEqual(['complete', 'current', 'upcoming'])
  expect(states(3)).toEqual(['complete', 'complete', 'complete'])
  expect(states(99)).toEqual(states(3))
  expect(states(-1)).toEqual(states(0))
  expect(states(Number.NaN)).toEqual(states(0))
  expect(states(Number.POSITIVE_INFINITY)).toEqual(states(0))
  expect(states(1.9)).toEqual(states(1))
  const props = { label: 'Progress', steps, currentStep: -1 }
  render(props)
  expect(props.currentStep).toBe(-1)
})
test('stable IDs reject duplicates and blank keys, while empty progression is valid', () => {
  expect(isLumenStepItemsValid(steps)).toBe(true)
  expect(isLumenStepItemsValid([])).toBe(true)
  expect(isLumenStepItemsValid([{ id: ' ' }])).toBe(false)
  expect(isLumenStepItemsValid([{ id: 'same' }, { id: 'same' }])).toBe(false)
  const reservedIdSteps = [{ id: '__proto__', title: 'Prototype' }, { id: 'constructor', title: 'Constructor' }]

  expect(isLumenStepItemsValid(reservedIdSteps)).toBe(true)
  const root = render({ label: 'Progreso', steps: [steps[0] ?? { id: 'choose', title: 'Choose' }, { id: 'choose', title: 'Duplicate' }], currentStep: 1, invalidText: 'Pasos no disponibles' })
  expect(root.container.queryAll(instance => instance.props.accessible === true)).toHaveLength(0)
  expect(root.container.queryAll(instance => instance.props.accessibilityRole === 'alert')).toHaveLength(1)
})
test('localized noninteractive steps expose current/state once; markers remain decorative', () => {
  const root = render({ label: 'Progreso', steps, currentStep: 1, formatState: state => ({ complete: 'Completado', current: 'Actual', upcoming: 'Pendiente' })[state] })
  const rows = root.container.queryAll(instance => instance.type === 'View' && instance.props.accessible === true)
  expect(rows.map(row => read(row, 'accessibilityValue'))).toEqual([{ text: 'Completado' }, { text: 'Actual' }, { text: 'Pendiente' }])
  expect(rows.map(row => read(row, 'aria-current'))).toEqual([undefined, 'step', undefined])
  expect(rows.map(row => read(row, 'accessibilityState'))).toEqual([
    { selected: false }, { selected: true }, { selected: false }
  ])
  expect(rows[1]?.props.accessibilityLabel).toBe('2 / 3, Review, Details, Actual')
  platform.OS = 'ios'
  act(() => {
    root.render(<LumenStepper label="Progress" steps={steps} currentStep={1} />)
  })
  const nativeRows = root.container.queryAll(instance => instance.type === 'View' && instance.props.accessible === true)
  expect(nativeRows[1]?.props.accessibilityLabel).toBe('2 / 3, Review, Details')
  platform.OS = 'web'
  expect(rows.every(row => row.props.onPress === undefined)).toBe(true)
  expect(root.container.queryAll(instance => instance.type === 'View' && instance.props.importantForAccessibility === 'no-hide-descendants')).toHaveLength(6)
})
test('horizontal layout scrolls and vertical layout preserves long text; empty renders no steps', () => {
  const root = render({ label: 'Progress', steps, currentStep: 0, orientation: 'horizontal' })
  expect(root.container.queryAll(instance => instance.type === 'ScrollView' && instance.props.horizontal === true)).toHaveLength(1)
  act(() => {
    root.render(<LumenStepper label="Progress" steps={steps} currentStep={3} orientation="vertical" />)
  })
  expect(root.container.queryAll(instance => instance.type === 'ScrollView')).toHaveLength(0)
  act(() => {
    root.render(<LumenStepper label="Progress" steps={[]} currentStep={0} />)
  })
  expect(root.container.queryAll(instance => instance.props.accessible === true)).toHaveLength(0)
})

test('decoded steps require their own string title before rendering accessible rows', () => {
  const malformed: readonly unknown[] = [
    { id: 'review' },
    { id: 'review', title: undefined },
    { id: 'review', title: 7 },
    Object.create({ id: 'review', title: 'Inherited' })
  ]

  for (const step of malformed) {
    const props: LumenStepperProps = { label: 'Progress', steps: [], currentStep: 0, invalidText: 'Steps unavailable' }

    Object.defineProperty(props, 'steps', { value: [step], enumerable: true })
    const root = render(props)

    expect(root.container.queryAll(instance => instance.props.accessible === true)).toHaveLength(0)
    expect(root.container.queryAll(instance => instance.props.accessibilityRole === 'alert')).toHaveLength(1)
  }
})
