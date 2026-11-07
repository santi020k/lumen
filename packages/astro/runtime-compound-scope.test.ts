// @vitest-environment jsdom
import { afterEach, beforeEach, expect, test, vi } from 'vitest'

import { getScopeTarget } from './runtime/relationships.js'

let listeners = vi.spyOn(document, 'addEventListener')

beforeEach(() => {
  vi.resetModules()
  document.body.replaceChildren()
  delete document.documentElement.dataset.uiPrimitivesGlobalBound
  listeners = vi.spyOn(document, 'addEventListener')
})

afterEach(() => {
  document.dispatchEvent(new Event('astro:before-swap'))
  for (const [type, listener, options] of listeners.mock.calls) document.removeEventListener(type, listener, options)
  vi.restoreAllMocks()
})

const fixture = (kind: 'element' | 'fragment' | 'shadow', markup: string) => {
  const root = document.createElement('section')
  root.innerHTML = markup
  const host = document.createElement('div')
  let scope: ParentNode = root
  if (kind === 'shadow') scope = host.attachShadow({ mode: 'open' })
  if (kind === 'fragment') scope = document.createDocumentFragment()
  if (scope !== root) scope.append(root)
  return { root,
    scope,
    attach: () => {
      document.body.append(kind === 'shadow' ? host : scope)
    } }
}

const requireElement = <T extends Element>(element: T | null | undefined): T => {
  if (!element) throw new Error('Missing compound fixture')
  return element
}

test.each(['element', 'fragment', 'shadow'] as const)('resolves compound controls in a detached %s tree', async kind => {
  const { root, scope, attach } = fixture(kind, `
    <div data-ui-popover><button data-ui-trigger aria-controls="panel">Open</button><div id="panel" hidden>Content</div></div>
    <div data-ui-tabs><div role="tablist"><button role="tab">First</button><button role="tab">Second</button></div><div role="tabpanel">One</div><div role="tabpanel">Two</div></div>
    <button data-ui-dialog-trigger="dialog">Open dialog</button><dialog id="dialog" data-ui-dialog></dialog>
    <button data-ui-context-menu-trigger="menu">Context menu</button><div id="menu" data-ui-context-menu hidden>Menu</div>
    <form data-ui-form><div data-ui-field data-ui-field-control="field"><span id="hint" data-ui-field-hint>Hint</span></div><input id="field"></form>
  `)
  document.body.innerHTML = '<div id="panel" hidden></div><dialog id="dialog"></dialog><div id="menu" hidden></div><input id="field">'
  const trigger = requireElement(root.querySelector<HTMLButtonElement>('[data-ui-trigger]'))
  const panel = requireElement(root.querySelector<HTMLElement>('#panel'))
  const dialog = requireElement(root.querySelector('dialog'))
  const dialogTrigger = requireElement(root.querySelector<HTMLButtonElement>('[data-ui-dialog-trigger]'))
  const contextTrigger = requireElement(root.querySelector<HTMLButtonElement>('[data-ui-context-menu-trigger]'))
  const menu = requireElement(root.querySelector<HTMLElement>('#menu'))
  const secondTab = requireElement(root.querySelectorAll<HTMLButtonElement>('[role="tab"]')[1])
  Object.defineProperty(dialog, 'showModal', { value: () => {
    dialog.open = true
  } })
  const { initUiPrimitives } = await import('./runtime/loader.js')

  await initUiPrimitives(scope)
  trigger.click()
  expect(panel.hidden).toBe(false)
  expect(document.getElementById('panel')?.hidden).toBe(true)
  secondTab.click()
  expect([...root.querySelectorAll<HTMLElement>('[role="tabpanel"]')].map(element => element.hidden)).toEqual([true, false])
  dialogTrigger.click()
  expect(dialog.open).toBe(true)
  expect(document.querySelector('dialog')?.open).toBe(false)
  contextTrigger.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true }))
  expect(menu.hidden).toBe(false)
  expect(document.getElementById('menu')?.hidden).toBe(true)
  expect(root.querySelector('input')?.getAttribute('aria-describedby')).toBe('hint')
  expect(document.querySelector('input')?.getAttribute('aria-describedby')).toBeNull()

  document.body.replaceChildren()
  attach()
  await initUiPrimitives(scope)
  trigger.click()
  expect(panel.hidden).toBe(true)
})

