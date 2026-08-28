/* eslint-disable complexity, @typescript-eslint/no-non-null-assertion */
/* cspell:ignore valuenow */

// @vitest-environment jsdom

import {
  lumenComponentNames,
  registerLumenIconPack
} from '@santi020k/lumen-core'
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  test,
  vi
} from 'vitest'

import * as lumenElements from './index.js'
import {
  defineLumenElements,
  enhanceLumenCalendars,
  enhanceLumenContextMenus,
  enhanceLumenDatePickers,
  enhanceLumenDateRangePickers,
  enhanceLumenForms,
  enhanceLumenInputOTPs,
  enhanceLumenListBoxes,
  enhanceLumenPasswordFields,
  enhanceLumenResizable,
  enhanceLumenRichTextEditors,
  enhanceLumenSchedules,
  LumenBackdropElement,
  LumenButtonElement,
  LumenCardElement,
  type LumenElement,
  lumenElementDefinitions,
  LumenErrorStateElement,
  LumenGraphicElement,
  LumenIconElement,
  LumenIllustrationElement,
  LumenToast
} from './index.js'

const press = (element: Element, key: string, init: KeyboardEventInit = {}) => {
  element.dispatchEvent(
    new KeyboardEvent('keydown', {
      bubbles: true,
      cancelable: true,
      key,
      ...init
    })
  )
}

