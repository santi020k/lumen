// @vitest-environment jsdom
import { afterEach, beforeEach, expect, test, vi } from 'vitest'

const toggle = '<button type="button" data-ui-toggle aria-pressed="false">Toggle</button>'
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

test('initializes the supplied control without binding siblings', async () => {
  document.body.innerHTML = toggle + toggle
  const [first, second] = document.querySelectorAll('button')
  if (!first || !second) throw new Error('Missing toggles')
  const { initUiPrimitives } = await import('./runtime/loader.js')

  await initUiPrimitives(first)
  first.click()
  second.click()

  expect(first.getAttribute('aria-pressed')).toBe('true')
  expect(second.getAttribute('aria-pressed')).toBe('false')
  expect(second.dataset.uiBound).toBeUndefined()
  await initUiPrimitives(second)
  second.click()
  expect(second.getAttribute('aria-pressed')).toBe('true')
})

test.each(['element', 'fragment', 'shadow'] as const)('initializes detached %s content before it is attached', async kind => {
  const host = document.createElement('div')
  const button = document.createElement('button')
  button.dataset.uiToggle = ''
  button.setAttribute('aria-pressed', 'false')
  let scope: ParentNode = button
  if (kind === 'fragment') scope = document.createDocumentFragment()
  if (kind === 'shadow') scope = host.attachShadow({ mode: 'open' })
  if (scope !== button) scope.append(button)
  const { initUiPrimitives } = await import('./runtime/loader.js')

  await initUiPrimitives(scope)
  button.click()
  expect(button.getAttribute('aria-pressed')).toBe('true')
  document.body.append(kind === 'shadow' ? host : scope)
  await initUiPrimitives(button)
  button.click()
  expect(button.getAttribute('aria-pressed')).toBe('false')
})

test('keeps initialized interactions local and enhances a new control on its first click', async () => {
  document.body.innerHTML = toggle
  const first = document.querySelector('button')
  if (!first) throw new Error('Missing toggle')
  const { installRuntime, initUiPrimitives } = await import('./runtime/loader.js')
  installRuntime()
  await initUiPrimitives()
  document.body.insertAdjacentHTML('beforeend', toggle)
  const second = document.querySelector('button:last-child')
  if (!(second instanceof HTMLButtonElement)) throw new Error('Missing second toggle')
  const queries = vi.spyOn(document, 'querySelectorAll')

  first.click()
  expect(first.getAttribute('aria-pressed')).toBe('true')
  expect(queries).not.toHaveBeenCalled()
  expect(second.dataset.uiBound).toBeUndefined()

  second.click()
  expect(second.getAttribute('aria-pressed')).toBe('true')
  expect(queries).not.toHaveBeenCalled()
})

test('initializes a detached form root and its fields without binding another form', async () => {
  document.body.innerHTML = '<form data-ui-form><div data-ui-field><input required></div></form>'
  const form = document.createElement('form')
  form.dataset.uiForm = ''
  form.innerHTML = '<div data-ui-field><input required></div>'
  const { initUiPrimitives } = await import('./runtime/loader.js')

  await initUiPrimitives(form)
  expect(form.dataset.uiFormBound).toBe('true')
  expect(form.querySelector<HTMLElement>('[data-ui-field]')?.dataset.uiFieldBound).toBe('true')
  expect(document.querySelector('form')?.dataset.uiFormBound).toBeUndefined()
})

test('enhances a compound form from its nested button without binding another form', async () => {
  document.body.innerHTML = '<form data-ui-form><div data-ui-field><input><button type="button">Initial</button></div></form>'
  const { installRuntime, initUiPrimitives } = await import('./runtime/loader.js')
  installRuntime()
  await initUiPrimitives()
  document.body.insertAdjacentHTML('beforeend', '<form data-ui-form><div data-ui-field><input><button type="button">Nested</button></div></form><form data-ui-form><input></form>')
  const forms = document.querySelectorAll('form')
  const form = forms[1]
  const sibling = forms[2]
  const button = form?.querySelector('button')
  if (!form || !sibling || !button) throw new Error('Missing dynamic form')

  button.click()

  expect(form.noValidate).toBe(true)
  expect(form.dataset.uiFormBound).toBe('true')
  expect(form.querySelector<HTMLElement>('[data-ui-field]')?.dataset.uiFieldBound).toBe('true')
  expect(sibling.dataset.uiFormBound).toBeUndefined()
})

test('enhances the owning code block from its copy button without binding a sibling block', async () => {
  document.body.innerHTML = '<div data-ui-code><pre><code>Initial</code></pre></div>'
  const { installRuntime, initUiPrimitives } = await import('./runtime/loader.js')
  installRuntime()
  await initUiPrimitives()
  document.body.insertAdjacentHTML('beforeend', '<div data-ui-code><button type="button" data-ui-code-copy>Copy</button><pre><code>Dynamic</code></pre></div><div data-ui-code><pre><code>Sibling</code></pre></div>')
  const button = document.querySelector('button')
  if (!button) throw new Error('Missing copy button')

  button.click()

  const blocks = document.querySelectorAll('pre')
  expect(blocks[1]?.getAttribute('role')).toBe('region')
  expect(blocks[1]?.tabIndex).toBe(0)
  expect(blocks[2]?.getAttribute('role')).toBeNull()
})
