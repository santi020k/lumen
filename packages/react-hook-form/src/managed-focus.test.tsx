// @vitest-environment jsdom
import { act, useEffect } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { useForm, type UseFormReturn } from 'react-hook-form'

import { afterEach, beforeEach, expect, test, vi } from 'vitest'

import { LumenDatePickerController, LumenListBoxController, LumenSelectController } from './components.js'

interface Values {
  date: string
  member: string
  role: string
}

let container: HTMLDivElement
let root: Root
let form: UseFormReturn<Values> | undefined

const Fixture = ({ onReady }: { onReady: (methods: UseFormReturn<Values>) => void }) => {
  const methods = useForm<Values>({ defaultValues: { date: '', member: '', role: '' }, mode: 'onBlur' })

  useEffect(() => {
    onReady(methods)
  }, [methods, onReady])

  return (
    <form onSubmit={event => {
      void methods.handleSubmit(() => undefined)(event)
    }}
    >
      <LumenDatePickerController aria-label="Managed date" control={methods.control} id="managed-date" name="date" rules={{ required: 'Choose a date' }} />
      <LumenSelectController
        aria-label="Managed role"
        control={methods.control}
        id="managed-role"
        name="role"
        options={[{ label: 'Designer', value: 'designer' }, { label: 'Engineer', value: 'engineer' }]}
        placeholder="Choose a role"
        rules={{ required: 'Choose a role' }}
      />
      <LumenListBoxController
        aria-label="Managed member"
        control={methods.control}
        id="managed-member"
        name="member"
        options={[{ label: 'Amina', value: 'amina' }, { label: 'Bruno', value: 'bruno' }]}
        rules={{ required: 'Choose a member' }}
      />
      <output data-touched-member>{String(Boolean(methods.formState.touchedFields.member))}</output>
      <output data-touched-date>{String(Boolean(methods.formState.touchedFields.date))}</output>
      <output data-touched-role>{String(Boolean(methods.formState.touchedFields.role))}</output>
      <output data-error-date>{methods.formState.errors.date?.message}</output>
      <button type="submit">Submit</button>
      <button id="outside" type="button">Outside</button>
    </form>
  )
}

const run = async (action: () => unknown): Promise<void> => {
  await act(async () => {
    await action()
    await new Promise(resolve => setTimeout(resolve, 0))
  })
}

const element = <T extends Element>(selector: string, type: new () => T): T => {
  const result = container.querySelector(selector)

  if (!(result instanceof type)) throw new Error(`Missing ${selector}`)

  return result
}

const methods = (): UseFormReturn<Values> => {
  if (!form) throw new Error('Form not rendered')

  return form
}

const triggers = {
  date: () => element('[data-ui-date-picker] [data-ui-date-picker-trigger]', HTMLButtonElement),
  member: () => element('[data-ui-list-box] [data-ui-list-box-list]', HTMLElement),
  role: () => element('[data-ui-select] [data-ui-select-trigger]', HTMLButtonElement)
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

test('invalid submit focuses the visible DatePicker trigger, not the hidden native input', async () => {
  await run(() => {
    element('button[type="submit"]', HTMLButtonElement).click()
  })

  expect(element('[data-error-date]', HTMLOutputElement).textContent).toBe('Choose a date')
  expect(document.activeElement).toBe(triggers.date())
})

test.each(['date', 'member', 'role'] as const)('setFocus(%s) focuses the visible trigger', async name => {
  await run(() => {
    methods().setFocus(name)
  })

  expect(document.activeElement).toBe(triggers[name]())
})

test.each(['date', 'member', 'role'] as const)('leaving the %s trigger marks the field touched', async name => {
  const touched = () => element(`[data-touched-${name}]`, HTMLOutputElement).textContent

  await run(() => {
    triggers[name]().focus()
  })
  expect(touched()).toBe('false')

  await run(() => {
    element('#outside', HTMLButtonElement).focus()
  })
  expect(touched()).toBe('true')
})

test('moving focus from the DatePicker trigger into its calendar does not mark it touched', async () => {
  await run(() => {
    triggers.date().focus()
    triggers.date().click()
  })

  const day = element('[data-ui-date-picker-popover] [role="gridcell"][tabindex="0"]', HTMLElement)

  await run(() => {
    day.focus()
  })
  expect(element('[data-touched-date]', HTMLOutputElement).textContent).toBe('false')

  await run(() => {
    element('#outside', HTMLButtonElement).focus()
  })
  expect(element('[data-touched-date]', HTMLOutputElement).textContent).toBe('true')
})

test('the managed DatePicker still submits its native value and survives a RHF reset', async () => {
  await run(() => {
    methods().setValue('date', '2026-09-10')
  })

  const native = element('[data-ui-date-picker-native]', HTMLInputElement)

  expect(native.value).toBe('2026-09-10')
  expect(new FormData(element('form', HTMLFormElement)).get('date')).toBe('2026-09-10')

  await run(() => {
    methods().reset()
  })
  expect(native.value).toBe('')
  expect(element('[data-touched-date]', HTMLOutputElement).textContent).toBe('false')
})
