/* eslint-disable complexity, @typescript-eslint/no-non-null-assertion */
/* cspell:ignore valuenow */

// @vitest-environment jsdom

import { lumenComponentNames } from '@santi020k/lumen-core'

import { afterEach, beforeAll, beforeEach, describe, expect, test, vi } from 'vitest'

import {
  defineLumenElements,
  enhanceLumenCalendars,
  enhanceLumenContextMenus,
  enhanceLumenDatePickers,
  enhanceLumenDateRangePickers,
  enhanceLumenForms,
  enhanceLumenInputOTPs,
  enhanceLumenResizable,
  enhanceLumenRichTextEditors,
  enhanceLumenSchedules,
  LumenButtonElement,
  LumenCardElement,
  lumenElementDefinitions,
  LumenIconElement,
  LumenToast
} from './index.js'

const press = (element: Element, key: string, init: KeyboardEventInit = {}) => {
  element.dispatchEvent(new KeyboardEvent('keydown', {
    bubbles: true,
    cancelable: true,
    key,
    ...init
  }))
}

const createDragEvent = (
  type: string,
  dataTransfer: Pick<DataTransfer, 'getData' | 'setData'>
) => {
  const event = new Event(type, { bubbles: true, cancelable: true })

  Object.defineProperty(event, 'dataTransfer', {
    configurable: true,
    value: dataTransfer
  })

  return event
}

beforeAll(() => {
  Object.defineProperty(HTMLElement.prototype, 'checkVisibility', {
    configurable: true,
    value: () => true
  })

  defineLumenElements(customElements)
})

beforeEach(() => {
  document.body.innerHTML = ''
  defineLumenElements(customElements)
})

afterEach(() => {
  vi.useRealTimers()
})

