// @vitest-environment jsdom
import { act, useEffect } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { useForm, type UseFormReturn } from 'react-hook-form'

import { afterEach, beforeEach, expect, test, vi } from 'vitest'

import { LumenListBoxController } from './components.js'

interface Values {
  member: string
}

let container: HTMLDivElement
let root: Root
let form: UseFormReturn<Values> | undefined
const validate = vi.fn(() => true)

const Fixture = ({ onReady }: { onReady: (methods: UseFormReturn<Values>) => void }) => {
  const methods = useForm<Values>({ defaultValues: { member: '' }, mode: 'onBlur' })

  useEffect(() => {
    onReady(methods)
  }, [methods, onReady])

  return (
    <form>
      <LumenListBoxController aria-label="Member" control={methods.control} name="member" options={['Amina', 'Bruno']} rules={{ validate }} />
      <button type="button">Outside</button>
    </form>
  )
}

const run = async (action: () => unknown): Promise<void> => {
  await act(async () => {
    await action()
    await new Promise(resolve => setTimeout(resolve, 0))
  })
}

beforeEach(async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  validate.mockClear()
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

test('leaving a managed ListBox validates once and marks it touched', async () => {
  const list = container.querySelector<HTMLElement>('[data-ui-list-box-list]')

  await run(() => {
    list?.focus()
  })
  await run(() => {
    container.querySelector('button')?.focus()
  })

  expect(validate).toHaveBeenCalledTimes(1)
  expect(form?.getFieldState('member').isTouched).toBe(true)
})
