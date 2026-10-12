// @vitest-environment jsdom
import type { ChangeEvent, ClipboardEvent } from 'react'
import { act, useState } from 'react'
import type { Root } from 'react-dom/client'
import { createRoot } from 'react-dom/client'

import { afterEach, beforeEach, expect, test, vi } from 'vitest'

import { InputOTP } from './components.js'
import { useInputOTP } from './hooks.js'

let container: HTMLDivElement
let root: Root

const run = async (action: () => void) => {
  await act(async () => {
    action()
    await new Promise(resolve => setTimeout(resolve, 0))
  })
}

beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
})

afterEach(async () => {
  await run(() => {
    root.unmount()
  })
  container.remove()
  vi.unstubAllGlobals()
})

const native = (): HTMLInputElement => {
  const input = container.querySelector('[data-ui-input-otp-native]')

  if (!(input instanceof HTMLInputElement)) throw new Error('Missing OTP input')

  return input
}

const segments = (): string => [...container.querySelectorAll('[data-ui-input-otp-char]')]
  .map(segment => segment.textContent).join('')

const paste = (text: string): Event => {
  const event = new Event('paste', { bubbles: true, cancelable: true })

  // jsdom has no ClipboardEvent constructor with clipboard data; the handler only reads getData.
  Object.defineProperty(event, 'clipboardData', { value: { getData: () => text } })
  native().dispatchEvent(event)

  return event
}

const type = (text: string) => {
  Reflect.set(HTMLInputElement.prototype, 'value', text, native())
  native().dispatchEvent(new Event('input', { bubbles: true }))
}

const ControlledOtp = ({ changes }: { changes: string[] }) => {
  const [code, setCode] = useState('')

  return (
    <>
      <InputOTP
        aria-label="Controlled code"
        onChange={(event: ChangeEvent<HTMLInputElement>) => {
          changes.push(event.currentTarget.value)
          setCode(event.currentTarget.value)
        }}
        value={code}
      />
      <output>{code}</output>
    </>
  )
}

test('a controlled InputOTP paste reaches the consumer onChange once with the sanitized code', async () => {
  const changes: string[] = []

  await run(() => {
    root.render(<ControlledOtp changes={changes} />)
  })
  await run(() => {
    expect(paste('65 43-21 99').defaultPrevented).toBe(true)
  })

  expect(changes).toEqual(['654321'])
  expect(container.querySelector('output')?.textContent).toBe('654321')
  expect(native().value).toBe('654321')
  expect(segments()).toBe('654321')
})

test('an uncontrolled InputOTP paste reaches onChange once and keeps the native value', async () => {
  const changes: string[] = []

  await run(() => {
    root.render(
      <form>
        <InputOTP aria-label="Uncontrolled code" name="code" onChange={event => changes.push(event.currentTarget.value)} />
      </form>
    )
  })
  await run(() => {
    paste('654321')
  })

  expect(changes).toEqual(['654321'])
  expect(segments()).toBe('654321')
  expect(new FormData(native().form ?? undefined).get('code')).toBe('654321')
})

test('an uncontrolled InputOTP without onValueChange keeps typed digits in its segments', async () => {
  await run(() => {
    root.render(<InputOTP aria-label="Typed code" length={4} />)
  })
  await run(() => {
    type('12a3')
  })

  expect(native().value).toBe('123')
  expect(segments().startsWith('123')).toBe(true)
})

test('a consumer onPaste still runs first and an empty clipboard leaves the default paste alone', async () => {
  const pastes: string[] = []
  const changes: string[] = []

  await run(() => {
    root.render(
      <InputOTP
        aria-label="Observed code"
        onChange={event => changes.push(event.currentTarget.value)}
        onPaste={(event: ClipboardEvent<HTMLInputElement>) => pastes.push(event.clipboardData.getData('text'))}
      />
    )
  })
  await run(() => {
    expect(paste('').defaultPrevented).toBe(false)
  })
  expect(pastes).toEqual([''])
  expect(changes).toEqual([])
})

test('a consumer onPaste that prevents default cancels the Lumen paste', async () => {
  const changes: string[] = []

  await run(() => {
    root.render(
      <InputOTP
        aria-label="Guarded code"
        onChange={event => changes.push(event.currentTarget.value)}
        onPaste={(event: ClipboardEvent<HTMLInputElement>) => {
          event.preventDefault()
        }}
      />
    )
  })
  await run(() => {
    paste('654321')
  })

  expect(changes).toEqual([])
  expect(native().value).toBe('')
  expect(segments().trim()).toBe('')
})

const HookOtp = ({ notifications }: { notifications: string[] }) => {
  const otp = useInputOTP({ length: 4, onValueChange: next => notifications.push(next) })

  return (
    <div {...otp.rootProps}>
      <input {...otp.getInputProps({ 'aria-label': 'Hook code' })} />
    </div>
  )
}

test('useInputOTP notifies onValueChange once per typed or pasted input', async () => {
  const typed: string[] = []
  const pasted: string[] = []

  await run(() => {
    root.render(<HookOtp notifications={typed} />)
  })
  await run(() => {
    type('1234')
  })
  await run(() => {
    root.render(<HookOtp key="paste" notifications={pasted} />)
  })
  await run(() => {
    paste('9876 55')
  })

  expect(typed).toEqual(['1234'])
  expect(pasted).toEqual(['9876'])
  expect(native().value).toBe('9876')
})
