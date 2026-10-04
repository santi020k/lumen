// @vitest-environment jsdom
import { act, createElement, useState } from 'react'
import { createRoot } from 'react-dom/client'

import { expect, test } from 'vitest'

import { DateRangeCalendar } from './date-range-calendar.js'

const Harness = () => {
  const [value, setValue] = useState({ start: '2026-09-10', end: '2026-09-20' })

  return createElement(DateRangeCalendar, {
    value,
    onValueChange: setValue,
    locale: 'en-US',
    min: '2026-01-01',
    max: '2026-12-31',
    labels: { start: 'From', end: 'To', presets: 'Quick range' },
    presets: [
      { label: 'October', value: { start: '2026-10-01', end: '2026-10-31' } },
      { label: 'September', value: { start: '2026-09-10', end: '2026-09-20' } },
      { label: 'Same dates', value: { start: '2026-09-10', end: '2026-09-20' } }
    ]
  })
}

test('highlights inclusive ranges, adjusts crossed endpoints and follows preset months', async () => {
  const container = document.createElement('div')

  document.body.append(container)

  const root = createRoot(container)
  const click = async (selector: string) => {
    const target = container.querySelector(selector)

    if (!(target instanceof HTMLElement)) throw new Error(`Missing ${selector}`)

    await act(async () => {
      await Promise.resolve()
      target.click()
    })
  }

  try {
    await act(async () => {
      await Promise.resolve()
      root.render(createElement(Harness))
    })
    expect(container.querySelector('[data-date="2026-09-15"]')?.getAttribute('aria-selected')).toBe('true')
    expect(container.querySelectorAll('button[aria-pressed="true"]')).toHaveLength(1)
    await click('nav button:last-child')
    expect(container.querySelectorAll('button[aria-pressed="true"]')).toHaveLength(1)
    expect(container.querySelector('button[aria-pressed="true"]')?.textContent).toBe('Same dates')
    await click('section:first-child [data-date="2026-09-25"]')
    expect([...container.querySelectorAll('.ui-range-calendar__endpoint strong')].map(element => element.textContent))
      .toEqual(['2026-09-25', '2026-09-25'])
    await click('button[aria-pressed]')
    expect([...container.querySelectorAll('[data-ui-calendar-label]')].every(element => element.textContent.includes('October'))).toBe(true)
    expect(container.querySelector('[data-date="2026-10-15"]')?.getAttribute('data-in-range')).toBe('true')
    const day = container.querySelector('section:first-child [data-date="2026-10-01"]')

    if (!(day instanceof HTMLElement)) throw new Error('Missing selected day')

    day.focus()
    await act(async () => {
      await Promise.resolve()
      day.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }))
    })
    expect(document.activeElement?.getAttribute('data-date')).toBe('2026-10-02')
    await act(async () => {
      await Promise.resolve()
      document.activeElement?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    })
    expect(container.querySelector('.ui-range-calendar__endpoint strong')?.textContent).toBe('2026-10-02')
  } finally {
    await act(async () => {
      await Promise.resolve()
      root.unmount()
    })
    container.remove()
  }
})

test.each(['ltr', 'rtl'] as const)('moves focus in both range calendars in %s direction', async dir => {
  const container = document.createElement('div')
  document.body.append(container)
  const root = createRoot(container)
  try {
    await act(async () => {
      await Promise.resolve()
      root.render(createElement(DateRangeCalendar, {
        dir,
        value: { start: '2026-09-10', end: '2026-09-20' },
        onValueChange: () => undefined,
        locale: 'en-US',
        labels: { start: 'From', end: 'To', presets: 'Quick range' }
      }))
    })
    for (const [index, date] of ['2026-09-10', '2026-09-20'].entries()) {
      const day = container.querySelectorAll('section')[index]?.querySelector(`[data-date="${date}"]`)
      if (!(day instanceof HTMLElement)) throw new Error('Missing range day')
      day.focus()
      await act(async () => {
        await Promise.resolve()
        day.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }))
      })
      expect(document.activeElement?.getAttribute('data-date')).toBe(
        `2026-09-${String(Number(date.slice(-2)) + (dir === 'rtl' ? -1 : 1)).padStart(2, '0')}`
      )
      await act(async () => {
        await Promise.resolve()
        document.activeElement?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }))
      })
      expect(document.activeElement?.getAttribute('data-date')).toBe(date)
    }
  } finally {
    await act(async () => {
      await Promise.resolve()
      root.unmount()
    })
    container.remove()
  }
})
