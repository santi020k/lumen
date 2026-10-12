// @vitest-environment jsdom
import { act, useState } from 'react'
import type { Root } from 'react-dom/client'
import { createRoot } from 'react-dom/client'

import { afterEach, beforeEach, expect, test, vi } from 'vitest'

import { ListBox } from './components.js'

let container: HTMLDivElement
let root: Root

const options = [{ label: 'Amina', value: 'amina' }, { label: 'Bruno', value: 'bruno' }]

const run = async (action: () => void) => {
  await act(async () => {
    action()
    await new Promise(resolve => setTimeout(resolve, 0))
  })
}

beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
})

afterEach(async () => {
  await run(() => {
    root.unmount()
  })
  container.remove()
  vi.unstubAllGlobals()
})

const lists = (): HTMLElement[] => [...container.querySelectorAll<HTMLElement>('[data-ui-list-box-list]')]

test.each(['list', 'ref'] as const)('ListBox focus and blur reach the consumer form callbacks once (%s)', async entry => {
  const focused: string[] = []
  const blurred: string[] = []
  const selectRef: { current: HTMLSelectElement | null } = { current: null }
  await run(() => {
    root.render(
      <form>
        <ListBox
          aria-label="Reviewer"
          name="reviewer"
          onBlur={event => {
            blurred.push(event.currentTarget.name)
          }}
          onFocus={event => {
            focused.push(event.currentTarget.name)
          }}
          options={options}
          ref={selectRef}
        />
        <button type="button">Next</button>
      </form>
    )
  })
  await run(() => {
    if (entry === 'ref') selectRef.current?.focus()
    else lists()[0]?.focus()
  })
  expect(document.activeElement).toBe(lists()[0])
  expect(focused).toEqual(['reviewer'])
  expect(blurred).toEqual([])
  await run(() => {
    container.querySelector<HTMLElement>('[data-value="bruno"]')?.click()
  })
  expect(focused).toEqual(['reviewer'])
  await run(() => {
    container.querySelector('button')?.focus()
  })
  expect(focused).toEqual(['reviewer'])
  expect(blurred).toEqual(['reviewer'])
})

test('an explicit aria-label retains precedence over the visible label', async () => {
  await run(() => {
    root.render(<ListBox aria-label="Choose reviewer" label="Reviewer" options={options} />)
  })
  const [list] = lists()
  expect(list?.getAttribute('aria-label')).toBe('Choose reviewer')
  expect(list?.hasAttribute('aria-labelledby')).toBe(false)
})

test('a consumer focus handler can move focus outside the ListBox', async () => {
  let entries = 0
  await run(() => {
    root.render(
      <>
        <ListBox
          aria-label="Reviewer"
          onFocus={() => {
            entries += 1
            if (entries === 1) container.querySelector('button')?.focus()
          }}
          options={options}
        />
        <button type="button">Next</button>
      </>
    )
  })
  await run(() => {
    lists()[0]?.focus()
  })
  expect(document.activeElement).toBe(container.querySelector('button'))
  expect(entries).toBe(1)
})

test('disabling a previously invalid ListBox clears only generated errors', async () => {
  await run(() => {
    root.render(<ListBox aria-label="Reviewer" options={options} required />)
  })
  await run(() => {
    container.querySelector('select')?.checkValidity()
  })
  expect(lists()[0]?.getAttribute('aria-invalid')).toBe('true')
  await run(() => {
    root.render(<ListBox aria-label="Reviewer" disabled options={options} required />)
  })
  expect(lists()[0]?.hasAttribute('aria-invalid')).toBe(false)
  await run(() => {
    root.render(<ListBox aria-invalid="grammar" aria-label="Reviewer" disabled options={options} required />)
  })
  expect(lists()[0]?.getAttribute('aria-invalid')).toBe('grammar')
})

test('the hidden native select leaves naming and focus to the visible list', async () => {
  await run(() => {
    root.render(<ListBox aria-describedby="hint" aria-label="Reviewer" name="reviewer" options={options} required />)
  })

  const select = container.querySelector('select')
  const [list] = lists()

  expect(select?.getAttribute('aria-hidden')).toBe('true')
  expect(select?.tabIndex).toBe(-1)
  expect(select?.value).toBe('')
  expect(list?.getAttribute('aria-label')).toBe('Reviewer')
  expect(list?.getAttribute('aria-describedby')).toBe('hint')
  expect(list?.getAttribute('aria-required')).toBe('true')
})

