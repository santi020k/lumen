import { type ComponentRef, useRef } from 'react'
import { Platform, type Pressable, type PressableProps } from 'react-native'

type KeyEvent = Parameters<NonNullable<PressableProps['onKeyDown']>>[0]

type RadioAction = 'current' | 'first' | 'last' | 1 | -1

const keyActions = new Map<string, RadioAction>([
  [' ', 'current'],
  ['Spacebar', 'current'],
  ['Home', 'first'],
  ['End', 'last'],
  ['ArrowRight', 1],
  ['ArrowDown', 1],
  ['ArrowLeft', -1],
  ['ArrowUp', -1]
])

const nextEnabled = (index: number, direction: 1 | -1, disabled: readonly boolean[]): number | null => {
  for (let offset = 1; offset <= disabled.length; offset += 1) {
    const next = (index + direction * offset + disabled.length) % disabled.length

    if (disabled[next] === false) return next
  }

  return null
}

const resolveLumenRadioKey = (
  key: string | undefined, index: number, disabled: readonly boolean[]
): number | null => {
  const action = keyActions.get(key ?? '')

  switch (action) {
    case 'current': return disabled[index] === false ? index : null

    case 'first': return nextEnabled(-1, 1, disabled)

    case 'last': return nextEnabled(0, -1, disabled)

    case undefined: return null

    default: return nextEnabled(index, action, disabled)
  }
}

export const useLumenRadioKeyboard = (disabled: readonly boolean[], select: (index: number) => void) => {
  const controlsRef = useRef(new Map<number, ComponentRef<typeof Pressable>>())

  const setRef = (index: number, instance: ComponentRef<typeof Pressable> | null): void => {
    if (instance) controlsRef.current.set(index, instance)
    else controlsRef.current.delete(index)
  }

  const onKeyDown = (index: number, event: KeyEvent): void => {
    if (Platform.OS !== 'web' || event.defaultPrevented) return

    const target = resolveLumenRadioKey(event.nativeEvent.key || event.nativeEvent.code, index, disabled)

    if (target === null || target < 0) return

    event.preventDefault()

    const repeated = 'repeat' in event.nativeEvent && event.nativeEvent.repeat === true

    if (repeated) return

    select(target)

    controlsRef.current.get(target)?.focus()
  }

  return { setRef, onKeyDown }
}
