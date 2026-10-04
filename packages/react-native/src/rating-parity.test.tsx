import { act, createElement, type ReactElement, type Ref, useImperativeHandle } from 'react'

import { createRoot, type Root, type TestInstance } from 'test-renderer'
import { afterEach, expect, type Mock, test, vi } from 'vitest'

import { LumenRating, type LumenRatingProps } from './rating-components.js'
import { resolveLumenRating } from './rating-recipes.js'
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
const nativePlatform = vi.hoisted(() => ({ OS: 'web' }))
const nativeFocus = vi.hoisted(() => vi.fn<() => void>())
interface ChoiceProps extends Record<string, unknown> { ref?: Ref<{ focus: () => void }> }
vi.mock('react-native', () => ({ Platform: nativePlatform,
  View: (props: Record<string, unknown>): ReactElement => createElement('View', props),
  Pressable: (props: ChoiceProps): ReactElement => {
    const { ref, ...rest } = props
    useImperativeHandle(ref, () => ({ focus: nativeFocus }))
    return createElement('Choice', rest)
  } }))
vi.mock('./primitives.js', () => ({ LumenText: (props: Record<string, unknown>): ReactElement => createElement('Text', props) }))
vi.mock('./static-icons/star.generated.js', () => ({ LumenStarIconGraphic: (props: Record<string, unknown>): ReactElement => createElement('Star', props) }))
vi.mock('./theme-context.js', () => ({ useLumenTheme: () => ({ colors: { brandSolid: '#08f', inkMuted: '#888' }, spacing: { xs: 4 } }) }))
const roots: Root[] = []
afterEach(() => {
  act(() => {
    roots.forEach(root => {
      root.unmount()
    })
  })
  roots.length = 0
})
const render = (props: LumenRatingProps): Root => {
  const root = createRoot()
  roots.push(root)
  act(() => {
    root.render(<LumenRating {...props} />)
  })
  return root
}
const read = (instance: TestInstance, key: string): unknown => (instance.props as Record<string, unknown>)[key]
const choices = (root: Root): TestInstance[] => root.container.queryAll(instance => instance.type === 'Choice')
const press = (choice: TestInstance | undefined): void => {
  if (!choice) throw new Error('Missing choice')
  const callback = read(choice, 'onPress')
  if (typeof callback !== 'function') throw new Error('Missing rating callback')
  act(() => {
    Reflect.apply(callback, undefined, [])
  })
}
test('unrated and maximum options expose checked radio semantics without mutating controlled state', () => {
  const onValueChange = vi.fn<(value: number) => void>()
  const input = { label: 'Score', value: 0, onValueChange }
  const root = render(input)
  expect(choices(root)).toHaveLength(5)
  expect(choices(root).map(choice => read(choice, 'aria-checked'))).toEqual([false, false, false, false, false])
  press(choices(root)[4])
  expect(onValueChange).toHaveBeenCalledWith(5)
  expect(choices(root).every(choice => read(choice, 'aria-checked') === false)).toBe(true)
  act(() => {
    root.render(<LumenRating {...input} value={5} />)
  })
  expect(choices(root).map(choice => read(choice, 'aria-checked'))).toEqual([false, false, false, false, true])
  expect(read(choices(root)[4] ?? root.container, 'accessibilityState')).toEqual({ checked: true, selected: true, disabled: false })
})
test('localized choices retain 44-unit targets and disabled/readOnly direct action guards', () => {
  const onValueChange = vi.fn<(value: number) => void>()
  const input = { label: 'Calificación', value: 3, onValueChange, formatOption: (value: number, max: number): string => `Calificar ${value} de ${max}` }
  const root = render(input)
  const third = choices(root)[2]
  if (!third) throw new Error('Missing third rating')
  expect(read(third, 'accessibilityLabel')).toBe('Calificar 3 de 5')
  expect(read(third, 'style')).toMatchObject({ minWidth: 44, minHeight: 44 })
  for (const locked of [{ readOnly: true }, { disabled: true }]) {
    act(() => {
      root.render(<LumenRating {...input} {...locked} />)
    })
    choices(root).forEach(choice => {
      expect(read(choice, 'aria-disabled')).toBe(true)
      press(choice)
    })
  }
  expect(onValueChange).not.toHaveBeenCalled()
})
test('invalid inputs and extreme maxima bound choices and preserve zero selection', () => {
  const input = { label: 'Score', onValueChange: vi.fn(), value: Number.NaN, max: 0 }
  const root = render(input)
  expect(choices(root)).toHaveLength(1)
  expect(choices(root).map(choice => read(choice, 'aria-checked'))).toEqual([false])
  act(() => {
    root.render(<LumenRating {...input} value={999} max={999} />)
  })
  expect(choices(root)).toHaveLength(100)
  expect(read(choices(root)[99] ?? root.container, 'aria-checked')).toBe(true)
  act(() => {
    root.render(<LumenRating {...input} value={Number.POSITIVE_INFINITY} max={Number.POSITIVE_INFINITY} />)
  })
  expect(choices(root)).toHaveLength(5)
  expect(choices(root).every(choice => read(choice, 'aria-checked') === false)).toBe(true)
})
test('normalization defines zero, exact maxima, fractions and nonfinite boundaries', () => {
  expect(resolveLumenRating(0)).toEqual({ value: 0, max: 5 })
  expect(resolveLumenRating(5)).toEqual({ value: 5, max: 5 })
  expect(resolveLumenRating(3.9, 5.9)).toEqual({ value: 3, max: 5 })
  expect(resolveLumenRating(-3, -4)).toEqual({ value: 0, max: 1 })
  expect(resolveLumenRating(Number.NaN, Number.NaN)).toEqual({ value: 0, max: 5 })
})

