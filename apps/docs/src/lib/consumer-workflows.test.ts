// @vitest-environment jsdom

import { act, createElement } from 'react'
import { createRoot } from 'react-dom/client'

import { Button, Input } from '@santi020k/lumen-react'
import { expect, test } from 'vitest'

import { ValidatedFormRecipe, type ValidatedFormRecipeProps } from '../../../../packages/lumen/templates/react/validated-form/src/lumen/validated-form'

test('consumer form blocks invalid and duplicate submissions, retains failures and clears reset feedback', async () => {
  const container = document.createElement('div')
  const root = createRoot(container)
  let submissions = 0
  let finish: (() => void) | undefined
  const pending = new Promise<void>(resolve => {
    finish = resolve
  })

  document.body.append(container)

  try {
    const props: ValidatedFormRecipeProps = {
      id: 'fixture-form',
      label: 'Synthetic form',
      summaryHeading: 'Review fields',
      failureMessage: 'Retry later',
      successMessage: 'Saved',
      submit: async () => {
        submissions += 1

        await pending

        return [{ controlId: 'fixture-name', name: 'name', message: 'Use another synthetic name.' }]
      },
      children: ({ pending: busy }) => createElement('div', {}, createElement(Input, { id: 'fixture-name', name: 'name', 'aria-label': 'Name', required: true, disabled: busy }), createElement(Button, { type: 'submit', loading: busy }, 'Save'))
    }

    act(() => {
      root.render(createElement(ValidatedFormRecipe, props))
    })

    const form = container.querySelector('form')
    const input = container.querySelector('input')

    if (!form || !input) throw new Error('Missing form fixture')

    await act(async () => {
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))

      await Promise.resolve()
    })

    expect(submissions).toBe(0)
    expect(document.activeElement).toBe(input)

    input.value = 'Synthetic name'

    await act(async () => {
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))

      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))

      await Promise.resolve()
    })

    expect(submissions).toBe(1)
    expect(input.disabled).toBe(true)

    await act(async () => {
      finish?.()

      await pending
    })

    expect(input.value).toBe('Synthetic name')
    expect(input.disabled).toBe(false)
    expect(container.textContent).toContain('Use another synthetic name.')
    expect(document.activeElement).toBe(input)

    act(() => {
      form.reset()
    })

    expect(container.querySelector<HTMLElement>('[data-ui-error-summary]')?.hidden).toBe(true)
  } finally {
    act(() => {
      root.unmount()
    })

    container.remove()
  }
})
