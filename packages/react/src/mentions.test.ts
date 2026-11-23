// @vitest-environment jsdom

import { act, createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'

import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import { Mentions } from './components.js'

const mounted: { container: HTMLDivElement, root: Root }[] = []

const requireTextarea = (root: ParentNode): HTMLTextAreaElement => {
  const element = root.querySelector('[data-ui-mentions-input]')

  if (!(element instanceof HTMLTextAreaElement)) {
    throw new Error('Expected Mentions textarea')
  }

  return element
}

const setTextareaValue = (textarea: HTMLTextAreaElement, value: string, caret = value.length): void => {
  const descriptor = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')

  if (!descriptor?.set) throw new Error('Expected native textarea value setter')

  descriptor.set.call(textarea, value)
  textarea.setSelectionRange(caret, caret)
  textarea.dispatchEvent(new Event('input', { bubbles: true }))
}

const renderMentions = () => {
  const container = document.createElement('div')
  const root = createRoot(container)

  document.body.append(container)

  mounted.push({ container, root })

  act(() => {
    root.render(createElement(Mentions, { options: ['alice', 'bob'] }))
  })

  const textarea = requireTextarea(container)

  return { container, root, textarea }
}

const visibleOptionsOf = (container: ParentNode): HTMLButtonElement[] => [...container.querySelectorAll<HTMLButtonElement>('[data-ui-mentions-option]')]

beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
})

afterEach(() => {
  while (mounted.length > 0) {
    const entry = mounted.pop()

    if (!entry) continue

    act(() => {
      entry.root.unmount()
    })

    entry.container.remove()
  }
  vi.unstubAllGlobals()
})