test('an unselected required single ListBox is invalid and the first invalid list takes focus', async () => {
  await run(() => {
    root.render(
      <form>
        <ListBox label="First" name="first" options={options} required />
        <ListBox label="Second" name="second" options={options} required />
      </form>
    )
  })

  const form = container.querySelector('form')

  await run(() => {
    expect(form?.reportValidity()).toBe(false)
  })

  const [first, second] = lists()

  expect(document.activeElement).toBe(first)
  expect(first?.getAttribute('aria-invalid')).toBe('true')
  expect(second?.getAttribute('aria-invalid')).toBe('true')
  expect(first?.getAttribute('aria-labelledby')).toBe(container.querySelector('label')?.id)
})

const activeText = (list: HTMLElement | undefined): string | null | undefined => {
  const id = list?.getAttribute('aria-activedescendant')

  return id ? container.querySelector(`[id="${id}"]`)?.textContent : undefined
}

test('the active option starts on the selected option and never rests on disabled ones', async () => {
  const withDisabled = [{ disabled: true, label: 'Amina', value: 'amina' }, { label: 'Bruno', value: 'bruno' }, { label: 'Chen', value: 'chen' }]

  await run(() => {
    root.render(<ListBox aria-label="Reviewer" defaultValue="chen" options={withDisabled} />)
  })

  const [list] = lists()

  expect(activeText(list)).toBe('Chen')

  await run(() => {
    container.querySelector<HTMLElement>('[data-value="amina"]')?.click()
  })
  expect(activeText(list)).toBe('Chen')
  expect(container.querySelector('[data-value="amina"]')?.getAttribute('aria-selected')).toBe('false')

  await run(() => {
    root.render(<ListBox aria-label="Reviewer" defaultValue="chen" options={withDisabled.map(option => ({ ...option, disabled: true }))} />)
  })
  expect(list?.hasAttribute('aria-activedescendant')).toBe(false)

  await run(() => {
    root.render(<ListBox aria-label="Reviewer" options={[]} />)
  })
  expect(list?.hasAttribute('aria-activedescendant')).toBe(false)
})

test('a canceled form reset keeps the ListBox selection; an accepted reset restores the default', async () => {
  await run(() => {
    root.render(
      <form>
        <ListBox aria-label="Reviewer" defaultValue="amina" name="reviewer" options={options} />
      </form>
    )
  })

  const form = container.querySelector('form')
  const selected = () => container.querySelector('[aria-selected="true"]')?.textContent

  await run(() => {
    container.querySelector<HTMLElement>('[data-value="bruno"]')?.click()
  })
  expect(selected()).toBe('Bruno')

  const cancel = (event: Event) => {
    event.preventDefault()
  }

  form?.addEventListener('reset', cancel)
  await run(() => {
    form?.reset()
  })
  expect(selected()).toBe('Bruno')

  form?.removeEventListener('reset', cancel)
  await run(() => {
    form?.reset()
  })
  expect(selected()).toBe('Amina')
  expect(activeText(lists()[0])).toBe('Amina')
})

test('unnamed lists receive distinct option ids', async () => {
  await run(() => {
    root.render(
      <>
        <ListBox aria-label="First" options={options} />
        <ListBox aria-label="Second" options={options} />
      </>
    )
  })

  const ids = [...container.querySelectorAll('[role="option"]')].map(option => option.id)

  expect(new Set(ids).size).toBe(ids.length)
})

test.each([
  { multiple: false, value: 'bruno' },
  { multiple: true, value: ['amina', 'bruno'] }
])('an accepted native reset retains controlled ListBox form values ($multiple)', async ({ multiple, value }) => {
  await run(() => {
    root.render(<form><ListBox aria-label="Reviewer" multiple={multiple} name="reviewer" options={options} value={value} /></form>)
  })
  const form = container.querySelector('form')
  if (!form) throw new Error('Expected form')
  await run(() => {
    form.reset()
  })
  expect(new FormData(form).getAll('reviewer')).toEqual(Array.isArray(value) ? value : [value])
  expect(container.querySelector('[data-value="bruno"]')?.getAttribute('aria-selected')).toBe('true')
})

test('reset uses the latest controlled selection supplied by the consumer reset handler', async () => {
  const Fixture = () => {
    const [value, setValue] = useState('bruno')
    return (
      <form onReset={() => {
        setValue('amina')
      }}
      >
        <ListBox aria-label="Reviewer" name="reviewer" options={options} value={value} />
      </form>
    )
  }
  await run(() => {
    root.render(<Fixture />)
  })
  const form = container.querySelector('form')
  if (!form) throw new Error('Expected form')
  await run(() => {
    form.reset()
  })
  expect(new FormData(form).get('reviewer')).toBe('amina')
  expect(container.querySelector('[data-value="amina"]')?.getAttribute('aria-selected')).toBe('true')
})
