// @vitest-environment jsdom
import { act, createElement, StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { expect, test, vi } from 'vitest'

import { useTabs } from './hooks.js'

const run = async (action: () => void) => {
  await act(async () => {
    await Promise.resolve()
    action()
  })
}

test('uncontrolled public setters compose consecutive updates without replaying notifications', async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  const container = document.createElement('div')

  document.body.append(container)
  const root = createRoot(container)
  const changed = vi.fn<(value: string) => void>()
  const Fixture = () => {
    const tabs = useTabs({ defaultValue: 'start', onValueChange: changed })

    return createElement('button', {
      onClick: () => {
        tabs.setValue(previous => `${previous} one`)
        tabs.setValue(previous => `${previous} two`)
      }
    }, tabs.value)
  }

  try {
    await run(() => {
      root.render(createElement(StrictMode, {}, createElement(Fixture)))
    })
    const button = container.querySelector('button')

    if (!button) throw new Error('Expected control')

    await run(() => {
      button.click()
    })
    expect(button.textContent).toBe('start one two')
    expect(changed.mock.calls).toEqual([['start one'], ['start one two']])
    await run(() => {
      button.click()
    })
    expect(button.textContent).toBe('start one two one two')
  } finally {
    await run(() => {
      root.unmount()
    })
    container.remove()
    vi.unstubAllGlobals()
  }
})

test('mixed updates compose locally while controlled setters retain the current prop as authority', async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  const container = document.createElement('div')

  document.body.append(container)
  const root = createRoot(container)
  const changed = vi.fn<(value: string) => void>()
  const Fixture = ({ value }: { value?: string | undefined }) => {
    const tabs = useTabs({ defaultValue: 'a', onValueChange: changed, value })

    return createElement('button', {
      onClick: () => {
        tabs.setValue('replace')
        tabs.setValue(previous => `${previous}+`)
      }
    }, tabs.value)
  }

  try {
    await run(() => {
      root.render(createElement(Fixture))
    })
    const button = container.querySelector('button')

    if (!button) throw new Error('Expected control')

    await run(() => {
      button.click()
    })
    expect(button.textContent).toBe('replace+')
    expect(changed.mock.calls).toEqual([['replace'], ['replace+']])
    await run(() => {
      root.render(createElement(Fixture, { value: 'server' }))
    })
    changed.mockClear()
    await run(() => {
      button.click()
    })
    expect(button.textContent).toBe('server')
    expect(changed.mock.calls).toEqual([['replace'], ['server+']])
    await run(() => {
      root.render(createElement(Fixture, { value: 'external' }))
    })
    changed.mockClear()
    await run(() => {
      button.click()
    })
    expect(changed.mock.calls).toEqual([['replace'], ['external+']])
  } finally {
    await run(() => {
      root.unmount()
    })
    container.remove()
    vi.unstubAllGlobals()
  }
})