describe('Mentions', () => {
  test('waits for controlled insertion and cancels pending caret restoration on blur', () => {
    const { container, root, textarea } = renderMentions()
    const change = vi.fn()
    const nextField = document.createElement('input')
    container.append(nextField)
    act(() => {
      root.render(createElement(Mentions, { options: ['alice'], value: '@al', onValueChange: change }))
      textarea.focus()
      setTextareaValue(textarea, '@al')
    })
    act(() => {
      textarea.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'Enter' }))
    })
    expect(change).toHaveBeenLastCalledWith('@alice ')
    expect(textarea.value).toBe('@al')
    act(() => {
      nextField.focus()
    })
    act(() => {
      root.render(createElement(Mentions, { options: ['alice'], value: '@alice ', onValueChange: change }))
    })
    expect(textarea.value).toBe('@alice ')
    expect(document.activeElement).toBe(nextField)
  })

  test('restores the inserted caret before subsequent editing without stealing later focus', () => {
    const frames: FrameRequestCallback[] = []
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => frames.push(callback))
    const { container, textarea } = renderMentions()
    const nextField = document.createElement('input')
    container.append(nextField)
    act(() => {
      setTextareaValue(textarea, 'Hello @al tail', 9)
      textarea.focus()
    })
    act(() => {
      textarea.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'Enter' }))
    })
    expect(textarea.value).toBe('Hello @alice  tail')
    expect(textarea.selectionStart).toBe(13)
    expect(textarea.selectionEnd).toBe(13)
    act(() => {
      setTextareaValue(textarea, 'New draft')
      nextField.focus()
      for (const frame of frames) frame(0)
    })
    expect(textarea.value).toBe('New draft')
    expect(document.activeElement).toBe(nextField)
  })

  test('keeps option buttons out of the tab sequence while preserving keyboard selection', () => {
    const { container, textarea } = renderMentions()

    act(() => {
      setTextareaValue(textarea, 'Hello @al')
    })

    const visibleOptions = visibleOptionsOf(container)

    expect(visibleOptions.map(option => option.textContent)).toEqual(['alice'])
    expect(visibleOptions.map(option => option.tabIndex)).toEqual([-1])
    expect(textarea.getAttribute('aria-expanded')).toBe('true')

    act(() => {
      textarea.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'Enter' }))
    })

    expect(textarea.value).toBe('Hello @alice ')
    expect(textarea.getAttribute('aria-expanded')).toBe('false')
  })

  test('commits a pointer selection even though options are not tab stops', () => {
    const { container, textarea } = renderMentions()

    act(() => {
      setTextareaValue(textarea, 'Hello @al')
    })

    const alice = visibleOptionsOf(container).find(option => option.dataset.value === 'alice')

    if (!alice) throw new Error('Expected visible alice option')

    act(() => {
      alice.click()
    })

    expect(textarea.value).toBe('Hello @alice ')
  })

  test('ignores Enter with Alt, Ctrl, or Meta modifiers without preventing default or changing selection', () => {
    const onValueChange = vi.fn()
    const container = document.createElement('div')
    const root = createRoot(container)
    document.body.append(container)
    mounted.push({ container, root })

    act(() => {
      root.render(createElement(Mentions, {
        onValueChange,
        options: ['alice', 'bob']
      }))
    })

    const textarea = requireTextarea(container)
    act(() => {
      setTextareaValue(textarea, 'Hello @al')
    })

    expect(textarea.getAttribute('aria-expanded')).toBe('true')
    const activeOptionBefore = textarea.getAttribute('aria-activedescendant')
    expect(activeOptionBefore).toBeTruthy()
    onValueChange.mockClear()

    for (const modifier of [{ altKey: true }, { ctrlKey: true }, { metaKey: true }]) {
      const event = new KeyboardEvent('keydown', {
        bubbles: true,
        cancelable: true,
        key: 'Enter',
        ...modifier
      })

      act(() => {
        textarea.dispatchEvent(event)
      })

      expect(event.defaultPrevented).toBe(false)
      expect(onValueChange).not.toHaveBeenCalled()
      expect(textarea.value).toBe('Hello @al')
      expect(textarea.getAttribute('aria-expanded')).toBe('true')
      expect(textarea.getAttribute('aria-activedescendant')).toBe(activeOptionBefore)
    }
  })

  test('Enter and Shift+Enter insert active mention and close suggestions', () => {
    for (const shiftKey of [false, true]) {
      const onValueChange = vi.fn()
      const container = document.createElement('div')
      const root = createRoot(container)
      document.body.append(container)
      mounted.push({ container, root })

      act(() => {
        root.render(createElement(Mentions, {
          onValueChange,
          options: ['alice', 'bob']
        }))
      })

      const textarea = requireTextarea(container)
      act(() => {
        setTextareaValue(textarea, 'Hello @al')
      })

      expect(textarea.getAttribute('aria-expanded')).toBe('true')
      onValueChange.mockClear()

      const event = new KeyboardEvent('keydown', {
        bubbles: true,
        cancelable: true,
        key: 'Enter',
        shiftKey
      })

      act(() => {
        textarea.dispatchEvent(event)
      })

      expect(event.defaultPrevented).toBe(true)
      expect(onValueChange).toHaveBeenCalledWith('Hello @alice ')
      expect(textarea.value).toBe('Hello @alice ')
      expect(textarea.getAttribute('aria-expanded')).toBe('false')
    }
  })

  test('ignores canceled or composing Enter events, preserving active suggestions and values', () => {
    const onValueChange = vi.fn()
    const container = document.createElement('div')
    const root = createRoot(container)
    document.body.append(container)
    mounted.push({ container, root })

    act(() => {
      root.render(createElement(Mentions, {
        onValueChange,
        options: ['alice', 'bob']
      }))
    })

    const textarea = requireTextarea(container)
    act(() => {
      setTextareaValue(textarea, 'Hello @al')
    })

    expect(textarea.getAttribute('aria-expanded')).toBe('true')
    const activeOptionBefore = textarea.getAttribute('aria-activedescendant')
    expect(activeOptionBefore).toBeTruthy()
    onValueChange.mockClear()

    const canceledEvent = new KeyboardEvent('keydown', {
      bubbles: true,
      cancelable: true,
      key: 'Enter'
    })
    canceledEvent.preventDefault()

    act(() => {
      textarea.dispatchEvent(canceledEvent)
    })
    expect(onValueChange).not.toHaveBeenCalled()
    expect(textarea.value).toBe('Hello @al')
    expect(textarea.getAttribute('aria-expanded')).toBe('true')
    expect(textarea.getAttribute('aria-activedescendant')).toBe(activeOptionBefore)

    const composingEvent = new KeyboardEvent('keydown', {
      bubbles: true,
      cancelable: true,
      isComposing: true,
      key: 'Enter'
    })

    act(() => {
      textarea.dispatchEvent(composingEvent)
    })
    expect(composingEvent.defaultPrevented).toBe(false)
    expect(onValueChange).not.toHaveBeenCalled()
    expect(textarea.value).toBe('Hello @al')
    expect(textarea.getAttribute('aria-expanded')).toBe('true')
    expect(textarea.getAttribute('aria-activedescendant')).toBe(activeOptionBefore)
  })
})
