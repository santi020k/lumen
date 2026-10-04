// @vitest-environment jsdom
import { act, createElement } from 'react'
import { createPortal } from 'react-dom'
import { createRoot, type Root } from 'react-dom/client'

import { afterEach, beforeEach, expect, test, vi } from 'vitest'

import { useRichTextEditor } from './hooks.js'

let container: HTMLDivElement
let root: Root
const fallback = vi.fn(() => true)
const completion = vi.fn()
const handler = vi.fn(() => false)
const Editor = ({ external = false }: { external?: boolean }) => {
  const editor = useRichTextEditor({ ...(external ? { commandHandler: handler } : {}), onCommand: completion })

  return createElement('section', { ...editor.rootProps }, createElement('button', { ...editor.getCommandProps('bold') }, 'Bold'), createElement('div', { ...editor.getEditableProps() }, 'Draft'))
}

beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  Object.defineProperty(document, 'execCommand', { configurable: true, value: fallback })
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
})

afterEach(async () => {
  await act(async () => {
    root.unmount()
    await Promise.resolve()
  })
  container.remove()
  Reflect.deleteProperty(document, 'execCommand')
  Reflect.deleteProperty(document, 'queryCommandState')
  vi.clearAllMocks()
  vi.unstubAllGlobals()
})

test('a failed external callback completes once and never invokes the browser fallback', async () => {
  await act(async () => {
    root.render(createElement(Editor, { external: true }))
    await Promise.resolve()
  })
  container.querySelector('button')?.click()
  expect(handler).toHaveBeenCalledWith({ command: 'bold' })
  expect(fallback).not.toHaveBeenCalled()
  expect(completion).toHaveBeenCalledExactlyOnceWith({ command: 'bold', executed: false })
})

test('a canceled DOM request suppresses both callback and fallback', async () => {
  await act(async () => {
    root.render(createElement(Editor, { external: true }))
    await Promise.resolve()
  })
  container.addEventListener('ui:editor-command-request', event => {
    event.preventDefault()
  })
  container.querySelector('button')?.click()
  expect(handler).not.toHaveBeenCalled()
  expect(fallback).not.toHaveBeenCalled()
  expect(completion).toHaveBeenCalledExactlyOnceWith({ command: 'bold', executed: false })
})

test('ordinary editing retains the browser command and notification behavior', async () => {
  await act(async () => {
    root.render(createElement(Editor))
    await Promise.resolve()
  })
  container.querySelector('button')?.click()
  expect(fallback).toHaveBeenCalledExactlyOnceWith('bold')
  expect(completion).toHaveBeenCalledExactlyOnceWith({ command: 'bold', executed: true })
})

test('toolbar and keyboard commands use the document that owns a portaled editor', async () => {
  const frame = document.createElement('iframe')
  container.append(frame)
  const frameDocument = frame.contentDocument
  if (!frameDocument) throw new Error('Expected iframe document')
  const frameFallback = vi.fn(() => true)
  Object.defineProperty(frameDocument, 'execCommand', { configurable: true, value: frameFallback })
  await act(async () => {
    root.render(createPortal(createElement(Editor), frameDocument.body))
    await Promise.resolve()
  })
  frameDocument.querySelector('button')?.click()
  const editable = frameDocument.querySelector<HTMLElement>('[contenteditable]')
  if (!editable) throw new Error('Expected portaled editor')
  editable.dispatchEvent(new KeyboardEvent('keydown', { key: 'b', ctrlKey: true, bubbles: true, cancelable: true }))
  expect(frameFallback).toHaveBeenCalledTimes(2)
  expect(frameFallback).toHaveBeenNthCalledWith(1, 'bold')
  expect(frameFallback).toHaveBeenNthCalledWith(2, 'bold')
  expect(fallback).not.toHaveBeenCalled()
})

test('initializes toggle accessibility state before the first editing interaction', () => {
  Object.defineProperty(document, 'queryCommandState', { configurable: true, value: () => true })

  act(() => {
    root.render(createElement(Editor))
  })

  expect(container.querySelector('button')?.getAttribute('aria-pressed')).toBe('true')
  expect(container.querySelector('button')?.dataset.state).toBe('on')
  expect(fallback).not.toHaveBeenCalled()
  expect(completion).not.toHaveBeenCalled()
})

test('initializes inactive toggles when browser command state is unavailable', () => {
  act(() => {
    root.render(createElement(Editor))
  })

  expect(container.querySelector('button')?.getAttribute('aria-pressed')).toBe('false')
  expect(container.querySelector('button')?.dataset.state).toBe('off')
})

test('leaves initial toolbar state owned by an external engine', () => {
  const query = vi.fn(() => true)

  Object.defineProperty(document, 'queryCommandState', { configurable: true, value: query })

  act(() => {
    root.render(createElement(Editor, { external: true }))
  })

  expect(query).not.toHaveBeenCalled()
  expect(container.querySelector('button')?.hasAttribute('aria-pressed')).toBe(false)
  expect(container.querySelector('button')?.dataset.state).toBeUndefined()
})
