// @vitest-environment jsdom

import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { useForm } from 'react-hook-form'

import { afterAll, afterEach, beforeAll, expect, test, vi } from 'vitest'

import { LumenDatePickerController } from './components.js'

beforeAll(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
})

afterAll(() => {
  vi.unstubAllGlobals()
})

let cleanup: (() => void) | undefined

afterEach(() => {
  cleanup?.()

  cleanup = undefined
})

const mountManagedDate = async (ownerDocument = document) => {
  const container = ownerDocument.createElement('div')
  const root = createRoot(container)

  ownerDocument.body.append(container)

  cleanup = () => {
    act(() => {
      root.unmount()
    })

    container.remove()
  }

  const Fixture = () => {
    const { control, handleSubmit, formState: { touchedFields } } = useForm<{ date: string }>({
      defaultValues: { date: '' },
      mode: 'onBlur'
    })

    return (
      <form noValidate onSubmit={handleSubmit(() => undefined)}>
        <LumenDatePickerController control={control} name="date" id="managed-date" aria-label="Appointment" rules={{ required: 'Choose a date' }} />
        <button type="button" data-focus-outside>Outside</button>
        <output>{touchedFields.date ? 'Touched' : 'Untouched'}</output>
      </form>
    )
  }

  await act(async () => {
    root.render(<Fixture />)

    await Promise.resolve()
  })

  const form = container.querySelector('form')
  const trigger = container.querySelector<HTMLButtonElement>('[data-ui-date-picker-trigger]')
  const outside = container.querySelector<HTMLButtonElement>('[data-focus-outside]')

  if (!form || !trigger || !outside) throw new Error('Missing managed date fixture')

  return { container, form, outside, trigger }
}

test('managed DatePicker focuses its visible control after an invalid submit', async () => {
  const { form, trigger } = await mountManagedDate()

  await act(async () => {
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))

    await Promise.resolve()
  })

  expect(document.activeElement).toBe(trigger)
})

test('managed DatePicker becomes touched when focus leaves its visible control', async () => {
  const { container, outside, trigger } = await mountManagedDate()

  await act(async () => {
    trigger.focus()

    outside.focus()

    await Promise.resolve()
  })

  expect(container.querySelector('output')?.textContent).toBe('Touched')
})

test('managed DatePicker keeps internal iframe focus untouched', async () => {
  const frame = document.createElement('iframe')

  document.body.append(frame)

  try {
    const ownerDocument = frame.contentDocument

    if (!ownerDocument) throw new Error('Missing iframe document')

    const { container, outside, trigger } = await mountManagedDate(ownerDocument)

    await act(async () => {
      trigger.focus()
      trigger.click()
      await Promise.resolve()
    })

    const day = container.querySelector<HTMLElement>('[data-ui-date-picker-popover] [role="gridcell"][tabindex="0"]')

    if (!day) throw new Error('Missing calendar day')

    await act(async () => {
      day.focus()
      await Promise.resolve()
    })

    expect(ownerDocument.activeElement).toBe(day)
    expect(container.querySelector('output')?.textContent).toBe('Untouched')

    await act(async () => {
      outside.focus()
      await Promise.resolve()
    })

    expect(container.querySelector('output')?.textContent).toBe('Touched')
  } finally {
    cleanup?.()
    cleanup = undefined
    frame.remove()
  }
})
