// @vitest-environment jsdom

import { afterEach, beforeAll, beforeEach, describe, expect, test, vi } from 'vitest'

import {
  defineLumenElements,
  enhanceLumenForms,
  enhanceLumenRichTextEditors,
  LumenButtonElement,
  LumenCardElement,
  LumenToast} from './index.js'

const press = (element: Element, key: string, init: KeyboardEventInit = {}) => {
  element.dispatchEvent(new KeyboardEvent('keydown', {
    bubbles: true,
    cancelable: true,
    key,
    ...init
  }))
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
  test('registers custom elements once', () => {
    defineLumenElements(customElements)
    defineLumenElements(customElements)

    expect(customElements.get('lumen-button')).toBe(LumenButtonElement)
    expect(customElements.get('lumen-card')).toBe(LumenCardElement)
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
    document.body.append(inlineCode, blockCode)

    expect([...inlineCode.classList].sort()).toEqual(['ui-code', 'ui-code--inline'].sort())
    expect(inlineCode.getAttribute('data-code-theme')).toBe('auto')
    expect(inlineCode.getAttribute('variant')).toBe('inline')
    expect(blockCode.classList.contains('ui-code--block')).toBe(true)
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

    root?.addEventListener('ui-datatable-selectionchange', event => {
      selectionEvents.push((event as CustomEvent<{ values: string[] }>).detail.values)
    })

    expect(rowChecks).toHaveLength(2)
    expect(selectAll?.checked).toBe(false)
    expect(root?.getAttribute('data-ui-datatable')).toBe('')

    rowChecks[1]?.click()

    expect(selectionEvents).toEqual([['alpha']])
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

    Object.defineProperty(document, 'execCommand', {
      configurable: true,
      value: execCommand
    })

    document.body.innerHTML = `
      <lumen-rich-text-editor>
        <button data-ui-editor-command="bold" type="button">Bold</button>
      </lumen-rich-text-editor>
    `

    enhanceLumenRichTextEditors(document)

    const root = document.querySelector<HTMLElement>('lumen-rich-text-editor')
    const button = document.querySelector<HTMLButtonElement>('[data-ui-editor-command]')

    root?.addEventListener('ui:editor-command', event => {
      commands.push((event as CustomEvent<{ command: string }>).detail.command)
    })

    button?.click()

    expect(execCommand).toHaveBeenCalledWith('bold')
    expect(commands).toEqual(['bold'])
    expect(root?.dataset.uiEditorBound).toBe('true')
    expect(button?.dataset.uiEditorCommandBound).toBe('true')
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