test('web Space and radio navigation request controlled values; native/locked/prevented/repeated paths do not dispatch', () => {
  const onValueChange = vi.fn<(value: number) => void>()
  const input = { label: 'Score', value: 2, onValueChange }
  const root = render(input)
  const invokeKey = (
    choice: TestInstance | undefined, key: string, prevented = false, repeat = false
  ): Mock<() => void> => {
    if (!choice) throw new Error('Missing rating choice')
    const callback = read(choice, 'onKeyDown')
    if (typeof callback !== 'function') throw new Error('Missing keyboard callback')
    const preventDefault = vi.fn<() => void>()
    act(() => {
      const event = { nativeEvent: { key, repeat }, defaultPrevented: prevented, preventDefault }
      Reflect.apply(callback, undefined, [event])
    })
    return preventDefault
  }
  const second = choices(root)[1]
  expect(invokeKey(second, ' ')).toHaveBeenCalledOnce()
  expect(onValueChange).toHaveBeenLastCalledWith(2)
  invokeKey(second, 'ArrowRight')
  expect(onValueChange).toHaveBeenLastCalledWith(3)
  invokeKey(second, 'Home')
  expect(onValueChange).toHaveBeenLastCalledWith(1)
  invokeKey(second, 'End')
  expect(onValueChange).toHaveBeenLastCalledWith(5)
  invokeKey(choices(root)[4], 'ArrowDown')
  expect(onValueChange).toHaveBeenLastCalledWith(1)
  invokeKey(choices(root)[0], 'ArrowUp')
  expect(onValueChange).toHaveBeenLastCalledWith(5)
  onValueChange.mockClear()
  invokeKey(second, 'Enter')
  invokeKey(second, ' ', true)
  invokeKey(second, ' ', false, true)
  expect(onValueChange).not.toHaveBeenCalled()
  act(() => {
    root.render(<LumenRating {...input} readOnly />)
  })
  invokeKey(choices(root)[1], 'ArrowRight')
  expect(onValueChange).not.toHaveBeenCalled()
  nativePlatform.OS = 'android'
  act(() => {
    root.render(<LumenRating {...input} />)
  })
  invokeKey(choices(root)[1], ' ')
  expect(onValueChange).not.toHaveBeenCalled()
  nativePlatform.OS = 'web'
})
