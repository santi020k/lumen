// @vitest-environment jsdom
import type { SyntheticEvent } from 'react'
import { act, createElement, StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import { renderToString } from 'react-dom/server'

import { afterEach, expect, test, vi } from 'vitest'

import type { LumenFormWorkflow } from './form-workflow.js'
import { isLumenFormControl, useLumenAsyncCheck, useLumenBeforeUnload, useLumenFieldArray, useLumenFormSteps, useLumenFormWorkflow } from './form-workflow.js'

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
const containers: HTMLElement[] = []
const roots: ReturnType<typeof createRoot>[] = []
const mount = async (fixture: () => ReturnType<typeof createElement>) => {
  const container = document.createElement('div')
  document.body.append(container)
  containers.push(container)
  const root = createRoot(container)
  roots.push(root)
  await act(async () => {
    await Promise.resolve()

    root.render(createElement(StrictMode, {}, createElement(fixture)))
  })
  return { container, root }
}

afterEach(async () => {
  for (const root of roots.splice(0)) await act(async () => {
    await Promise.resolve()

    root.unmount()
  })
  for (const container of containers.splice(0)) container.remove()
  vi.restoreAllMocks()
})

const control = (container: HTMLElement, selector: string): HTMLInputElement => {
  const element = container.querySelector(selector)
  if (!(element instanceof HTMLInputElement)) throw new Error('Missing input fixture')
  return element
}

const input = async (element: HTMLInputElement, value: string) => {
  await act(async () => {
    element.value = value
    element.dispatchEvent(new Event('input', { bubbles: true }))
    await Promise.resolve()
  })
}

test('validates an unnamed required control on its first blur', async () => {
  let current: LumenFormWorkflow | undefined
  const { container } = await mount(() => {
    current = useLumenFormWorkflow()

    return createElement('form', current.formProps, createElement('input', { required: true, 'aria-label': 'Unnamed field' }))
  })
  const field = control(container, 'input')

  expect(field.id).toBe('')

  await act(async () => {
    field.focus()

    field.blur()

    await Promise.resolve()
  })

  if (!current) throw new Error('Missing workflow')

  expect(field.id).toMatch(/^lumen-field-/u)
  expect(current.errors).toEqual([expect.objectContaining({ name: field.id, controlId: field.id, label: 'Unnamed field' })])

  await input(field, 'valid')
  expect(current.errors).toEqual([])
})

test('tracks saved values, revalidates dependent fields and drops removed or disabled errors', async () => {
  let current: LumenFormWorkflow | undefined
  const { container, root } = await mount(() => {
    current = useLumenFormWorkflow({
      dependencies: { first: ['second'] },
      validateValues: form => {
        const first = form.elements.namedItem('first')
        const second = form.elements.namedItem('second')
        return first instanceof HTMLInputElement && second instanceof HTMLInputElement && first.value !== second.value ?
          [{ name: 'second', controlId: 'second', message: 'Values must match' }] :
          []
      }
    })
    return createElement('form', current.formProps, createElement('input', { id: 'first', name: 'first', defaultValue: 'start', required: true }), createElement('input', { id: 'second', name: 'second', defaultValue: 'start', required: true }), createElement('fieldset', { disabled: true }, createElement('input', { id: 'disabled', required: true })))
  })
  const get = () => {
    if (!current) throw new Error('Missing workflow')
    return current
  }
  expect(get().dirty).toBe(false)
  await input(control(container, '#first'), 'changed')
  expect(get().dirty).toBe(true)
  expect(get().errors.map(issue => issue.name)).toEqual(['second'])
  await input(control(container, '#second'), 'changed')
  expect(get().errors).toEqual([])
  await act(async () => {
    await Promise.resolve()

    get().markSaved()
  })
  expect(get().dirty).toBe(false)
  await input(control(container, '#first'), '')
  await act(async () => {
    await Promise.resolve()

    expect(get().validate()).toBe(false)
  })
  expect(document.activeElement).toBe(control(container, '#first'))
  expect(get().errors.map(issue => issue.name)).toEqual(['first', 'second'])
  await act(async () => {
    get().validate(undefined, ['first'])
    await Promise.resolve()
  })
  expect(get().errors.map(issue => issue.name)).toEqual(['first', 'second'])
  control(container, '#second').remove()
  await act(async () => {
    await Promise.resolve()

    get().refresh()
  })
  expect(get().errors.map(issue => issue.name)).toEqual(['first'])
  await act(async () => {
    await Promise.resolve()

    root.unmount()
  })
  roots.splice(roots.indexOf(root), 1)
})

test('respects canceled resets and compares accepted resets against the last saved baseline', async () => {
  let current: LumenFormWorkflow | undefined
  let cancel = true
  const { container } = await mount(() => {
    current = useLumenFormWorkflow()
    return createElement('form', { ...current.formProps,
      onReset: (event: SyntheticEvent<HTMLFormElement>) => {
        if (cancel) event.preventDefault()
        current?.formProps.onReset(event)
      } }, createElement('input', { id: 'reset-value', name: 'value', defaultValue: 'default' }))
  })
  const get = () => {
    if (!current) throw new Error('Missing workflow')
    return current
  }
  const field = control(container, '#reset-value')
  await input(field, 'saved')
  await act(async () => {
    await Promise.resolve()

    get().markSaved()
  })
  await input(field, 'draft')
  await act(async () => {
    field.form?.reset()
    await Promise.resolve()
  })
  expect(field.value).toBe('draft')
  expect(get().dirty).toBe(true)
  cancel = false
  await act(async () => {
    field.form?.reset()
    await Promise.resolve()
  })
  expect(field.value).toBe('default')
  expect(get().dirty).toBe(true)
  await input(field, 'saved')
  expect(get().dirty).toBe(false)
})

test('includes externally associated controls and keeps server field feedback typed', async () => {
  let current: LumenFormWorkflow | undefined
  const { container } = await mount(() => {
    current = useLumenFormWorkflow()
    return createElement('div', {}, createElement('form', { ...current.formProps, id: 'owner' }), createElement('input', { id: 'external', form: 'owner', name: 'external', required: true }))
  })
  const get = () => {
    if (!current) throw new Error('Missing workflow')
    return current
  }
  await act(async () => {
    await Promise.resolve()

    expect(get().validate()).toBe(false)
  })
  expect(get().errors[0]?.controlId).toBe('external')
  await act(async () => {
    await Promise.resolve()

    get().setErrors([{ name: 'external', controlId: 'external', message: 'Already used' }])
  })
  expect(get().errors[0]?.message).toBe('Already used')
  expect(document.activeElement).toBe(control(container, '#external'))
})

test('repeatable rows retain identity and compose batched updates', async () => {
  let rows: ReturnType<typeof useLumenFieldArray<string>> | undefined
  await mount(() => {
    rows = useLumenFieldArray(['one', 'two'])
    return createElement('div')
  })
  const get = () => {
    if (!rows) throw new Error('Missing rows')
    return rows
  }
  const [one, two] = get().items
  if (!one || !two) throw new Error('Missing initial rows')
  let added = ''
  await act(async () => {
    await Promise.resolve()

    added = get().append('three')
    get().move(one.id, 1)
    get().update(two.id, 'updated')
  })
  expect(get().items.map(item => item.value)).toEqual(['updated', 'one', 'three'])
  expect(get().items.map(item => item.id)).toEqual([two.id, one.id, added])
  await act(async () => {
    await Promise.resolve()

    get().remove(one.id)
    get().move('missing', 1)
  })
  expect(get().items.map(item => item.id)).toEqual([two.id, added])
})

test('async checks ignore superseded success, canceled errors and completion after unmount', async () => {
  const requests: { signal: AbortSignal, resolve: (value: string) => void, reject: (cause: Error) => void }[] = []
  let current: ReturnType<typeof useLumenAsyncCheck<string, string>> | undefined
  const { root } = await mount(() => {
    current = useLumenAsyncCheck((_value: string, signal: AbortSignal) => new Promise<string>((resolve, reject) => {
      requests.push({ signal, resolve, reject })
    }))
    return createElement('div')
  })
  const get = () => {
    if (!current) throw new Error('Missing check')
    return current
  }
  await act(async () => {
    await Promise.resolve()

    void get().run('old')
    void get().run('new')
  })
  expect(requests[0]?.signal.aborted).toBe(true)
  await act(async () => {
    requests[1]?.resolve('latest')
    requests[0]?.resolve('obsolete')
    await Promise.resolve()
  })
  expect(get().state).toEqual({ status: 'success', result: 'latest' })
  await act(async () => {
    void get().run('cancel')
    get().cancel()
    requests[2]?.reject(new Error('obsolete'))
    await Promise.resolve()
  })
  expect(get().state).toEqual({ status: 'idle' })
  await act(async () => {
    void get().run('unmount')
    root.unmount()
    requests[3]?.resolve('ignored')
    await Promise.resolve()
  })
  roots.splice(roots.indexOf(root), 1)
  expect(requests[3]?.signal.aborted).toBe(true)
})

test('step navigation validates all skipped steps and allows going back', async () => {
  let valid = false
  const validate = vi.fn<(names: readonly string[]) => boolean>(() => valid)
  let current: ReturnType<typeof useLumenFormSteps> | undefined
  await mount(() => {
    current = useLumenFormSteps([{ id: 'details', fields: ['name'] }, { id: 'terms', fields: ['amount'] }, { id: 'review', fields: [] }], validate)
    return createElement('div')
  })
  const get = () => {
    if (!current) throw new Error('Missing steps')
    return current
  }
  await act(async () => {
    await Promise.resolve()

    expect(get().goTo('review')).toBe(false)
  })
  expect(validate).toHaveBeenLastCalledWith(['name', 'amount'])
  expect(get().activeId).toBe('details')
  valid = true
  await act(async () => {
    await Promise.resolve()

    expect(get().goTo('review')).toBe(true)
  })
  valid = false
  await act(async () => {
    await Promise.resolve()

    expect(get().previous()).toBe(true)
  })
  expect(get().activeId).toBe('terms')
  await act(async () => {
    await Promise.resolve()

    expect(get().goTo('unknown')).toBe(false)
  })
})

test('reload protection only runs while edits are dirty and cleans up', async () => {
  const { root } = await mount(() => {
    useLumenBeforeUnload(true)
    return createElement('div')
  })
  const event = new Event('beforeunload', { cancelable: true })
  window.dispatchEvent(event)
  expect(event.defaultPrevented).toBe(true)
  await act(async () => {
    await Promise.resolve()

    root.unmount()
  })
  roots.splice(roots.indexOf(root), 1)
  const next = new Event('beforeunload', { cancelable: true })
  window.dispatchEvent(next)
  expect(next.defaultPrevented).toBe(false)
})

test('field row labels retain their server-rendered identities during hydration', async () => {
  const Fixture = () => {
    const first = useLumenFieldArray(['First', 'Second'])
    const second = useLumenFieldArray(['Third'])

    return createElement('div', {}, [...first.items, ...second.items].map(item => createElement('div', { key: item.id }, createElement('label', { htmlFor: item.id }, item.value), createElement('input', { id: item.id, defaultValue: item.value }))))
  }
  const container = document.createElement('div')
  container.innerHTML = renderToString(createElement(Fixture))
  document.body.append(container)
  containers.push(container)
  const markup = container.innerHTML
  const errors = vi.spyOn(console, 'error').mockImplementation(() => undefined)
  const recover = vi.fn<(error: unknown) => void>()

  await act(async () => {
    await Promise.resolve()

    roots.push(hydrateRoot(container, createElement(Fixture), { onRecoverableError: recover }))
  })

  expect(container.innerHTML).toBe(markup)
  expect(new Set(Array.from(container.querySelectorAll('input'), input => input.id)).size).toBe(3)
  expect(recover).not.toHaveBeenCalled()
  expect(errors).not.toHaveBeenCalled()
})

test('validates and tracks iframe controls using their own realm', async () => {
  const frame = document.createElement('iframe')
  document.body.append(frame)
  containers.push(frame)
  const doc = frame.contentDocument
  const view = doc?.defaultView
  if (!doc || !view) throw new Error('Missing iframe fixture')
  const container = doc.createElement('div')
  doc.body.append(container)
  const root = createRoot(container)
  roots.push(root)
  let current: LumenFormWorkflow | undefined
  const Fixture = () => {
    current = useLumenFormWorkflow()
    return createElement('form', current.formProps, createElement('input', { id: 'required', name: 'required', required: true }), createElement('input', { id: 'check', name: 'check', type: 'checkbox', defaultChecked: false }), createElement('select', { id: 'select', name: 'select', multiple: true, defaultValue: ['one'] }, createElement('option', { value: 'one' }, 'One'), createElement('option', { value: 'two' }, 'Two')))
  }
  await act(async () => {
    root.render(createElement(Fixture))
    await Promise.resolve()
  })
  const get = () => {
    if (!current) throw new Error('Missing iframe workflow')
    return current
  }
  const required = doc.getElementById('required')
  const checkbox = doc.getElementById('check')
  const select = doc.getElementById('select')
  if (!(required instanceof view.HTMLInputElement) || !(checkbox instanceof view.HTMLInputElement) || !(select instanceof view.HTMLSelectElement)) throw new Error('Missing iframe controls')
  expect(isLumenFormControl(required)).toBe(true)
  expect(isLumenFormControl(new EventTarget())).toBe(false)
  expect(isLumenFormControl(document.implementation.createHTMLDocument('Detached').createElement('input'))).toBe(true)
  await act(async () => {
    expect(get().validate()).toBe(false)
    await Promise.resolve()
  })
  expect(get().errors.map(issue => issue.name)).toEqual(['required'])
  await act(async () => {
    required.value = 'valid'
    required.dispatchEvent(new view.Event('input', { bubbles: true }))
    await Promise.resolve()
  })
  expect(get().dirty).toBe(true)
  await act(async () => {
    expect(get().validate()).toBe(true)
    get().markSaved()
    await Promise.resolve()
  })
  expect(get().dirty).toBe(false)
  await act(async () => {
    checkbox.checked = true
    get().refresh()
    await Promise.resolve()
  })
  expect(get().dirty).toBe(true)
  await act(async () => {
    get().markSaved()
    await Promise.resolve()
  })
  await act(async () => {
    for (const option of select.options) option.selected = option.value === 'two'
    get().refresh()
    await Promise.resolve()
  })
  expect(get().dirty).toBe(true)
})