test('keeps missing shadow references isolated from the outer document', async () => {
  document.body.innerHTML = '<div id="outside" hidden></div>'
  const { root, scope, attach } = fixture('shadow', '<div data-ui-popover><button data-ui-trigger aria-controls="outside">Open</button></div>')
  attach()
  const { initUiPrimitives } = await import('./runtime/loader.js')
  await initUiPrimitives(scope)
  root.querySelector('button')?.click()
  expect(document.getElementById('outside')?.hidden).toBe(true)
  expect(root.querySelector('button')?.dataset.uiBound).toBeUndefined()
})

test('resolves a detached root ID literally and rejects empty IDs', () => {
  const root = document.createElement('div')
  const child = document.createElement('button')
  root.append(child)
  expect(getScopeTarget(child, '')).toBeNull()
  root.id = 'a:b [c]'
  expect(getScopeTarget(child, root.id)).toBe(root)
})

test('retries a context menu when its referenced panel arrives later', async () => {
  const { root, scope, attach } = fixture('fragment', '<button data-ui-context-menu-trigger="late">Open</button>')
  const { initUiPrimitives } = await import('./runtime/loader.js')
  await initUiPrimitives(scope)
  expect(root.querySelector('button')?.dataset.uiBound).toBeUndefined()
  root.insertAdjacentHTML('beforeend', '<div id="late" data-ui-context-menu hidden>Late menu</div>')
  attach()
  await initUiPrimitives(root)
  root.querySelector('button')?.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true }))
  expect(root.querySelector<HTMLElement>('#late')?.hidden).toBe(false)
})

test('retries document anchors when their native fragment destination arrives later', async () => {
  const root = document.createElement('nav')
  root.dataset.uiAnchor = ''
  root.innerHTML = '<a href="#late-heading">Section</a>'
  const { initUiPrimitives } = await import('./runtime/loader.js')
  await initUiPrimitives(root)
  expect(root.dataset.uiBound).toBeUndefined()
  document.body.append(root)
  document.body.insertAdjacentHTML('beforeend', '<h2 id="late-heading">Section</h2>')
  await initUiPrimitives(root)
  expect(root.dataset.uiBound).toBe('true')
  expect(root.querySelector('a')?.getAttribute('aria-current')).toBe('location')
})

test.each(['open', 'closed'] as const)('dismisses initialized %s shadow popovers only for outside clicks', async mode => {
  const host = document.createElement('div')
  const scope = host.attachShadow({ mode })
  scope.innerHTML = '<div data-ui-popover><button data-ui-trigger aria-controls="panel">Open</button><div id="panel" hidden><button>Inside</button></div></div>'
  const trigger = scope.querySelector('button')
  const panel = scope.querySelector<HTMLElement>('#panel')
  if (!trigger || !panel) throw new Error('Missing popover')
  const { installRuntime, initUiPrimitives } = await import('./runtime/loader.js')
  installRuntime()
  await initUiPrimitives(scope)
  document.body.append(host)

  trigger.click()
  expect(panel.hidden).toBe(false)
  panel.querySelector('button')?.click()
  expect(panel.hidden).toBe(false)
  document.body.click()
  expect(panel.hidden).toBe(true)

  document.dispatchEvent(new Event('astro:before-swap'))
  document.dispatchEvent(new Event('astro:after-swap'))
  await initUiPrimitives(document)
  trigger.click()
  expect(panel.hidden).toBe(false)
  document.body.click()
  expect(panel.hidden).toBe(true)
})

test('dismisses only bound Astro disclosures when enhancing a scope', async () => {
  const disclosure = (id: string) => `<div data-ui-popover><button data-ui-trigger aria-controls="${id}" aria-expanded="true">Open</button><div id="${id}">Panel</div></div>`
  document.body.innerHTML = `<section>${disclosure('astro')}<div data-ui-owner="react">${disclosure('react')}</div></section>${disclosure('sibling')}`
  const scope = document.querySelector('section')
  if (!scope) throw new Error('Missing initialization scope')

  const { initUiPrimitives } = await import('./runtime/loader.js')
  await initUiPrimitives(scope)

  for (const id of ['react', 'sibling']) {
    const trigger = document.querySelector(`[aria-controls="${id}"]`)
    const escape = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'Escape' })

    trigger?.dispatchEvent(escape)
    expect(escape.defaultPrevented).toBe(false)
    expect(trigger?.hasAttribute('data-ui-bound')).toBe(false)
  }

  document.body.click()
  expect(document.querySelector('[aria-controls="astro"]')?.getAttribute('aria-expanded')).toBe('false')
  expect(document.querySelector('[aria-controls="react"]')?.getAttribute('aria-expanded')).toBe('true')
  expect(document.querySelector('[aria-controls="sibling"]')?.getAttribute('aria-expanded')).toBe('true')
})
