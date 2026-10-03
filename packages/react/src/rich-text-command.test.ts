// @vitest-environment jsdom
import { act, createElement } from 'react'
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