describe('@santi020k/lumen-elements', () => {
  test('registers one custom element for every shared catalog name', () => {
    expect(lumenElementDefinitions).toHaveLength(lumenComponentNames.length)

    for (const [tagName, element] of lumenElementDefinitions) {
      expect(customElements.get(tagName)).toBe(element)
    }
  })

  test('registers custom elements once', () => {
    defineLumenElements(customElements)
    defineLumenElements(customElements)

    expect(customElements.get('lumen-button')).toBe(LumenButtonElement)
    expect(customElements.get('lumen-card')).toBe(LumenCardElement)
    expect(customElements.get('lumen-icon')).toBe(LumenIconElement)
  })

  test('keeps motion elements readable when motion is reduced', () => {
    vi.stubGlobal('matchMedia', vi.fn(() => ({
      addEventListener: vi.fn(),
      matches: true,
      media: '(prefers-reduced-motion: reduce)',
      onchange: null,
      removeEventListener: vi.fn()
    })))

    const number = document.createElement('lumen-animated-number')

    number.setAttribute('decimals', '1')
    number.setAttribute('suffix', '%')
    number.setAttribute('value', '99.8')

    const group = document.createElement('lumen-reveal-group')

    group.innerHTML = '<article>Plan</article><article>Ship</article>'
    document.body.append(number, group)

    expect(number.textContent).toBe('99.8%')
    expect(number.getAttribute('aria-label')).toBe('99.8%')
    expect(group.classList).toContain('is-revealed')
    expect((group.children[1] as HTMLElement).style.getPropertyValue('--ui-reveal-index')).toBe('1')

    vi.unstubAllGlobals()
  })

  test('applies primitive classes when elements connect', () => {
    const button = document.createElement('lumen-button')
    const card = document.createElement('lumen-card')

    document.body.append(button, card)

    expect([...button.classList].sort()).toEqual(['ui-button', 'ui-button--default', 'ui-button--default-size'].sort())
    expect(button.getAttribute('role')).toBe('button')
    expect(button.tabIndex).toBe(0)
    expect([...card.classList]).toEqual(['ui-card'])
  })

  test('renders named Lucide icons with accessible labels', () => {
    const icon = document.createElement('lumen-icon')

    icon.setAttribute('name', 'search')
    icon.setAttribute('label', 'Search')
    document.body.append(icon)

    expect([...icon.classList]).toEqual(['ui-icon'])
    expect(icon.getAttribute('role')).toBe('img')
    expect(icon.getAttribute('aria-label')).toBe('Search')
    expect(icon.querySelector('svg')?.classList.contains('lucide-search')).toBe(true)

    icon.setAttribute('decorative', '')
    expect(icon.getAttribute('aria-hidden')).toBe('true')
    expect(icon.hasAttribute('role')).toBe(false)
  })

  test('applies glass attribute classes', () => {
    const card = document.createElement('lumen-card')
    const dialog = document.createElement('lumen-dialog')
    const table = document.createElement('lumen-table')

    card.setAttribute('glass', '')
    dialog.setAttribute('glass', '')
    table.setAttribute('glass', '')
    document.body.append(card, dialog, table)

    expect(card.classList.contains('ui-card--glass')).toBe(true)
    expect(dialog.classList.contains('ui-dialog--glass')).toBe(true)
    expect(table.classList.contains('ui-table-wrap--glass')).toBe(true)
    expect(dialog.getAttribute('surface')).toBe('default')
  })

  test('applies code defaults and variant classes', () => {
    const inlineCode = document.createElement('lumen-code')
    const blockCode = document.createElement('lumen-code')

    blockCode.setAttribute('variant', 'block')
    blockCode.setAttribute('wrap', '')
    document.body.append(inlineCode, blockCode)

    expect([...inlineCode.classList].sort()).toEqual(['ui-code', 'ui-code--inline'].sort())
    expect(inlineCode.getAttribute('data-code-theme')).toBe('auto')
    expect(inlineCode.getAttribute('variant')).toBe('inline')
    expect(blockCode.classList.contains('ui-code--block')).toBe(true)
    expect(blockCode.classList.contains('ui-code--wrap')).toBe(true)
  })

  test('supports the flush accordion variant', () => {
    const accordion = document.createElement('lumen-accordion')

    accordion.setAttribute('variant', 'flush')
    document.body.append(accordion)

    expect(accordion.classList.contains('ui-accordion--flush')).toBe(true)
    expect(accordion.getAttribute('variant')).toBe('flush')
  })

  test('dialog triggers manage focus, Escape, outside click, and return focus', () => {
    document.body.innerHTML = `
      <button id="open-dialog" data-ui-dialog-trigger="profile-dialog">Edit profile</button>
      <lumen-dialog id="profile-dialog">
        <input id="profile-name" />
        <button id="profile-save" data-ui-dialog-close>Save</button>
      </lumen-dialog>
    `

    const trigger = document.querySelector<HTMLButtonElement>('#open-dialog')
    const dialog = document.querySelector<HTMLElement>('#profile-dialog')
    const input = document.querySelector<HTMLInputElement>('#profile-name')
    const save = document.querySelector<HTMLButtonElement>('#profile-save')

    expect(dialog?.hidden).toBe(true)

    trigger?.click()

    expect(dialog?.hidden).toBe(false)
    expect(dialog?.dataset.state).toBe('open')
    expect(document.activeElement).toBe(input)

    save?.focus()
    press(dialog!, 'Tab')
    expect(document.activeElement).toBe(input)

    press(dialog!, 'Escape')
    expect(dialog?.hidden).toBe(true)
    expect(dialog?.dataset.state).toBe('closed')
    expect(document.activeElement).toBe(trigger)

    trigger?.click()
    document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }))

    expect(dialog?.hidden).toBe(true)
  })

  test('popover and dropdown disclosure listeners clean up across reconnects', () => {
    document.body.innerHTML = `
      <lumen-popover id="popover">
        <button id="popover-trigger" data-ui-trigger aria-controls="popover-panel">Open</button>
        <div id="popover-panel" hidden>
          <button id="popover-first">First</button>
          <button id="popover-second">Second</button>
        </div>
      </lumen-popover>
      <lumen-dropdown-menu>
        <button id="menu-trigger" data-ui-trigger aria-controls="menu-panel">Actions</button>
        <div id="menu-panel" hidden><button id="menu-item">Rename</button></div>
      </lumen-dropdown-menu>
    `

    const popover = document.querySelector<HTMLElement>('#popover')
    const trigger = document.querySelector<HTMLButtonElement>('#popover-trigger')
    const panel = document.querySelector<HTMLElement>('#popover-panel')
    const first = document.querySelector<HTMLButtonElement>('#popover-first')
    const second = document.querySelector<HTMLButtonElement>('#popover-second')
    const menuTrigger = document.querySelector<HTMLButtonElement>('#menu-trigger')
    const menuPanel = document.querySelector<HTMLElement>('#menu-panel')

    trigger?.click()
    expect(trigger?.getAttribute('aria-expanded')).toBe('true')
    expect(panel?.hidden).toBe(false)

    press(trigger as HTMLElement, 'ArrowDown')
    expect(document.activeElement).toBe(first)

    press(panel!, 'ArrowDown')
    expect(document.activeElement).toBe(second)

    press(panel!, 'Escape')
    expect(trigger?.getAttribute('aria-expanded')).toBe('false')
    expect(document.activeElement).toBe(trigger)

    trigger?.click()
    document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }))
    expect(panel?.hidden).toBe(true)

    popover?.remove()
    document.body.append(popover!)
    trigger?.click()
    expect(panel?.hidden).toBe(false)
    trigger?.click()
    expect(panel?.hidden).toBe(true)

    menuTrigger?.click()
    expect(menuPanel?.hidden).toBe(false)
  })

  test('tabs use roving tabindex with arrow, Home, and End navigation', () => {
    document.body.innerHTML = `
      <lumen-tabs>
        <div role="tablist">
          <button id="tab-one" role="tab" aria-selected="true" aria-controls="panel-one">One</button>
          <button id="tab-two" role="tab" aria-selected="false" aria-controls="panel-two">Two</button>
          <button id="tab-three" role="tab" aria-selected="false" aria-controls="panel-three">Three</button>
        </div>
        <section id="panel-one" role="tabpanel">One panel</section>
        <section id="panel-two" role="tabpanel" hidden>Two panel</section>
        <section id="panel-three" role="tabpanel" hidden>Three panel</section>
      </lumen-tabs>
    `

    const first = document.querySelector<HTMLButtonElement>('#tab-one')
    const second = document.querySelector<HTMLButtonElement>('#tab-two')
    const third = document.querySelector<HTMLButtonElement>('#tab-three')

    press(first as HTMLElement, 'ArrowRight')
    expect(second?.getAttribute('aria-selected')).toBe('true')
    expect(second?.tabIndex).toBe(0)
    expect(document.querySelector<HTMLElement>('#panel-two')?.hidden).toBe(false)

    press(second as HTMLElement, 'End')
    expect(third?.getAttribute('aria-selected')).toBe('true')

    press(third as HTMLElement, 'Home')
    expect(first?.getAttribute('aria-selected')).toBe('true')
  })

  test('select enhances native select markup with listbox keyboard interaction', () => {
    const changes: string[] = []

    document.body.innerHTML = `
      <label for="plan-select">Plan</label>
      <lumen-select>
        <select id="plan-select" name="plan" data-ui-select-native required>
          <option data-ui-select-placeholder disabled selected value="">Choose a plan</option>
          <option value="free">Free</option>
          <option value="pro">Pro</option>
          <option value="team" disabled>Team</option>
        </select>
        <div data-ui-select-control hidden>
          <button data-ui-select-trigger type="button"><span data-ui-select-value></span></button>
          <div data-ui-select-list hidden role="listbox"></div>
        </div>
      </lumen-select>
    `

    const root = document.querySelector<HTMLElement>('lumen-select')
    const select = document.querySelector<HTMLSelectElement>('#plan-select')
    const trigger = document.querySelector<HTMLButtonElement>('[data-ui-select-trigger]')
    const listbox = document.querySelector<HTMLElement>('[data-ui-select-list]')

    select?.addEventListener('change', () => {
      changes.push(select.value)
    })

    expect(trigger?.getAttribute('aria-label')).toBe('Plan')
    expect(trigger?.getAttribute('aria-required')).toBe('true')
    expect(listbox?.querySelectorAll('[data-ui-select-option]')).toHaveLength(3)
    expect(root?.dataset.placeholder).toBe('true')

    press(trigger as HTMLElement, 'ArrowDown')
    expect(trigger?.getAttribute('aria-expanded')).toBe('true')
    expect(listbox?.hidden).toBe(false)
    expect(document.activeElement?.textContent).toBe('Pro')

    press(listbox!, 'p')
    expect(document.activeElement?.textContent).toBe('Pro')

    press(document.activeElement as HTMLElement, 'Enter')
    expect(select?.value).toBe('pro')
    expect(changes).toEqual(['pro'])
    expect(trigger?.getAttribute('aria-expanded')).toBe('false')
    expect(root?.dataset.placeholder).toBe('false')
    expect(document.querySelector('[aria-selected="true"]')?.textContent).toBe('Pro')

    trigger?.click()
    document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }))
    expect(listbox?.hidden).toBe(true)
  })

  test('select creates native form controls for plain option markup', () => {
    document.body.innerHTML = `
      <form id="billing">
        <lumen-select name="plan" required>
          <option value="starter">Starter</option>
          <option value="business">Business</option>
        </lumen-select>
      </form>
    `

    const select = document.querySelector<HTMLSelectElement>('lumen-select select')
    const trigger = document.querySelector<HTMLButtonElement>('[data-ui-select-trigger]')
    const business = [...document.querySelectorAll<HTMLElement>('[data-ui-select-option]')]
      .find(item => item.dataset.value === 'business')

    business?.click()

    expect(select?.name).toBe('plan')
    expect(select?.required).toBe(true)
    expect(select?.value).toBe('business')
    expect(new FormData(document.querySelector<HTMLFormElement>('#billing')!).get('plan')).toBe('business')
    expect(trigger?.textContent).toBe('Business')
  })

  test('forms reflect native validation into field errors and events', () => {
    const events: string[] = []

    document.body.innerHTML = `
      <form data-ui-form id="signup">
        <lumen-field>
          <label for="email">Email</label>
          <input id="email" name="email" required data-error-required="Email required" />
          <p data-ui-field-error hidden></p>
        </lumen-field>
        <button type="submit">Submit</button>
      </form>
    `

    enhanceLumenForms(document)

    const form = document.querySelector<HTMLFormElement>('#signup')
    const input = document.querySelector<HTMLInputElement>('#email')
    const error = document.querySelector<HTMLElement>('[data-ui-field-error]')

    form?.addEventListener('ui:validate', event => {
      const detail = (event as CustomEvent<{ control: HTMLInputElement }>).detail

      events.push(`validate:${detail.control.id}`)
    })

    form?.addEventListener('ui:invalid', event => {
      const detail = (event as CustomEvent<{ controls: HTMLInputElement[] }>).detail

      events.push(`invalid:${detail.controls.length}`)
    })

    form?.addEventListener('ui:valid', () => {
      events.push('valid')
    })

    const submitPrevented = !form?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))

    expect(submitPrevented).toBe(true)
    expect(input?.getAttribute('aria-invalid')).toBe('true')
    expect(input?.getAttribute('aria-describedby')).toContain(error?.id)
    expect(error?.hidden).toBe(false)
    expect(error?.textContent).toBe('Email required')
    expect(events).toEqual(['validate:email', 'invalid:1'])

    if (input) {
      input.value = 'me@example.com'
      input.dispatchEvent(new Event('focusout', { bubbles: true }))
    }

    expect(input?.hasAttribute('aria-invalid')).toBe(false)
    expect(error?.hidden).toBe(true)
    expect(events).toEqual(['validate:email', 'invalid:1', 'validate:email', 'valid'])
  })

  test('date range pickers keep native date inputs in range', () => {
    document.body.innerHTML = `
      <lumen-date-range-picker>
        <input id="start-date" type="date" value="2026-07-10" />
        <input id="end-date" type="date" value="2026-07-08" />
      </lumen-date-range-picker>
    `

    enhanceLumenDateRangePickers(document)

    const start = document.querySelector<HTMLInputElement>('#start-date')
    const end = document.querySelector<HTMLInputElement>('#end-date')
    const root = document.querySelector<HTMLElement>('lumen-date-range-picker')

    expect(end?.min).toBe('2026-07-10')
    expect(end?.value).toBe('2026-07-10')
    expect(root?.dataset.rangeState).toBe('complete')
    expect(start?.dataset.uiDateRangeInputBound).toBe('true')
    expect(end?.dataset.uiDateRangeInputBound).toBe('true')

    if (start) {
      start.value = ''
      start.dispatchEvent(new Event('change', { bubbles: true }))
    }

    expect(end?.hasAttribute('min')).toBe(false)
    expect(root?.dataset.rangeState).toBe('empty')
  })

  test('date pickers install their disclosure behavior', () => {
    document.body.innerHTML = `
      <lumen-date-picker>
        <input data-ui-date-picker-native type="date" value="2026-07-23" />
        <div data-ui-date-picker-control hidden>
          <button data-ui-date-picker-trigger aria-expanded="false">Choose date</button>
          <span data-ui-date-picker-value>2026-07-23</span>
        </div>
        <div data-ui-date-picker-popover hidden></div>
      </lumen-date-picker>
    `

    enhanceLumenDatePickers(document)

    const root = document.querySelector<HTMLElement>('lumen-date-picker')
    const native = document.querySelector<HTMLInputElement>('[data-ui-date-picker-native]')
    const control = document.querySelector<HTMLElement>('[data-ui-date-picker-control]')
    const trigger = document.querySelector<HTMLButtonElement>('[data-ui-date-picker-trigger]')
    const popover = document.querySelector<HTMLElement>('[data-ui-date-picker-popover]')

    expect(root?.dataset.uiBound).toBe('true')
    expect(native?.dataset.uiEnhanced).toBe('true')
    expect(control?.hidden).toBe(false)

    trigger?.click()

    expect(trigger?.getAttribute('aria-expanded')).toBe('true')
    expect(popover?.hidden).toBe(false)
    expect(popover?.dataset.state).toBe('open')
  })

  test('input OTP creates native input and visual segments', () => {
    document.body.innerHTML = `
      <lumen-input-otp length="4" name="code" value="12a3"></lumen-input-otp>
    `

    enhanceLumenInputOTPs(document)

    const root = document.querySelector<HTMLElement>('lumen-input-otp')
    const input = document.querySelector<HTMLInputElement>('[data-ui-input-otp-native]')
    const segmentsRoot = document.querySelector<HTMLElement>('[data-ui-input-otp-segments]')
    const segments = [...document.querySelectorAll<HTMLButtonElement>('[data-ui-input-otp-segment]')]

    expect(root?.classList.contains('ui-input-otp-field')).toBe(true)
    expect(root?.dataset.uiBound).toBe('true')
    expect(root?.dataset.uiInputOtpLength).toBe('4')
    expect(input?.classList.contains('ui-input-otp__native')).toBe(true)
    expect(input?.dataset.uiEnhanced).toBe('true')
    expect(input?.name).toBe('code')
    expect(input?.value).toBe('123')
    expect(segmentsRoot?.hidden).toBe(false)
    expect(segments).toHaveLength(4)
    expect(segments[0]?.textContent).toBe('1')
    expect(segments[3]?.textContent).toBe('\u00a0')

    const paste = new Event('paste', { bubbles: true, cancelable: true })

    Object.defineProperty(paste, 'clipboardData', {
      configurable: true,
      value: { getData: () => '98x7' }
    })

    input?.dispatchEvent(paste)

    expect(input?.value).toBe('987')
    expect(segments[0]?.textContent).toBe('9')
    expect(segments[2]?.textContent).toBe('7')
  })

  test('resizable panes get handles and keyboard resizing', () => {
    document.body.innerHTML = `
      <lumen-resizable data-ui-resizable-default-sizes="25,75">
        <aside id="nav">Navigation</aside>
        <main id="editor">Editor</main>
      </lumen-resizable>
    `

    enhanceLumenResizable(document)

    const root = document.querySelector<HTMLElement>('lumen-resizable')
    const nav = document.querySelector<HTMLElement>('#nav')
    const editor = document.querySelector<HTMLElement>('#editor')
    const handle = document.querySelector<HTMLElement>('[data-ui-resizable-handle]')

    expect(root?.dataset.uiResizableEnhanced).toBe('true')
    expect(nav?.dataset.uiResizablePanel).toBe('')
    expect(editor?.dataset.uiResizablePanel).toBe('')
    expect(nav?.style.getPropertyValue('--ui-resizable-size')).toBe('25%')
    expect(editor?.style.getPropertyValue('--ui-resizable-size')).toBe('75%')
    expect(handle?.getAttribute('role')).toBe('separator')
    expect(handle?.getAttribute('aria-valuenow')).toBe('25')

    press(handle!, 'ArrowRight')

    expect(nav?.style.getPropertyValue('--ui-resizable-size')).toBe('27%')
    expect(editor?.style.getPropertyValue('--ui-resizable-size')).toBe('73%')
  })

  test('calendar creates a selectable date grid', () => {
    document.body.innerHTML = `
      <lumen-calendar month="2026-07" name="delivery" value="2026-07-10"></lumen-calendar>
    `

    enhanceLumenCalendars(document)

    const root = document.querySelector<HTMLElement>('lumen-calendar')
    const input = document.querySelector<HTMLInputElement>('[data-ui-calendar-input]')
    const label = document.querySelector<HTMLElement>('[data-ui-calendar-label]')
    const selected = document.querySelector<HTMLElement>('[data-ui-calendar-day][data-date="2026-07-10"]')
    const nextDate = document.querySelector<HTMLElement>('[data-ui-calendar-day][data-date="2026-07-15"]')

    expect(root?.dataset.uiBound).toBe('true')
    expect(root?.dataset.uiCalendarMonth).toBe('2026-07')
    expect(input?.name).toBe('delivery')
    expect(input?.value).toBe('2026-07-10')
    expect(label?.textContent).toBe('July 2026')
    expect(selected?.dataset.selected).toBe('true')

    nextDate?.click()

    expect(input?.value).toBe('2026-07-15')
    expect(root?.dataset.uiCalendarValue).toBe('2026-07-15')
  })

  test('data table selects rows, submits values, and sorts columns', () => {
    const selectionEvents: string[][] = []

    document.body.innerHTML = `
      <form id="orders-form">
        <lumen-data-table selectable name="orders">
          <table>
            <thead>
              <tr>
                <th data-ui-datatable-sortable="true">Name</th>
                <th data-ui-datatable-sortable="true" data-ui-datatable-sort-type="number">Count</th>
              </tr>
            </thead>
            <tbody>
              <tr data-value="beta"><td>Beta</td><td data-sort-value="2">2</td></tr>
              <tr data-value="alpha"><td>Alpha</td><td data-sort-value="1">1</td></tr>
            </tbody>
          </table>
        </lumen-data-table>
      </form>
    `

    const root = document.querySelector<HTMLElement>('lumen-data-table')
    const form = document.querySelector<HTMLFormElement>('#orders-form')
    const rowChecks = [...document.querySelectorAll<HTMLInputElement>('[data-ui-datatable-row-select]')]
    const selectAll = document.querySelector<HTMLInputElement>('[data-ui-datatable-select-all]')
    const sortButtons = [...document.querySelectorAll<HTMLButtonElement>('[data-ui-datatable-sort]')]

    root?.addEventListener('ui:data-table-selection-change', event => {
      selectionEvents.push((event as CustomEvent<{ values: string[] }>).detail.values)
    })

    let legacyEventCount = 0

    root?.addEventListener('ui:datatable-selection-change', () => {
      legacyEventCount += 1
    })

    expect(rowChecks).toHaveLength(2)
    expect(selectAll?.checked).toBe(false)
    expect(root?.getAttribute('data-ui-datatable')).toBe('')

    rowChecks[1]?.click()

    expect(selectionEvents).toEqual([['alpha']])
    expect(legacyEventCount).toBe(1)
    expect(rowChecks[1]?.closest('tr')?.dataset.state).toBe('selected')
    expect(new FormData(form!).getAll('orders')).toEqual(['alpha'])

    selectAll?.click()

    expect(selectAll?.checked).toBe(true)
    expect(new FormData(form!).getAll('orders')).toEqual(['beta', 'alpha'])

    sortButtons[1]?.click()

    expect(root?.dataset.uiDatatableSortDirection).toBe('ascending')
    expect(document.querySelector<HTMLTableSectionElement>('tbody')?.rows[0]?.dataset.value).toBe('alpha')

    sortButtons[1]?.click()

    expect(root?.dataset.uiDatatableSortDirection).toBe('descending')
    expect(document.querySelector<HTMLTableSectionElement>('tbody')?.rows[0]?.dataset.value).toBe('beta')
  })

  test('virtual list emits visible ranges and hides offscreen items', () => {
    const ranges: { endIndex: number, startIndex: number }[] = []
    const root = document.createElement('lumen-virtual-list')

    root.setAttribute('data-ui-item-size', '44')
    root.setAttribute('data-ui-overscan', '0')

    Object.defineProperty(root, 'clientHeight', {
      configurable: true,
      value: 88
    })

    for (const label of ['One', 'Two', 'Three', 'Four', 'Five', 'Six']) {
      const item = document.createElement('div')

      item.textContent = label

      root.append(item)
    }

    root.addEventListener('ui:virtual-list-range', event => {
      ranges.push((event as CustomEvent<{ endIndex: number, startIndex: number }>).detail)
    })

    document.body.append(root)

    expect(ranges[0]).toEqual({ endIndex: 2, startIndex: 0 })
    expect(root.children[3]?.hasAttribute('hidden')).toBe(true)

    root.scrollTop = 88
    root.dispatchEvent(new Event('scroll'))

    expect(ranges.at(-1)).toEqual({ endIndex: 4, startIndex: 2 })
    expect(root.children[0]?.hasAttribute('hidden')).toBe(true)
    expect(root.children[2]?.hasAttribute('hidden')).toBe(false)
  })

  test('theme builder applies tokens and emits export events', () => {
    const writeText = vi.fn(() => Promise.resolve())
    const exports: { format: string, value: string }[] = []

    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText }
    })

    document.body.innerHTML = `
      <div id="theme-preview"></div>
      <lumen-theme-builder data-ui-theme-target="#theme-preview">
        <input data-ui-theme-brand-hue type="range" max="360" value="264" />
        <input data-ui-theme-accent-hue type="range" max="360" value="54" />
        <button data-ui-theme-export-format="tokens" type="button">Tokens</button>
        <button data-ui-theme-export type="button">Copy</button>
        <textarea data-ui-theme-output></textarea>
      </lumen-theme-builder>
    `

    const root = document.querySelector<HTMLElement>('lumen-theme-builder')
    const preview = document.querySelector<HTMLElement>('#theme-preview')
    const hue = document.querySelector<HTMLInputElement>('[data-ui-theme-brand-hue]')
    const format = document.querySelector<HTMLButtonElement>('[data-ui-theme-export-format]')
    const exportButton = document.querySelector<HTMLButtonElement>('[data-ui-theme-export]')
    const output = document.querySelector<HTMLTextAreaElement>('[data-ui-theme-output]')

    root?.addEventListener('ui:theme-export', event => {
      exports.push((event as CustomEvent<{ format: string, value: string }>).detail)
    })

    expect(preview?.style.getPropertyValue('--brand')).toBe('264 85% 53%')
    expect(output?.value).toContain('color-scheme: light;')

    if (hue) {
      hue.value = '260'
      hue.dispatchEvent(new Event('input'))
    }

    expect(preview?.style.getPropertyValue('--brand')).toBe('260 85% 53%')

    format?.click()
    expect(output?.value).toContain('"$type": "color"')

    exportButton?.click()

    expect(exports).toHaveLength(1)
    expect(exports[0]?.format).toBe('tokens')
    expect(writeText).toHaveBeenCalledWith(output?.value)
  })

  test('rich text editor controls execute commands and emit events', () => {
    const execCommand = vi.fn(() => true)
    const commands: string[] = []
    const changes: string[] = []

    Object.defineProperty(document, 'execCommand', {
      configurable: true,
      value: execCommand
    })

    document.body.innerHTML = `
      <lumen-rich-text-editor>
        <button data-ui-editor-command="bold" type="button">Bold</button>
        <button data-ui-editor-command="formatBlock" data-ui-editor-value="h2" type="button">Heading</button>
        <div contenteditable="true"><p>Draft</p></div>
      </lumen-rich-text-editor>
    `

    enhanceLumenRichTextEditors(document)

    const root = document.querySelector<HTMLElement>('lumen-rich-text-editor')
    const button = document.querySelector<HTMLButtonElement>('[data-ui-editor-command]')

    root?.addEventListener('ui:editor-command', event => {
      commands.push((event as CustomEvent<{ command: string }>).detail.command)
    })
    root?.addEventListener('ui:editor-change', event => {
      changes.push((event as CustomEvent<{ html: string }>).detail.html)
    })

    button?.click()
    document.querySelector<HTMLButtonElement>('[data-ui-editor-value]')?.click()
    document.querySelector<HTMLElement>('[contenteditable]')?.dispatchEvent(new KeyboardEvent('keydown', {
      bubbles: true,
      ctrlKey: true,
      key: 'i'
    }))

    expect(execCommand).toHaveBeenCalledWith('bold')
    expect(execCommand).toHaveBeenCalledWith('formatBlock', false, 'h2')
    expect(execCommand).toHaveBeenCalledWith('italic')
    expect(commands).toEqual(['bold', 'formatBlock', 'italic'])
    expect(changes.at(-1)).toBe('<p>Draft</p>')
    expect(root?.dataset.uiEditorBound).toBe('true')
    expect(button?.dataset.uiEditorCommandBound).toBe('true')
  })

  test('schedule slots accept dropped events and emit changes', () => {
    const changes: unknown[] = []
    const transferData: Record<string, string> = {}
    const dataTransfer = {
      getData: vi.fn((type: string) => transferData[type] ?? ''),
      setData: vi.fn((type: string, value: string) => {
        transferData[type] = value
      })
    }

    document.body.innerHTML = `
      <lumen-schedule>
        <section data-ui-schedule-slot="monday">
          <article id="schedule-planning" data-ui-draggable="true" data-ui-schedule-event>Planning</article>
        </section>
        <section data-ui-schedule-slot="friday"></section>
      </lumen-schedule>
    `

    enhanceLumenSchedules(document)

    const root = document.querySelector<HTMLElement>('lumen-schedule')
    const planning = document.querySelector<HTMLElement>('#schedule-planning')
    const monday = document.querySelector<HTMLElement>('[data-ui-schedule-slot="monday"]')
    const friday = document.querySelector<HTMLElement>('[data-ui-schedule-slot="friday"]')

    root?.addEventListener('ui:schedule-change', event => {
      changes.push((event as CustomEvent<{ eventId: string, slot: string }>).detail)
    })

    planning?.dispatchEvent(createDragEvent('dragstart', dataTransfer))

    expect(dataTransfer.setData).toHaveBeenCalledWith('text/plain', 'schedule-planning')
    expect(root?.dataset.uiDragging).toBe('true')
    expect(planning?.draggable).toBe(true)

    const dragOverPrevented = !friday?.dispatchEvent(createDragEvent('dragover', dataTransfer))

    expect(dragOverPrevented).toBe(true)
    expect(friday?.dataset.state).toBe('drag-over')

    friday?.dispatchEvent(createDragEvent('drop', dataTransfer))

    expect(friday?.dataset.state).toBeUndefined()
    expect(friday?.contains(planning ?? null)).toBe(true)
    expect(monday?.contains(planning ?? null)).toBe(false)
    expect(changes).toEqual([{ eventId: 'schedule-planning', slot: 'friday' }])

    planning?.dispatchEvent(createDragEvent('dragend', dataTransfer))

    expect(root?.dataset.uiDragging).toBeUndefined()
  })

  test('context menu triggers open, focus, and close menus', () => {
    document.body.innerHTML = `
      <button data-ui-context-menu-trigger="project-menu" id="project-trigger">Project</button>
      <lumen-context-menu id="project-menu">
        <button role="menuitem" type="button">Duplicate</button>
        <button role="menuitem" type="button">Delete</button>
      </lumen-context-menu>
    `

    enhanceLumenContextMenus(document)

    const trigger = document.querySelector<HTMLButtonElement>('#project-trigger')
    const menu = document.querySelector<HTMLElement>('#project-menu')
    const firstItem = document.querySelector<HTMLButtonElement>('[role="menuitem"]')

    expect(menu?.hidden).toBe(true)
    expect(menu?.dataset.state).toBe('closed')

    const contextMenuPrevented = !trigger?.dispatchEvent(new MouseEvent('contextmenu', {
      bubbles: true,
      cancelable: true,
      clientX: 24,
      clientY: 32
    }))

    expect(contextMenuPrevented).toBe(true)
    expect(menu?.hidden).toBe(false)
    expect(menu?.dataset.state).toBe('open')
    expect(menu?.style.position).toBe('fixed')

    firstItem?.click()

    expect(menu?.hidden).toBe(true)
    expect(menu?.dataset.state).toBe('closed')

    press(trigger!, 'F10', { shiftKey: true })

    expect(menu?.hidden).toBe(false)

    document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }))

    expect(menu?.hidden).toBe(true)
  })

  test('tooltip wires aria-describedby and dismisses with Escape', () => {
    vi.useFakeTimers()

    document.body.innerHTML = `
      <lumen-tooltip>
        <button id="tip-trigger" data-ui-tooltip-trigger>Help</button>
        <span role="tooltip">Helpful text</span>
      </lumen-tooltip>
    `

    const root = document.querySelector<HTMLElement>('lumen-tooltip')
    const trigger = document.querySelector<HTMLButtonElement>('#tip-trigger')
    const tip = document.querySelector<HTMLElement>('[role="tooltip"]')

    expect(trigger?.getAttribute('aria-describedby')).toBe(tip?.id)

    press(root!, 'Escape')
    expect(tip?.style.visibility).toBe('hidden')

    root?.dispatchEvent(new Event('mouseenter'))
    vi.advanceTimersByTime(250)
    expect(tip?.style.visibility).toBe('')
  })

  test('toast controller creates, updates, dismisses, limits stacks, and pauses duration', () => {
    vi.useFakeTimers()

    document.body.innerHTML = '<lumen-sonner data-placement="top-right" data-ui-toast-max="2"></lumen-sonner>'

    const actionEvents: CustomEvent<{ id: string, value?: unknown }>[] = []
    document.body.addEventListener('ui:toast-action', event => {
      actionEvents.push(event as CustomEvent<{ id: string, value?: unknown }>)
    })

    const firstId = LumenToast.create({ duration: 1000, id: 'first', title: 'First' })
    const secondId = LumenToast.create({ id: 'second', title: 'Second' })
    const thirdId = LumenToast.create({
      action: { label: 'Undo', value: 'third-action' },
      id: 'third',
      title: 'Third',
      variant: 'success'
    })

    expect(firstId).toBe('first')
    expect(secondId).toBe('second')
    expect(thirdId).toBe('third')
    expect(document.querySelector<HTMLElement>('#first')?.dataset.state).toBe('closed')
    expect(document.querySelectorAll('[data-ui-toast]')).toHaveLength(3)

    vi.advanceTimersByTime(240)
    expect(document.querySelector('#first')).toBeNull()

    LumenToast.update('second', { description: 'Updated copy', duration: 500, variant: 'warning' })
    expect(document.querySelector<HTMLElement>('#second')?.dataset.description).toBe('Updated copy')
    expect(document.querySelector<HTMLElement>('#second')?.getAttribute('variant')).toBe('warning')

    document.querySelector<HTMLButtonElement>('#third .ui-toast__action')?.click()
    expect(actionEvents).toHaveLength(1)
    expect(actionEvents[0]?.detail).toEqual({ id: 'third', value: 'third-action' })

    const second = document.querySelector<HTMLElement>('#second')
    second?.dispatchEvent(new Event('mouseenter'))
    vi.advanceTimersByTime(500)
    expect(second?.dataset.state).toBe('open')

    second?.dispatchEvent(new Event('mouseleave'))
    vi.advanceTimersByTime(500)
    expect(second?.dataset.state).toBe('closed')

    LumenToast.create({ duration: Number.POSITIVE_INFINITY, id: 'fourth', title: 'Fourth' })
    document.dispatchEvent(new CustomEvent('ui:toast-dismiss', { detail: { id: 'fourth' } }))
    expect(document.querySelector<HTMLElement>('#fourth')?.dataset.state).toBe('closed')
  })
})