const createMemoryStorage = (): Storage => {
  const entries = new Map<string, string>()

  return {
    get length() {
      return entries.size
    },
    clear: () => {
      entries.clear()
    },
    getItem: key => entries.get(key) ?? null,
    key: index => [...entries.keys()][index] ?? null,
    removeItem: key => {
      entries.delete(key)
    },
    setItem: (key, value) => {
      entries.set(key, value)
    }
  }
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

const replaceElementFromPoint = (
  callback: (x: number, y: number) => Element | null
): (() => void) => {
  const descriptor = Object.getOwnPropertyDescriptor(document, 'elementFromPoint')

  Object.defineProperty(document, 'elementFromPoint', {
    configurable: true,
    value: callback
  })

  return () => {
    if (descriptor) Object.defineProperty(document, 'elementFromPoint', descriptor)
    else Reflect.deleteProperty(document, 'elementFromPoint')
  }
}

beforeAll(() => {
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: createMemoryStorage()
  })

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
  document.documentElement.lang = 'en'

  window.localStorage.clear()

  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('@santi020k/lumen-elements', () => {
  test('registers the shared catalog and deprecated Sonner alias', () => {
    expect(lumenElementDefinitions).toHaveLength(lumenComponentNames.length + 1)

    for (const [tagName, element] of lumenElementDefinitions) {
      expect(customElements.get(tagName)).toBe(element)
    }
  })

  test('exports a constructor for every shared catalog name', () => {
    for (const componentName of lumenComponentNames) {
      expect(lumenElements).toHaveProperty(`Lumen${componentName}Element`)
    }
  })

  test('registers custom elements once', () => {
    defineLumenElements(customElements)
    defineLumenElements(customElements)

    expect(customElements.get('lumen-button')).toBe(LumenButtonElement)
    expect(customElements.get('lumen-backdrop')).toBe(LumenBackdropElement)
    expect(customElements.get('lumen-card')).toBe(LumenCardElement)
    expect(customElements.get('lumen-graphic')).toBe(LumenGraphicElement)
    expect(customElements.get('lumen-icon')).toBe(LumenIconElement)
    expect(customElements.get('lumen-illustration')).toBe(LumenIllustrationElement)
    expect(customElements.get('lumen-sonner')).toBeDefined()
  })

  test('registers the complete catalog independently in each supplied registry', () => {
    const createRegistry = () => {
      const constructors = new Map<string, CustomElementConstructor>()

      return {
        define: (name: string, constructor: CustomElementConstructor) => {
          constructors.set(name, constructor)
        },
        get: (name: string) => constructors.get(name)
      }
    }
    const firstRegistry = createRegistry()
    const secondRegistry = createRegistry()

    defineLumenElements(firstRegistry)
    defineLumenElements(secondRegistry)

    for (const [tagName, element] of lumenElementDefinitions) {
      expect(firstRegistry.get(tagName)).toBe(element)
      expect(secondRegistry.get(tagName)).toBe(element)
    }
  })

  test('registers only an explicit component set in a supplied registry', () => {
    const constructors = new Map<string, CustomElementConstructor>()
    const registry = {
      define: (name: string, constructor: CustomElementConstructor) => {
        constructors.set(name, constructor)
      },
      get: (name: string) => constructors.get(name)
    }

    defineLumenElements(['Button', 'Card', 'Button'], registry)

    expect([...constructors.keys()]).toEqual(['lumen-button', 'lumen-card'])
    expect(registry.get('lumen-button')).toBe(LumenButtonElement)
    expect(registry.get('lumen-card')).toBe(LumenCardElement)
    expect(registry.get('lumen-dialog')).toBeUndefined()

    defineLumenElements(['Button', 'Card'], registry)

    expect(constructors).toHaveLength(2)
  })

  test('accepts the deprecated Sonner name in selective registration', () => {
    const constructors = new Map<string, CustomElementConstructor>()
    const registry = {
      define: (name: string, constructor: CustomElementConstructor) => {
        constructors.set(name, constructor)
      },
      get: (name: string) => constructors.get(name)
    }

    defineLumenElements(['Sonner'], registry)

    expect([...constructors.keys()]).toEqual(['lumen-sonner'])
    expect(registry.get('lumen-sonner')).toBeDefined()
  })

  test('does not add the Sonner alias to selective ToastViewport registration', () => {
    const constructors = new Map<string, CustomElementConstructor>()
    const registry = {
      define: (name: string, constructor: CustomElementConstructor) => {
        constructors.set(name, constructor)
      },
      get: (name: string) => constructors.get(name)
    }

    defineLumenElements(['ToastViewport'], registry)

    expect([...constructors.keys()]).toEqual(['lumen-toast-viewport'])
  })

  test('registers error states with semantic kind and layout hooks', () => {
    const state = new LumenErrorStateElement()

    document.body.appendChild(state)

    expect(state.tagName).toBe('LUMEN-ERROR-STATE')
    expect(state.getAttribute('kind')).toBe('error')
    expect(state.getAttribute('layout')).toBe('default')
    expect(state.hasAttribute('data-ui-error-state')).toBe(true)
    expect(state.className).toContain('ui-error-state--error')
    expect(state.className).toContain('ui-error-state--default')

    state.setAttribute('kind', 'offline')
    state.setAttribute('layout', 'page')

    expect(state.className).toContain('ui-error-state--offline')
    expect(state.className).toContain('ui-error-state--page')
  })

  test('rejects an unknown component name in the granular registration path', () => {
    const registry = {
      define: vi.fn(),
      get: vi.fn()
    }

    expect(() => {
      defineLumenElements(
        ['NotAComponent' as unknown as (typeof lumenComponentNames)[number]],
        registry
      )
    }).toThrow('Unknown Lumen component name: NotAComponent')

    expect(registry.define).not.toHaveBeenCalled()
  })

  test('keeps graphics decorative until they receive a label', () => {
    const graphic = document.createElement('lumen-graphic')

    document.body.appendChild(graphic)

    expect(graphic.className).toContain('ui-graphic--orbit')
    expect(graphic.getAttribute('aria-hidden')).toBe('true')

    graphic.setAttribute('label', 'Product constellation')

    expect(graphic.getAttribute('aria-hidden')).toBeNull()
    expect(graphic.getAttribute('aria-label')).toBe('Product constellation')
    expect(graphic.getAttribute('role')).toBe('img')

    graphic.removeAttribute('label')

    expect(graphic.getAttribute('aria-hidden')).toBe('true')
    expect(graphic.getAttribute('aria-label')).toBeNull()
    expect(graphic.getAttribute('role')).toBeNull()
  })

  test('applies backdrop presets while preserving child content', () => {
    const backdrop = document.createElement('lumen-backdrop')
    backdrop.textContent = 'Readable content'
    backdrop.setAttribute('intensity', 'strong')
    backdrop.setAttribute('tone', 'neutral')
    backdrop.setAttribute('variant', 'rays')
    document.body.appendChild(backdrop)

    expect(backdrop.className).toContain('ui-backdrop--rays')
    expect(backdrop.className).toContain('ui-backdrop--neutral')
    expect(backdrop.className).toContain('ui-backdrop--strong')
    expect(backdrop.textContent).toContain('Readable content')
  })

  test('keeps illustrations decorative until they receive a label', () => {
    const illustration = document.createElement('lumen-illustration')
    illustration.setAttribute('variant', 'success')
    document.body.appendChild(illustration)

    expect(illustration.className).toContain('ui-illustration--success')
    expect(illustration.getAttribute('aria-hidden')).toBe('true')

    illustration.setAttribute('label', 'Saved successfully')

    expect(illustration.getAttribute('aria-hidden')).toBeNull()
    expect(illustration.getAttribute('aria-label')).toBe('Saved successfully')
    expect(illustration.getAttribute('role')).toBe('img')
  })

  test('coordinates uncontrolled language state, persistence, labels, and events', () => {
    window.localStorage.clear()

    document.documentElement.lang = 'en'

    const toggle = document.createElement('lumen-language-toggle')

    toggle.setAttribute('storage-key', 'test-language')

    const changes: unknown[] = []

    toggle.addEventListener('ui:language-change', event => {
      if (event instanceof CustomEvent) changes.push(event.detail)
    })

    document.body.append(toggle)

    expect(toggle.getAttribute('aria-label')).toContain('English')
    expect(toggle.textContent).toBe('Español')

    toggle.dispatchEvent(new MouseEvent('click', { bubbles: true }))

    expect(document.documentElement.lang).toBe('es')
    expect(window.localStorage.getItem('test-language')).toBe('es')
    expect(changes).toEqual([{ previousValue: 'en', value: 'es' }])
  })

  test('prefers an explicit language default over the document language', () => {
    document.documentElement.lang = 'en'

    const toggle = document.createElement('lumen-language-toggle')

    toggle.setAttribute('default-value', 'es')
    document.body.append(toggle)

    expect(toggle.dataset.uiLanguageValue).toBe('es')
    expect(document.documentElement.lang).toBe('es')
  })

  test('keeps motion elements readable when motion is reduced', () => {
    vi.stubGlobal(
      'matchMedia', vi.fn(() => ({
        addEventListener: vi.fn(),
        matches: true,
        media: '(prefers-reduced-motion: reduce)',
        onchange: null,
        removeEventListener: vi.fn()
      }))
    )

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
    expect(
      (group.children[1] as HTMLElement).style.getPropertyValue(
        '--ui-reveal-index'
      )
    ).toBe('1')

    vi.unstubAllGlobals()
  })

  test('creates density-controlled drifting particles when motion is allowed', () => {
    vi.stubGlobal(
      'matchMedia', vi.fn(() => ({
        addEventListener: vi.fn(),
        matches: false,
        media: '(prefers-reduced-motion: reduce)',
        onchange: null,
        removeEventListener: vi.fn()
      }))
    )

    const particles = document.createElement('lumen-particles')

    particles.setAttribute('data-ui-particles', 'low')
    document.body.append(particles)

    expect(particles.hasAttribute('data-ui-particles-initialized')).toBe(true)
    expect(particles.querySelectorAll('.ui-particles__particle')).toHaveLength(
      15
    )
  })

  test('applies primitive classes when elements connect', () => {
    const button = document.createElement('lumen-button')
    const card = document.createElement('lumen-card')
    const contextNavigation = document.createElement('lumen-context-navigation')

    contextNavigation.setAttribute('variant', 'unstyled')
    document.body.append(button, card, contextNavigation)

    expect([...button.classList].sort()).toEqual(
      ['ui-button', 'ui-button--default', 'ui-button--default-size'].sort()
    )
    expect(button.getAttribute('role')).toBe('button')
    expect(button.tabIndex).toBe(0)
    expect([...card.classList]).toEqual(['ui-card'])
    expect([...contextNavigation.classList]).toEqual([
      'ui-context-navigation',
      'ui-context-navigation--unstyled'
    ])
    expect(contextNavigation.dataset.slot).toBe('context-navigation')
  })

  test('registers stable compound Card and Stat part contracts', () => {
    const cardHeader = document.createElement('lumen-card-header')
    const cardTitle = document.createElement('lumen-card-title')
    const stat = document.createElement('lumen-stat')
    const statTrend = document.createElement('lumen-stat-trend')

    stat.setAttribute('variant', 'bare')
    statTrend.setAttribute('tone', 'success')
    document.body.append(cardHeader, cardTitle, stat, statTrend)

    expect([...cardHeader.classList]).toEqual(['ui-card__header'])
    expect(cardHeader.dataset.slot).toBe('card-header')
    expect([...cardTitle.classList]).toEqual(['ui-card__title'])
    expect(stat.classList.contains('ui-stat--bare')).toBe(true)
    expect(stat.dataset.slot).toBe('stat')
    expect(statTrend.classList.contains('ui-stat-trend--success')).toBe(true)
    expect(statTrend.dataset.slot).toBe('stat-trend')
  })

  test('emits controlled Kanban keyboard move requests without moving cards', () => {
    const board = document.createElement('lumen-kanban-board')

    board.setAttribute('aria-label', 'Delivery board')
    board.innerHTML = `
      <lumen-kanban-column value="inbox">
        <lumen-card data-ui-kanban-item="feedback-1">
          <button data-ui-kanban-handle aria-label="Move feedback">Move</button>
        </lumen-card>
      </lumen-kanban-column>
      <lumen-kanban-column value="planned"><h2>Planned</h2></lumen-kanban-column>
    `

    const moves: unknown[] = []

    board.addEventListener('ui:kanban-move-request', event => {
      moves.push((event as CustomEvent).detail)
    })
    document.body.append(board)

    const handle = board.querySelector<HTMLElement>('[data-ui-kanban-handle]')
    const item = board.querySelector<HTMLElement>('[data-ui-kanban-item]')
    const inbox = board.querySelector('lumen-kanban-column[value="inbox"]')

    expect(handle?.draggable).toBe(true)

    if (handle) press(handle, 'ArrowRight')

    expect(moves).toEqual([{
      fromColumn: 'inbox',
      input: 'keyboard',
      itemId: 'feedback-1',
      toColumn: 'planned'
    }])
    expect(item?.parentElement).toBe(inbox)
  })

  test('initializes added Kanban handles and rejects foreign pointer drops', async () => {
    const board = document.createElement('lumen-kanban-board')
    const foreignBoard = document.createElement('lumen-kanban-board')

    board.innerHTML = `
      <lumen-kanban-column value="inbox"></lumen-kanban-column>
      <lumen-kanban-column value="planned"></lumen-kanban-column>
    `
    foreignBoard.innerHTML = '<lumen-kanban-column value="foreign"></lumen-kanban-column>'
    document.body.append(board, foreignBoard)

    const item = document.createElement('lumen-card')
    const handle = document.createElement('button')

    item.dataset.uiKanbanItem = 'feedback-1'
    handle.dataset.uiKanbanHandle = ''
    handle.textContent = 'Move'
    handle.setPointerCapture = vi.fn()
    item.append(handle)
    board.querySelector('lumen-kanban-column[value="inbox"]')?.append(item)

    await vi.waitFor(() => {
      expect(handle.draggable).toBe(true)
    })

    const foreignColumn = foreignBoard.querySelector<HTMLElement>('lumen-kanban-column')

    if (!foreignColumn) throw new Error('Expected a foreign Kanban column.')

    const restoreElementFromPoint = replaceElementFromPoint(() => foreignColumn)

    const moves: unknown[] = []

    board.addEventListener('ui:kanban-move-request', event => {
      moves.push((event as CustomEvent).detail)
    })

    const dispatchPointer = (type: string, clientX = 20, clientY = 20) => {
      const event = new Event(type, { bubbles: true, cancelable: true })

      Object.defineProperties(event, {
        clientX: { value: clientX },
        clientY: { value: clientY },
        pointerId: { value: 7 },
        pointerType: { value: 'touch' }
      })
      handle.dispatchEvent(event)
    }

    try {
      dispatchPointer('pointerdown', 0, 0)
      dispatchPointer('pointermove')
      dispatchPointer('pointerup')

      expect(moves).toEqual([])
      expect(foreignColumn.dataset.state).toBeUndefined()
    } finally {
      restoreElementFromPoint()
    }
  })

  test('renders named Lucide icons with accessible labels', () => {
    const icon = document.createElement('lumen-icon')

    icon.setAttribute('name', 'search')
    icon.setAttribute('label', 'Search')
    document.body.append(icon)

    expect([...icon.classList]).toEqual(['ui-icon'])
    expect(icon.getAttribute('role')).toBe('img')
    expect(icon.getAttribute('aria-label')).toBe('Search')
    expect(icon.querySelector('svg')?.classList.contains('lucide-search')).toBe(
      true
    )

    icon.setAttribute('decorative', '')
    expect(icon.getAttribute('aria-hidden')).toBe('true')
    expect(icon.hasAttribute('role')).toBe(false)
  })

  test('renders registered filled icon packs through lumen-icon', () => {
    registerLumenIconPack('brand-test', {
      mark: {
        height: 24,
        name: 'mark',
        node: [['path', { d: 'M2 2h20v20H2z' }]],
        source: 'brand-test',
        style: 'fill',
        width: 24
      }
    })

    const icon = document.createElement('lumen-icon')

    icon.setAttribute('name', 'brand-test:mark')
    icon.setAttribute('label', 'Brand mark')
    document.body.append(icon)

    const svg = icon.querySelector('svg')

    expect(svg?.classList.contains('brand-test-mark')).toBe(true)
    expect(svg?.getAttribute('fill')).toBe('currentColor')
    expect(svg?.getAttribute('stroke')).toBe('none')
    expect(icon.getAttribute('aria-label')).toBe('Brand mark')
  })

  test('applies glass attribute classes', () => {
    const card = document.createElement('lumen-card')
    const dialog = document.createElement('lumen-dialog')
    const table = document.createElement('lumen-table')

    card.setAttribute('glass', '')
    dialog.setAttribute('glass', '')
    dialog.setAttribute('layout', 'fullscreen')
    table.setAttribute('glass', '')
    document.body.append(card, dialog, table)

    expect(card.classList.contains('ui-card--glass')).toBe(true)
    expect(dialog.classList.contains('ui-dialog--glass')).toBe(true)
    expect(dialog.classList.contains('ui-dialog--fullscreen')).toBe(true)
    expect(dialog.getAttribute('layout')).toBe('fullscreen')
    expect(table.classList.contains('ui-table-wrap--glass')).toBe(true)
    expect(dialog.hasAttribute('surface')).toBe(false)
  })

  test('applies code defaults and variant classes', () => {
    const inlineCode = document.createElement('lumen-code')
    const blockCode = document.createElement('lumen-code')

    blockCode.setAttribute('variant', 'block')
    blockCode.setAttribute('wrap', '')
    document.body.append(inlineCode, blockCode)

    expect([...inlineCode.classList].sort()).toEqual(
      ['ui-code', 'ui-code--inline'].sort()
    )
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
    const trigger =
      document.querySelector<HTMLButtonElement>('#popover-trigger')
    const panel = document.querySelector<HTMLElement>('#popover-panel')
    const first = document.querySelector<HTMLButtonElement>('#popover-first')
    const second = document.querySelector<HTMLButtonElement>('#popover-second')
    const menuTrigger =
      document.querySelector<HTMLButtonElement>('#menu-trigger')
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
    const changes: { value: string }[] = []
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
    const tabs = document.querySelector('lumen-tabs')
    const scrollIntoView = vi.fn()

    if (second) second.scrollIntoView = scrollIntoView
    tabs?.addEventListener('ui:tabs-change', event => {
      changes.push((event as CustomEvent<{ value: string }>).detail)
    })

    press(first as HTMLElement, 'ArrowRight')
    expect(second?.getAttribute('aria-selected')).toBe('true')
    expect(second?.tabIndex).toBe(0)
    expect(document.querySelector<HTMLElement>('#panel-two')?.hidden).toBe(
      false
    )
    expect(changes).toEqual([{ value: 'tab-two' }])
    expect(scrollIntoView).toHaveBeenCalledWith({ block: 'nearest', inline: 'nearest' })

    press(second as HTMLElement, 'End')
    expect(third?.getAttribute('aria-selected')).toBe('true')

    press(third as HTMLElement, 'Home')
    expect(first?.getAttribute('aria-selected')).toBe('true')
  })

  test('vertical tabs use Up and Down instead of Left and Right', () => {
    document.body.innerHTML = `
      <lumen-tabs>
        <div role="tablist" aria-orientation="vertical">
          <button id="vertical-one" role="tab" aria-selected="true" aria-controls="vertical-panel-one">One</button>
          <button id="vertical-two" role="tab" aria-selected="false" aria-controls="vertical-panel-two">Two</button>
        </div>
        <section id="vertical-panel-one" role="tabpanel">One panel</section>
        <section id="vertical-panel-two" role="tabpanel" hidden>Two panel</section>
      </lumen-tabs>
    `

    const first = document.querySelector<HTMLButtonElement>('#vertical-one')
    const second = document.querySelector<HTMLButtonElement>('#vertical-two')

    press(first as HTMLElement, 'ArrowRight')
    expect(first?.getAttribute('aria-selected')).toBe('true')

    press(first as HTMLElement, 'ArrowDown')
    expect(second?.getAttribute('aria-selected')).toBe('true')

    press(second as HTMLElement, 'ArrowUp')
    expect(first?.getAttribute('aria-selected')).toBe('true')
  })

  test('combobox filters, traverses, commits, and dismisses options', () => {
    document.body.innerHTML = `
      <lumen-combobox>
        <input aria-label="Framework" role="combobox" />
        <div role="listbox">
          <button data-value="astro" role="option">Astro</button>
          <button data-value="react" role="option">React</button>
          <button data-value="elements" role="option">Web Components</button>
        </div>
      </lumen-combobox>
    `

    const root = document.querySelector<HTMLElement>('lumen-combobox')!
    const input = root.querySelector<HTMLInputElement>('input')!
    const listbox = root.querySelector<HTMLElement>('[role="listbox"]')!
    const options = [...root.querySelectorAll<HTMLButtonElement>('[role="option"]')]
    const changes: string[] = []

    input.addEventListener('change', () => changes.push(input.value))

    expect(input.getAttribute('aria-controls')).toBe(listbox.id)
    expect(input.getAttribute('aria-expanded')).toBe('false')
    expect(listbox.hidden).toBe(true)
    expect(options.map(option => option.tabIndex)).toEqual([-1, -1, -1])

    input.focus()

    expect(input.getAttribute('aria-expanded')).toBe('true')
    expect(listbox.hidden).toBe(false)

    input.value = 'rea'
    input.dispatchEvent(new Event('input', { bubbles: true }))

    expect(options.map(option => option.hidden)).toEqual([true, false, true])

    press(input, 'ArrowDown')

    expect(document.activeElement).toBe(options[1])

    press(options[1]!, 'Enter')

    expect(input.value).toBe('react')
    expect(changes).toEqual(['react'])
    expect(input.getAttribute('aria-expanded')).toBe('false')
    expect(document.activeElement).toBe(input)

    input.value = ''
    input.dispatchEvent(new Event('input', { bubbles: true }))
    press(input, 'ArrowUp')

    expect(document.activeElement).toBe(options[2])

    press(options[2]!, 'Home')

    expect(document.activeElement).toBe(options[0])

    document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }))

    expect(listbox.hidden).toBe(true)
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
    const trigger = document.querySelector<HTMLButtonElement>(
      '[data-ui-select-trigger]'
    )
    const listbox = document.querySelector<HTMLElement>(
      '[data-ui-select-list]'
    )

    select?.addEventListener('change', () => {
      changes.push(select.value)
    })

    expect(trigger?.getAttribute('aria-label')).toBe('Plan')
    expect(trigger?.getAttribute('aria-required')).toBe('true')
    expect(listbox?.querySelectorAll('[data-ui-select-option]')).toHaveLength(
      3
    )
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
    expect(document.querySelector('[aria-selected="true"]')?.textContent).toBe(
      'Pro'
    )

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

    const select = document.querySelector<HTMLSelectElement>(
      'lumen-select select'
    )
    const trigger = document.querySelector<HTMLButtonElement>(
      '[data-ui-select-trigger]'
    )
    const business = [
      ...document.querySelectorAll<HTMLElement>('[data-ui-select-option]')
    ].find(item => item.dataset.value === 'business')

    business?.click()

    expect(select?.name).toBe('plan')
    expect(select?.required).toBe(true)
    expect(select?.value).toBe('business')
    expect(
      new FormData(document.querySelector<HTMLFormElement>('#billing')!).get(
        'plan'
      )
    ).toBe('business')
    expect(trigger?.textContent).toBe('Business')
  })

  test('password fields hide their value after reset and successful submission', async () => {
    document.body.innerHTML = `
      <form data-status="idle">
        <div data-ui-password-field>
          <input id="password" name="password" type="password" />
          <button data-ui-password-toggle type="button">
            <span aria-hidden="true">Show</span>
          </button>
        </div>
      </form>
    `

    enhanceLumenPasswordFields(document)

    const form = document.querySelector<HTMLFormElement>('form')
    const input = document.querySelector<HTMLInputElement>('input')
    const toggle = document.querySelector<HTMLButtonElement>('button')

    toggle?.click()

    expect(input?.type).toBe('text')
    expect(document.activeElement).toBe(input)

    form?.reset()

    expect(input?.type).toBe('password')

    toggle?.click()
    form!.dataset.status = 'success'

    await Promise.resolve()

    expect(input?.type).toBe('password')
  })

  test('list boxes retain native values and support keyboard typeahead', () => {
    document.body.innerHTML = `
      <form>
        <div data-ui-list-box>
          <select data-ui-list-box-native name="member">
            <option value="amina">Amina</option>
            <option value="theo">Theo</option>
          </select>
          <div data-ui-list-box-list hidden role="listbox">
            <div data-ui-list-box-option data-value="amina" role="option">Amina</div>
            <div data-ui-list-box-option data-value="theo" role="option">Theo</div>
          </div>
        </div>
      </form>
    `

    enhanceLumenListBoxes(document)

    const form = document.querySelector<HTMLFormElement>('form')
    const list = document.querySelector<HTMLElement>('[data-ui-list-box-list]')

    press(list!, 't')
    press(list!, 'Enter')

    expect(new FormData(form!).get('member')).toBe('theo')
    expect(list?.getAttribute('aria-activedescendant')).toContain('option-1')
  })

  test('scalar custom controls participate in FormData and reset', () => {
    document.body.innerHTML = `
      <form id="profile">
        <lumen-input name="email" type="email" value="first@example.com"></lumen-input>
        <lumen-textarea name="bio" value="Initial bio"></lumen-textarea>
        <lumen-checkbox checked name="updates" value="yes"></lumen-checkbox>
        <lumen-native-select name="role" value="editor">
          <option value="viewer">Viewer</option>
          <option value="editor">Editor</option>
        </lumen-native-select>
      </form>
    `

    const form = document.querySelector<HTMLFormElement>('#profile')
    const email = document.querySelector<LumenElement & { value: string }>(
      'lumen-input'
    )
    const bio = document.querySelector<LumenElement & { value: string }>(
      'lumen-textarea'
    )
    const updates = document.querySelector<LumenElement & { checked: boolean }>(
      'lumen-checkbox'
    )

    expect(new FormData(form!).get('email')).toBe('first@example.com')
    expect(new FormData(form!).get('bio')).toBe('Initial bio')
    expect(new FormData(form!).get('updates')).toBe('yes')
    expect(new FormData(form!).get('role')).toBe('editor')

    email!.value = 'next@example.com'
    bio!.value = 'Updated bio'
    updates!.checked = false

    expect(new FormData(form!).get('email')).toBe('next@example.com')
    expect(new FormData(form!).get('bio')).toBe('Updated bio')
    expect(new FormData(form!).has('updates')).toBe(false)

    form?.reset()

    expect(email?.value).toBe('first@example.com')
    expect(bio?.value).toBe('Initial bio')
    expect(updates?.checked).toBe(true)
  })

  test('scalar custom controls expose native validity and focus', () => {
    document.body.innerHTML = `
      <form>
        <lumen-input id="email" name="email" required type="email"></lumen-input>
      </form>
    `

    const email = document.querySelector<
      LumenElement & {
        checkValidity: () => boolean
        validationMessage: string
      }
    >('#email')
    const nativeInput = email?.querySelector<HTMLInputElement>(
      '[data-ui-element-control]'
    )

    expect(email?.checkValidity()).toBe(false)
    expect(email?.validationMessage).not.toBe('')
    expect(email?.getAttribute('aria-invalid')).toBe('true')

    email?.focus()

    expect(document.activeElement).toBe(nativeInput)
  })

  test('passes native input size through independently from visual size', () => {
    document.body.innerHTML = `
      <lumen-input name="code" size="12" visual-size="sm"></lumen-input>
      <lumen-native-select name="members" size="4" visual-size="lg">
        <option value="one">One</option>
      </lumen-native-select>
    `

    const input = document.querySelector<HTMLElement>('lumen-input')
    const nativeInput = input?.querySelector<HTMLInputElement>(
      '[data-ui-element-control]'
    )
    const select = document.querySelector<HTMLElement>('lumen-native-select')
    const nativeSelect = select?.querySelector<HTMLSelectElement>(
      '[data-ui-element-control]'
    )

    expect(input?.classList.contains('ui-input--sm')).toBe(true)
    expect(nativeInput?.size).toBe(12)
    expect(select?.classList.contains('ui-select--lg')).toBe(true)
    expect(nativeSelect?.size).toBe(4)
  })

  test('forms reflect validation, prevent duplicate submits, and reset status', async () => {
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
      const detail = (event as CustomEvent<{ control: HTMLInputElement }>)
        .detail

      events.push(`validate:${detail.control.id}`)
    })

    form?.addEventListener('ui:invalid', event => {
      const detail = (event as CustomEvent<{ controls: HTMLInputElement[] }>)
        .detail

      events.push(`invalid:${detail.controls.length}`)
    })

    form?.addEventListener('ui:valid', () => {
      events.push('valid')
    })

    const submitPrevented = !form?.dispatchEvent(
      new Event('submit', { bubbles: true, cancelable: true })
    )

    expect(submitPrevented).toBe(true)
    expect(input?.getAttribute('aria-invalid')).toBe('true')
    expect(input?.getAttribute('aria-describedby')).toContain(error?.id)
    expect(error?.hidden).toBe(false)
    expect(error?.textContent).toBe('Email required')
    expect(form?.dataset.status).toBe('error')
    expect(events).toEqual(['validate:email', 'invalid:1'])

    if (input) {
      input.value = 'me@example.com'
      input.dispatchEvent(new Event('focusout', { bubbles: true }))
    }

    expect(input?.hasAttribute('aria-invalid')).toBe(false)
    expect(error?.hidden).toBe(true)
    expect(events).toEqual([
      'validate:email',
      'invalid:1',
      'validate:email',
      'valid'
    ])

    form?.addEventListener('submit', event => {
      event.preventDefault()
    })

    form?.dispatchEvent(
      new Event('submit', { bubbles: true, cancelable: true })
    )

    expect(form?.dataset.status).toBe('submitting')
    expect(form?.getAttribute('aria-busy')).toBe('true')

    const duplicatePrevented = !form?.dispatchEvent(
      new Event('submit', {
        bubbles: true,
        cancelable: true
      })
    )

    expect(duplicatePrevented).toBe(true)

    await Promise.resolve()

    expect(form?.dataset.status).toBe('idle')
    expect(form?.hasAttribute('aria-busy')).toBe(false)

    form?.reset()

    expect(form?.dataset.status).toBe('idle')
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
    const native = document.querySelector<HTMLInputElement>(
      '[data-ui-date-picker-native]'
    )
    const control = document.querySelector<HTMLElement>(
      '[data-ui-date-picker-control]'
    )
    const trigger = document.querySelector<HTMLButtonElement>(
      '[data-ui-date-picker-trigger]'
    )
    const popover = document.querySelector<HTMLElement>(
      '[data-ui-date-picker-popover]'
    )

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
    const input = document.querySelector<HTMLInputElement>(
      '[data-ui-input-otp-native]'
    )
    const segmentsRoot = document.querySelector<HTMLElement>(
      '[data-ui-input-otp-segments]'
    )
    const segments = [
      ...document.querySelectorAll<HTMLButtonElement>(
        '[data-ui-input-otp-segment]'
      )
    ]

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
    const handle = document.querySelector<HTMLElement>(
      '[data-ui-resizable-handle]'
    )

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
    const input = document.querySelector<HTMLInputElement>(
      '[data-ui-calendar-input]'
    )
    const label = document.querySelector<HTMLElement>(
      '[data-ui-calendar-label]'
    )
    const selected = document.querySelector<HTMLElement>(
      '[data-ui-calendar-day][data-date="2026-07-10"]'
    )
    const nextDate = document.querySelector<HTMLElement>(
      '[data-ui-calendar-day][data-date="2026-07-15"]'
    )

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
    const rowChecks = [
      ...document.querySelectorAll<HTMLInputElement>(
        '[data-ui-datatable-row-select]'
      )
    ]
    const selectAll = document.querySelector<HTMLInputElement>(
      '[data-ui-datatable-select-all]'
    )
    const sortButtons = [
      ...document.querySelectorAll<HTMLButtonElement>(
        '[data-ui-datatable-sort]'
      )
    ]

    root?.addEventListener('ui:data-table-selection-change', event => {
      selectionEvents.push(
        (event as CustomEvent<{ values: string[] }>).detail.values
      )
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
    expect(
      document.querySelector<HTMLTableSectionElement>('tbody')?.rows[0]?.dataset
        .value
    ).toBe('alpha')

    sortButtons[1]?.click()

    expect(root?.dataset.uiDatatableSortDirection).toBe('descending')
    expect(
      document.querySelector<HTMLTableSectionElement>('tbody')?.rows[0]?.dataset
        .value
    ).toBe('beta')
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
      ranges.push(
        (event as CustomEvent<{ endIndex: number, startIndex: number }>).detail
      )
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
    const hue = document.querySelector<HTMLInputElement>(
      '[data-ui-theme-brand-hue]'
    )
    const format = document.querySelector<HTMLButtonElement>(
      '[data-ui-theme-export-format]'
    )
    const exportButton = document.querySelector<HTMLButtonElement>(
      '[data-ui-theme-export]'
    )
    const output = document.querySelector<HTMLTextAreaElement>(
      '[data-ui-theme-output]'
    )

    root?.addEventListener('ui:theme-export', event => {
      exports.push(
        (event as CustomEvent<{ format: string, value: string }>).detail
      )
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
    const button = document.querySelector<HTMLButtonElement>(
      '[data-ui-editor-command]'
    )

    root?.addEventListener('ui:editor-command', event => {
      commands.push((event as CustomEvent<{ command: string }>).detail.command)
    })
    root?.addEventListener('ui:editor-change', event => {
      changes.push((event as CustomEvent<{ html: string }>).detail.html)
    })

    button?.click()
    document
      .querySelector<HTMLButtonElement>('[data-ui-editor-value]')
      ?.click()
    document.querySelector<HTMLElement>('[contenteditable]')?.dispatchEvent(
      new KeyboardEvent('keydown', {
        bubbles: true,
        ctrlKey: true,
        key: 'i'
      })
    )

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
    const monday = document.querySelector<HTMLElement>(
      '[data-ui-schedule-slot="monday"]'
    )
    const friday = document.querySelector<HTMLElement>(
      '[data-ui-schedule-slot="friday"]'
    )

    root?.addEventListener('ui:schedule-change', event => {
      changes.push(
        (event as CustomEvent<{ eventId: string, slot: string }>).detail
      )
    })

    planning?.dispatchEvent(createDragEvent('dragstart', dataTransfer))

    expect(dataTransfer.setData).toHaveBeenCalledWith(
      'text/plain', 'schedule-planning'
    )
    expect(root?.dataset.uiDragging).toBe('true')
    expect(planning?.draggable).toBe(true)

    const dragOverPrevented = !friday?.dispatchEvent(
      createDragEvent('dragover', dataTransfer)
    )

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

    const trigger =
      document.querySelector<HTMLButtonElement>('#project-trigger')
    const menu = document.querySelector<HTMLElement>('#project-menu')
    const firstItem =
      document.querySelector<HTMLButtonElement>('[role="menuitem"]')

    expect(menu?.hidden).toBe(true)
    expect(menu?.dataset.state).toBe('closed')

    const contextMenuPrevented = !trigger?.dispatchEvent(
      new MouseEvent('contextmenu', {
        bubbles: true,
        cancelable: true,
        clientX: 24,
        clientY: 32
      })
    )

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

  test('file upload tracks drag state, dropped files, and its live file summary', () => {
    document.body.innerHTML = `
      <lumen-file-upload>
        <input data-ui-file-upload-input type="file">
        <span data-ui-file-upload-files></span>
      </lumen-file-upload>
    `

    const root = document.querySelector<HTMLElement>('lumen-file-upload')!
    const input = root.querySelector<HTMLInputElement>('input')!
    const summary = root.querySelector<HTMLElement>(
      '[data-ui-file-upload-files]'
    )!
    const file = new File(['hello'], 'hello.txt', { type: 'text/plain' })
    let selectedFiles: File[] = []

    Object.defineProperty(input, 'files', {
      configurable: true,
      get: () => selectedFiles,
      set: value => {
        selectedFiles = [...(value as FileList)]
      }
    })

    const dragOver = new Event('dragover', { bubbles: true, cancelable: true })

    expect(root.dispatchEvent(dragOver)).toBe(false)
    expect(root.dataset.state).toBe('drag-over')

    const drop = new Event('drop', { bubbles: true, cancelable: true })

    Object.defineProperty(drop, 'dataTransfer', { value: { files: [file] } })
    root.dispatchEvent(drop)

    expect(root.dataset.state).toBe('selected')
    expect(summary.textContent).toBe('hello.txt')
  })

  test('tour supports external and programmatic opening plus step navigation', () => {
    document.body.innerHTML = `
      <button data-ui-tour-open="#welcome-tour">Open</button>
      <div id="tour-target"></div>
      <lumen-tour id="welcome-tour" hidden>
        <div data-ui-tour-backdrop></div>
        <div data-ui-tour-popover>
          <section data-target="#tour-target" data-ui-tour-step>
            <button data-ui-tour-next>Next</button>
          </section>
          <section data-target="#tour-target" data-ui-tour-step hidden>
            <button data-ui-tour-close>Done</button>
          </section>
        </div>
      </lumen-tour>
    `

    const root = document.querySelector<HTMLElement>('lumen-tour')!
    const steps = root.querySelectorAll<HTMLElement>('[data-ui-tour-step]')
    const lumenWindow = window as Window & {
      LumenTours?: Record<string, () => void>
    }

    document.querySelector<HTMLButtonElement>('[data-ui-tour-open]')?.click()
    expect(root.hidden).toBe(false)

    root.querySelector<HTMLButtonElement>('[data-ui-tour-next]')?.click()
    expect(steps[0]?.hidden).toBe(true)
    expect(steps[1]?.hidden).toBe(false)

    root.querySelector<HTMLButtonElement>('[data-ui-tour-close]')?.click()
    expect(root.hidden).toBe(true)

    lumenWindow.LumenTours?.['welcome-tour']?.()
    expect(root.hidden).toBe(false)
  })

  test('anchor navigation synchronizes the accessible current link', () => {
    document.body.innerHTML = `
      <section id="intro"></section>
      <section id="api"></section>
      <lumen-anchor>
        <a data-active="true" href="#intro">Intro</a>
        <a data-active="false" href="#api">API</a>
      </lumen-anchor>
    `

    const links =
      document.querySelectorAll<HTMLAnchorElement>('lumen-anchor a')

    links[1]?.click()

    expect(links[0]?.dataset.active).toBe('false')
    expect(links[0]?.hasAttribute('aria-current')).toBe(false)
    expect(links[1]?.dataset.active).toBe('true')
    expect(links[1]?.getAttribute('aria-current')).toBe('location')
  })

  test('transfer moves checked items and emits the moved values', () => {
    document.body.innerHTML = `
      <lumen-transfer>
        <ul data-side="source" data-ui-transfer-list>
          <li class="ui-transfer__item"><input checked data-ui-transfer-item value="alpha"></li>
        </ul>
        <button data-ui-transfer-move="target">Move right</button>
        <ul data-side="target" data-ui-transfer-list></ul>
      </lumen-transfer>
    `

    const root = document.querySelector<HTMLElement>('lumen-transfer')!
    const events: CustomEvent[] = []

    root.addEventListener('ui:transfer-change', event => {
      events.push(event as CustomEvent)
    })
    root.querySelector<HTMLButtonElement>('[data-ui-transfer-move]')?.click()

    expect(
      root.querySelector('[data-side="source"] .ui-transfer__item')
    ).toBeNull()
    expect(
      root.querySelector('[data-side="target"] .ui-transfer__item')
    ).not.toBeNull()
    expect(events[0]?.detail).toEqual({
      from: 'source',
      to: 'target',
      values: ['alpha']
    })
  })

  test('mentions filters suggestions and inserts the selected value at the caret', () => {
    document.body.innerHTML = `
      <lumen-mentions data-ui-mentions-trigger="@">
        <textarea data-ui-mentions-input></textarea>
        <ul data-ui-mentions-list hidden>
          <li><button data-ui-mentions-option data-value="alice">Alice</button></li>
          <li><button data-ui-mentions-option data-value="bob">Bob</button></li>
        </ul>
      </lumen-mentions>
    `

    const input = document.querySelector<HTMLTextAreaElement>(
      '[data-ui-mentions-input]'
    )!
    const list = document.querySelector<HTMLElement>(
      '[data-ui-mentions-list]'
    )!
    const options = list.querySelectorAll<HTMLButtonElement>(
      '[data-ui-mentions-option]'
    )

    input.value = 'Hello @al'
    input.setSelectionRange(input.value.length, input.value.length)
    input.dispatchEvent(new Event('input', { bubbles: true }))

    expect(list.hidden).toBe(false)
    expect(input.getAttribute('aria-expanded')).toBe('true')
    expect(input.getAttribute('aria-controls')).toBe(list.id)
    expect(input.getAttribute('aria-label')).toBe('Mentions')
    expect(options[0]?.hidden).toBe(false)
    expect(options[1]?.hidden).toBe(true)

    input.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'Enter' }))

    expect(input.value).toBe('Hello @alice ')
    expect(list.hidden).toBe(true)
    expect(input.getAttribute('aria-expanded')).toBe('false')
  })

  test('cascader reveals child columns and commits a leaf selection', () => {
    document.body.innerHTML = `
      <lumen-cascader>
        <button aria-expanded="false" data-ui-trigger>Choose</button>
        <div data-ui-panel hidden>
          <ol class="ui-cascader__column">
            <li>
              <button aria-selected="false" data-ui-cascader-next="#cities"
                data-ui-cascader-option data-value="country">Country</button>
            </li>
          </ol>
          <ol class="ui-cascader__column" hidden id="cities">
            <li>
              <button aria-selected="false" data-label="Bogotá"
                data-ui-cascader-option data-value="bogota">Bogotá</button>
            </li>
          </ol>
        </div>
        <span data-ui-cascader-value>Select</span>
        <input data-ui-cascader-input>
      </lumen-cascader>
    `

    const root = document.querySelector<HTMLElement>('lumen-cascader')!
    const trigger = root.querySelector<HTMLButtonElement>('[data-ui-trigger]')!
    const columns = root.querySelectorAll<HTMLElement>('.ui-cascader__column')
    const options = root.querySelectorAll<HTMLButtonElement>(
      '[data-ui-cascader-option]'
    )
    const events: CustomEvent[] = []

    root.addEventListener('ui:cascader-change', event => {
      events.push(event as CustomEvent)
    })

    trigger.click()
    expect(trigger.getAttribute('aria-expanded')).toBe('true')

    options[0]?.focus()
    press(options[0]!, 'ArrowRight')
    expect(columns[1]?.hidden).toBe(false)
    expect(document.activeElement).toBe(options[1])

    options[1]?.click()
    expect(
      root.querySelector<HTMLInputElement>('[data-ui-cascader-input]')?.value
    ).toBe('bogota')
    expect(root.querySelector('[data-ui-cascader-value]')?.textContent).toBe(
      'Bogotá'
    )
    expect(events[0]?.detail).toEqual({ value: 'bogota' })
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
  })

  test('tree select commits a value, closes its panel, and emits change', () => {
    document.body.innerHTML = `
      <lumen-tree-select>
        <button aria-expanded="false" data-ui-trigger>Choose</button>
        <div data-ui-panel hidden>
          <button data-value="docs" role="treeitem">Documentation</button>
        </div>
        <span data-ui-tree-select-value>Select</span>
        <input data-ui-tree-select-input>
      </lumen-tree-select>
    `

    const root = document.querySelector<HTMLElement>('lumen-tree-select')!
    const trigger = root.querySelector<HTMLButtonElement>('[data-ui-trigger]')!
    const events: CustomEvent[] = []

    root.addEventListener('ui:tree-select-change', event => {
      events.push(event as CustomEvent)
    })

    press(trigger, 'ArrowDown')
    expect(trigger.getAttribute('aria-expanded')).toBe('true')
    expect(document.activeElement).toBe(
      root.querySelector('[data-value="docs"]')
    )

    root.querySelector<HTMLButtonElement>('[data-value="docs"]')?.click()

    expect(
      root.querySelector<HTMLInputElement>('[data-ui-tree-select-input]')
        ?.value
    ).toBe('docs')
    expect(root.querySelector('[data-ui-tree-select-value]')?.textContent).toBe(
      'Documentation'
    )
    expect(events[0]?.detail).toEqual({ value: 'docs' })
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
  })

  test('toast controller creates, updates, dismisses, limits stacks, and pauses duration', () => {
    vi.useFakeTimers()

    document.body.innerHTML =
      '<lumen-toast-viewport data-placement="top-right" data-ui-toast-max="2"></lumen-toast-viewport>'

    const actionEvents: CustomEvent<{ id: string, value?: unknown }>[] = []
    document.body.addEventListener('ui:toast-action', event => {
      actionEvents.push(event as CustomEvent<{ id: string, value?: unknown }>)
    })

    const firstId = LumenToast.create({
      duration: 1000,
      id: 'first',
      title: 'First'
    })
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
    expect(document.querySelector<HTMLElement>('#first')?.dataset.state).toBe(
      'closed'
    )
    expect(document.querySelectorAll('[data-ui-toast]')).toHaveLength(3)

    vi.advanceTimersByTime(240)
    expect(document.querySelector('#first')).toBeNull()

    LumenToast.update('second', {
      description: 'Updated copy',
      duration: 500,
      variant: 'warning'
    })
    expect(
      document.querySelector<HTMLElement>('#second')?.dataset.description
    ).toBe('Updated copy')
    expect(
      document.querySelector<HTMLElement>('#second')?.getAttribute('variant')
    ).toBe('warning')

    document
      .querySelector<HTMLButtonElement>('#third .ui-toast__action')
      ?.click()
    expect(actionEvents).toHaveLength(1)
    expect(actionEvents[0]?.detail).toEqual({
      id: 'third',
      value: 'third-action'
    })

    const second = document.querySelector<HTMLElement>('#second')
    second?.dispatchEvent(new Event('mouseenter'))
    vi.advanceTimersByTime(500)
    expect(second?.dataset.state).toBe('open')

    second?.dispatchEvent(new Event('mouseleave'))
    vi.advanceTimersByTime(500)
    expect(second?.dataset.state).toBe('closed')

    LumenToast.create({
      duration: Number.POSITIVE_INFINITY,
      id: 'fourth',
      title: 'Fourth'
    })
    document.dispatchEvent(
      new CustomEvent('ui:toast-dismiss', { detail: { id: 'fourth' } })
    )
    expect(document.querySelector<HTMLElement>('#fourth')?.dataset.state).toBe(
      'closed'
    )
  })

  test('keeps the legacy Sonner viewport wired to the toast controller', () => {
    document.body.innerHTML =
      '<lumen-sonner data-placement="top-right" data-ui-toast-max="2"></lumen-sonner>'

    const viewport = document.querySelector<HTMLElement>('lumen-sonner')

    expect(viewport?.classList.contains('ui-tvp')).toBe(true)
    expect(viewport?.hasAttribute('data-ui-sonner')).toBe(true)
    expect(viewport?.hasAttribute('data-ui-toast-viewport')).toBe(true)
  })
})
