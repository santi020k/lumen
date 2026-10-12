// @vitest-environment jsdom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { useForm } from 'react-hook-form'

import { expect, test, vi } from 'vitest'

import { LumenDatePickerController, LumenListBoxController, LumenSelectController } from './components.js'

interface Values {
  date: string
  member: string
  role: string
}

const run = async (action: () => void): Promise<void> => {
  await act(async () => {
    action()
    await new Promise<void>(resolve => setTimeout(resolve, 0))
  })
}

const parts = {
  date: '[data-ui-date-picker-trigger]',
  member: '[data-ui-list-box-list]',
  role: '[data-ui-select-trigger]'
} as const

test.each(['date', 'member', 'role'] as const)('a single %s focus exit runs validation once', async name => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)

  const validate = vi.fn(() => true)
  const container = document.createElement('div')
  const root = createRoot(container)

  document.body.append(container)

  const Fixture = () => {
    const { control, formState } = useForm<Values>({
      defaultValues: { date: '2026-10-12', member: 'amina', role: 'designer' },
      mode: 'onBlur'
    })

    return (
      <>
        <LumenDatePickerController control={control} name="date" rules={{ validate }} />
        <LumenListBoxController control={control} name="member" options={['amina']} rules={{ validate }} />
        <LumenSelectController control={control} name="role" options={['designer']} rules={{ validate }} />
        <output>{String(Boolean(formState.touchedFields[name]))}</output>
        <button id="validation-outside" type="button">Outside</button>
      </>
    )
  }

  try {
    await run(() => {
      root.render(<Fixture />)
    })

    const trigger = container.querySelector(parts[name])
    const outside = container.querySelector('#validation-outside')

    if (!(trigger instanceof HTMLElement) || !(outside instanceof HTMLButtonElement)) throw new Error('Missing managed control')

    await run(() => {
      trigger.focus()
    })
    expect(validate).not.toHaveBeenCalled()
    await run(() => {
      outside.focus()
    })
    expect(container.querySelector('output')?.textContent).toBe('true')
    expect(validate).toHaveBeenCalledTimes(1)
  } finally {
    await run(() => {
      root.unmount()
    })
    container.remove()
    vi.unstubAllGlobals()
  }
})
