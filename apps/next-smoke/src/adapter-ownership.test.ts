// @vitest-environment jsdom
import { act, createElement, type ReactElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'

import { defineLumenElements, enhanceLumenDatePickers } from '@santi020k/lumen-elements'
import { Calendar, DatePicker, InputOTP } from '@santi020k/lumen-react'
import { afterAll, beforeAll, expect, test, vi } from 'vitest'

// Elements controllers are document-wide and cannot be uninstalled, so this file covers React
// islands mounted both before and after registration in a single document.
const mounted: Root[] = []

const tick = async (): Promise<void> => {
  await act(async () => {
    await new Promise(resolve => setTimeout(resolve, 0))
  })
}

const mount = (element: ReactElement): { container: HTMLElement, root: Root } => {
  const container = document.createElement('div')
  const root = createRoot(container)

  document.body.append(container)
  mounted.push(root)
  act(() => {
    root.render(element)
  })

  return { container, root }
}

const query = <T extends Element>(scope: ParentNode, selector: string, type: new () => T): T => {
  const result = scope.querySelector(selector)

  if (!(result instanceof type)) throw new Error(`Missing ${selector}`)

  return result
}

const islands = (id: string) => {
  const calendarChanges: string[] = []
  const datePicker = (value: string) => createElement(
    'div', null, createElement('label', { htmlFor: id }, 'Due date'), createElement(DatePicker, { id, value })
  )
  const picker = mount(datePicker('2026-09-10'))
  const calendar = mount(createElement(Calendar, {
    'aria-label': 'Delivery', defaultValue: '2026-09-10', onValueChange: (value: string) => calendarChanges.push(value)
  }))
  const otp = mount(createElement(InputOTP, { 'aria-label': 'Code', length: 4 }))

  return {
    calendarChanges,
    calendarContainer: calendar.container,
    id,
    datePicker,
    otpContainer: otp.container,
    pickerContainer: picker.container,
    pickerRoot: picker.root
  }
}

let mountedBefore: ReturnType<typeof islands>
let mountedAfter: ReturnType<typeof islands>

beforeAll(async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  mountedBefore = islands('mounted-before-due')
  defineLumenElements(['DatePicker', 'Calendar'])
  mountedAfter = islands('mounted-after-due')
  await tick()
})

afterAll(() => {
  for (const root of mounted) {
    act(() => {
      root.unmount()
    })
  }
  vi.unstubAllGlobals()
})

const orders = [['mounted before registration', () => mountedBefore], ['mounted after registration', () => mountedAfter]] as const

for (const [order, current] of orders) {
  test(`React DatePicker keeps its ids, label, and controlled value when ${order}`, async () => {
    const { datePicker, id, pickerContainer, pickerRoot } = current()
    const trigger = query(pickerContainer, '[data-ui-date-picker-trigger]', HTMLButtonElement)
    const native = query(pickerContainer, '[data-ui-date-picker-native]', HTMLInputElement)

    expect(trigger.id).toBe(id)
    expect(native.id).toBe(`${id}-native`)
    expect(query(pickerContainer, 'label', HTMLLabelElement).control).toBe(trigger)

    act(() => {
      trigger.click()
    })
    expect(trigger.getAttribute('aria-expanded')).toBe('true')
    expect(query(pickerContainer, '[data-ui-date-picker-popover]', HTMLElement).hidden).toBe(false)

    act(() => {
      pickerRoot.render(datePicker('2024-03-12'))
    })
    await tick()

    expect(native.value).toBe('2024-03-12')
    expect(trigger.id).toBe(id)
  })

  test(`React Calendar selection reaches React state when ${order}`, () => {
    const { calendarChanges, calendarContainer } = current()

    act(() => {
      query(calendarContainer, '[data-date="2026-09-15"]', HTMLElement).click()
    })

    expect(calendarChanges).toEqual(['2026-09-15'])
  })

  test(`React InputOTP segments are rendered only by React when ${order}`, () => {
    const { otpContainer } = current()
    const native = query(otpContainer, '[data-ui-input-otp-native]', HTMLInputElement)
    act(() => {
      // The prototype setter keeps React's value tracker in step, like real typing.
      Reflect.set(HTMLInputElement.prototype, 'value', '12', native)
      native.dispatchEvent(new Event('input', { bubbles: true }))
    })

    const segments = [...otpContainer.querySelectorAll('[data-ui-input-otp-char]')].map(segment => segment.textContent.trim())

    expect(segments.join('')).toBe(native.value)
  })
}

test('explicit enhancement still binds standards-based date picker markup', () => {
  const container = document.createElement('div')

  container.innerHTML = `<div data-ui-date-picker>
    <input id="standard-due" aria-label="Standard due" type="date" data-ui-date-picker-native>
    <div data-ui-date-picker-control hidden><button data-ui-date-picker-trigger><span data-ui-date-picker-value></span></button></div>
    <div data-ui-date-picker-popover hidden><lumen-calendar></lumen-calendar></div>
  </div>`
  document.body.append(container)
  enhanceLumenDatePickers(container)

  expect(query(container, '[data-ui-date-picker-trigger]', HTMLButtonElement).id).toBe('standard-due')
  expect(query(container, '[data-ui-date-picker-control]', HTMLElement).hidden).toBe(false)
  container.remove()
})
