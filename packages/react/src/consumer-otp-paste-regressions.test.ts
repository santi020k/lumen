// @vitest-environment jsdom

import type { ChangeEvent } from 'react'
import { act, createElement, useState } from 'react'
import { createRoot } from 'react-dom/client'

import { afterAll, beforeAll, expect, test, vi } from 'vitest'

import { InputOTP } from './components.js'

beforeAll(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
})

afterAll(() => {
  vi.unstubAllGlobals()
})

test.each([true, false])('InputOTP paste updates native value and onChange with controlled=%s', async controlled => {
  const container = document.createElement('div')
  const root = createRoot(container)
  const changes: string[] = []

  document.body.append(container)

  const Fixture = () => {
    const [value, setValue] = useState('123456')
    const onChange = (event: ChangeEvent<HTMLInputElement>) => {
      changes.push(event.currentTarget.value)

      setValue(event.currentTarget.value)
    }

    return createElement(InputOTP, {
      'aria-label': 'Verification code',
      ...(controlled ? { value } : { defaultValue: '123456' }),
      onChange
    })
  }

  try {
    await act(async () => {
      root.render(createElement(Fixture))

      await Promise.resolve()
    })

    const input = container.querySelector('input')

    if (!input) throw new Error('Missing OTP input')

    const paste = new Event('paste', { bubbles: true, cancelable: true })

    Object.defineProperty(paste, 'clipboardData', { value: { getData: () => '654321' } })

    await act(async () => {
      input.dispatchEvent(paste)

      await Promise.resolve()
    })

    expect(changes).toEqual(['654321'])
    expect(input.value).toBe('654321')
    expect([...container.querySelectorAll('[data-ui-input-otp-char]')].map(segment => segment.textContent).join('')).toBe('654321')
  } finally {
    act(() => {
      root.unmount()
    })

    container.remove()
  }
})
