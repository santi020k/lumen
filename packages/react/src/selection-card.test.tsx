// @vitest-environment jsdom
import { act, createRef, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'

import { afterEach, beforeEach, expect, test, vi } from 'vitest'

import { CheckboxCard, RadioCard } from './selection-card.js'

let container: HTMLDivElement
let root: ReturnType<typeof createRoot>

beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
})

afterEach(() => {
  act(() => {
    root.unmount()
  })
  container.remove()
  vi.unstubAllGlobals()
})

const render = (node: ReactNode) => {
  act(() => {
    root.render(node)
  })
}

const control = (name: string): HTMLInputElement => {
  const input = container.querySelector<HTMLInputElement>(`input[value="${name}"]`)
  if (!input) throw new Error(`Missing ${name} input`)
  return input
}

test('associates visible labels and descriptions without losing external errors or input refs', () => {
  const ref = createRef<HTMLInputElement>()
  render(<CheckboxCard aria-describedby="external-error" description="Monthly release notes" icon={<span>Decorative icon</span>} invalid label="Product updates" name="updates" ref={ref} value="product">Monthly</CheckboxCard>)
  const input = control('product')
  const nameId = input.getAttribute('aria-labelledby') ?? ''
  const descriptionIds = input.getAttribute('aria-describedby')?.split(' ') ?? []

  expect(document.getElementById(nameId)?.textContent).toBe('Product updates')
  expect(descriptionIds).toContain('external-error')
  expect(descriptionIds.some(id => document.getElementById(id)?.textContent === 'Monthly release notes')).toBe(true)
  expect(input.getAttribute('aria-invalid')).toBe('true')
  expect(input.labels).toHaveLength(1)
  expect(ref.current).toBe(input)
  expect(container.querySelector('[data-slot="selection-card-icon"]')?.getAttribute('aria-hidden')).toBe('true')
  expect(input.hasAttribute('invalid')).toBe(false)
  expect(input.hasAttribute('label')).toBe(false)
})

test('preserves native checkbox activation, form values, required validation and reset', () => {
  render(<form><CheckboxCard label="Terms" name="terms" required value="accepted" /></form>)
  const input = control('accepted')
  const form = container.querySelector('form')
  const label = input.labels?.[0]
  if (!form || !label) throw new Error('Missing native form or label')

  expect(form.checkValidity()).toBe(false)
  act(() => {
    label.click()
  })
  expect(input.checked).toBe(true)
  expect(form.checkValidity()).toBe(true)
  expect(new FormData(form).get('terms')).toBe('accepted')
  act(() => {
    form.reset()
  })
  expect(input.checked).toBe(false)
  expect(new FormData(form).has('terms')).toBe(false)
})

test('keeps native radio choices mutually exclusive and disabled choices inactive', () => {
  render(
    <form>
      <fieldset>
        <legend>Plan</legend>
        <RadioCard defaultChecked label="Personal" name="plan" value="personal" />
        <RadioCard label="Team" name="plan" value="team" variant="soft" />
        <RadioCard disabled label="Organization" name="plan" value="organization" />
      </fieldset>
    </form>
  )
  const form = container.querySelector('form')
  if (!form) throw new Error('Missing form')

  act(() => {
    control('team').click()
  })
  expect(control('team').checked).toBe(true)
  expect(control('personal').checked).toBe(false)
  expect(new FormData(form).getAll('plan')).toEqual(['team'])
  act(() => control('organization').labels?.[0]?.click())
  expect(control('organization').checked).toBe(false)
  expect(control('team').checked).toBe(true)
  act(() => {
    form.reset()
  })
  expect(control('personal').checked).toBe(true)
  expect(control('team').checked).toBe(false)
})

test('supports controlled checked state and stable unique IDs across rerenders', () => {
  const onChange = vi.fn()
  render(
    <>
      <CheckboxCard checked={false} label="First" onChange={onChange} value="first" />
      <CheckboxCard label="Second" value="second" />
    </>
  )
  const firstId = control('first').id
  const secondId = control('second').id
  expect(firstId).not.toBe(secondId)
  act(() => {
    control('first').click()
  })
  expect(onChange).toHaveBeenCalledOnce()
  expect(control('first').checked).toBe(false)
  render(
    <>
      <CheckboxCard checked label="First" onChange={onChange} value="first" />
      <CheckboxCard label="Second" value="second" />
    </>
  )
  expect(control('first').checked).toBe(true)
  expect(control('first').id).toBe(firstId)
  expect(control('second').id).toBe(secondId)
})

test('respects explicit accessible names and fieldset disabling', () => {
  render(
    <fieldset disabled>
      <CheckboxCard aria-label="Custom name" label="Visible label" value="custom" />
      <RadioCard aria-labelledby="external-title" label="Visible radio" name="option" value="named" />
    </fieldset>
  )
  expect(control('custom').getAttribute('aria-label')).toBe('Custom name')
  expect(control('custom').hasAttribute('aria-labelledby')).toBe(false)
  expect(control('named').getAttribute('aria-labelledby')).toBe('external-title')
  expect(control('custom').matches(':disabled')).toBe(true)
  act(() => {
    control('custom').click()
  })
  expect(control('custom').checked).toBe(false)
})
