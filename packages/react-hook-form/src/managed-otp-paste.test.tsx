// @vitest-environment jsdom
import { act, useEffect } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { useForm, type UseFormReturn } from 'react-hook-form'

import { afterEach, beforeEach, expect, test, vi } from 'vitest'

import { LumenInputOTPController } from './components.js'

interface Values {
  code: string
}

let container: HTMLDivElement
let root: Root
let form: UseFormReturn<Values> | undefined

const Fixture = ({ onReady }: { onReady: (methods: UseFormReturn<Values>) => void }) => {
  const methods = useForm<Values>({ defaultValues: { code: '' } })

  useEffect(() => {
    onReady(methods)
  }, [methods, onReady])

  return (
    <form>
      <LumenInputOTPController aria-label="Managed code" control={methods.control} name="code" />
      <output data-dirty-code>{String(Boolean(methods.formState.dirtyFields.code))}</output>
    </form>
  )
}

const run = async (action: () => unknown): Promise<void> => {
  await act(async () => {
    await action()
    await new Promise(resolve => setTimeout(resolve, 0))
  })
}

const native = (): HTMLInputElement => {
  const input = container.querySelector('[data-ui-input-otp-native]')

  if (!(input instanceof HTMLInputElement)) throw new Error('Missing OTP input')

  return input
}

beforeEach(async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
  await run(() => {
    root.render(
      <Fixture onReady={methods => {
        form = methods
      }}
      />
    )
  })
})

afterEach(async () => {
  await run(() => {
    root.unmount()
  })
  container.remove()
  form = undefined
  vi.unstubAllGlobals()
})

test('pasting into a managed InputOTP updates the RHF value and the native input', async () => {
  const event = new Event('paste', { bubbles: true, cancelable: true })

  // jsdom has no ClipboardEvent constructor with clipboard data; the handler only reads getData.
  Object.defineProperty(event, 'clipboardData', { value: { getData: () => '65-43 21' } })

  await run(() => {
    native().dispatchEvent(event)
  })

  expect(event.defaultPrevented).toBe(true)
  expect(form?.getValues('code')).toBe('654321')
  expect(native().value).toBe('654321')
  expect(container.querySelector('[data-dirty-code]')?.textContent).toBe('true')
})
