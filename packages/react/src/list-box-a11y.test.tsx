// @vitest-environment jsdom
import { act, StrictMode, useState } from 'react'
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

test('an external label names the visible list and its click focuses the list', async () => {
  await run(() => {
    root.render(
      <>
        <label htmlFor="regions" id="regions-label">Regions</label>
        <ListBox id="regions" name="regions" options={options} />
      </>
    )
  })

  const label = container.querySelector('label')
  const [list] = lists()

  expect(label?.id).not.toBe('')
  expect(list?.getAttribute('aria-labelledby')).toBe(label?.id)

  // jsdom does not move focus on label activation; browsers focus the labelled select, which redirects.
  await run(() => {
    container.querySelector('select')?.focus()
  })
  expect(document.activeElement).toBe(list)
})

test('explicit names and the label prop keep precedence over an external label', async () => {
  await run(() => {
    root.render(
      <>
        <label htmlFor="named">Outside</label>
        <ListBox aria-label="Explicit" id="named" options={options} />
        <label htmlFor="labelled">Outside</label>
        <ListBox id="labelled" label="Own label" options={options} />
      </>
    )
  })

  const [named, labelled] = lists()

  expect(named?.getAttribute('aria-label')).toBe('Explicit')
  expect(named?.hasAttribute('aria-labelledby')).toBe(false)
  expect(labelled?.getAttribute('aria-labelledby')).toBe('labelled-label')
})

test('a wrapping label names the visible list', async () => {
  await run(() => {
    root.render(
      <label>
        Wrapped regions
        <ListBox name="wrapped" options={options} />
      </label>
    )
  })

  const label = container.querySelector('label')

  expect(label?.id).not.toBe('')
  expect(lists()[0]?.getAttribute('aria-labelledby')).toBe(label?.id)
})

const createExternalLabel = (target: string, text: string): HTMLLabelElement => {
  const label = document.createElement('label')

  label.htmlFor = target
  label.textContent = text

  return label
}

test('external labels that mount, change, or leave after first layout keep the list name current', async () => {
  await run(() => {
    root.render(<ListBox id="late" options={options} />)
  })

  const [list] = lists()
  const first = createExternalLabel('late', 'Late')
  const second = createExternalLabel('late', 'Replacement')

  expect(list?.hasAttribute('aria-labelledby')).toBe(false)
  await run(() => {
    document.body.append(first)
  })
  expect(first.id).not.toBe('')
  expect(list?.getAttribute('aria-labelledby')).toBe(first.id)
  await run(() => {
    first.id = 'renamed-label'
  })
  expect(list?.getAttribute('aria-labelledby')).toBe('renamed-label')
  await run(() => {
    first.htmlFor = 'elsewhere'
    document.body.append(second)
  })
  expect(list?.getAttribute('aria-labelledby')).toBe(second.id)
  expect(first.id).toBe('renamed-label')
  await run(() => {
    second.remove()
  })
  expect(list?.hasAttribute('aria-labelledby')).toBe(false)
  // A generated id leaves with the association so a later label cannot duplicate it.
  expect(second.hasAttribute('id')).toBe(false)
  first.remove()
})

test('a later external label never overrides an explicit name', async () => {
  await run(() => {
    root.render(<ListBox aria-label="Explicit" id="explicit-late" options={options} />)
  })

  const label = createExternalLabel('explicit-late', 'Outside')

  await run(() => {
    document.body.append(label)
  })

  const [list] = lists()

  expect(list?.getAttribute('aria-label')).toBe('Explicit')
  expect(list?.hasAttribute('aria-labelledby')).toBe(false)
  label.remove()
})

test('unrelated document mutations do not reread labels, and unmounting releases generated ids', async () => {
  const label = createExternalLabel('quiet', 'Quiet')

  document.body.append(label)
  await run(() => {
    root.render(<ListBox id="quiet" options={options} />)
  })

  const labels = vi.spyOn(HTMLSelectElement.prototype, 'labels', 'get')
  const generatedId = label.id

  expect(lists()[0]?.getAttribute('aria-labelledby')).toBe(generatedId)
  const unrelated = document.createElement('section')

  await run(() => {
    document.body.append(unrelated)

    for (let index = 0; index < 50; index += 1) unrelated.append(document.createElement('div'))

    unrelated.dataset.state = 'changed'
  })
  expect(labels).not.toHaveBeenCalled()
  await run(() => {
    root.unmount()
  })
  expect(label.hasAttribute('id')).toBe(false)
  root = createRoot(container)
  label.remove()
  unrelated.remove()
})

test('StrictMode lists transfer an external label without duplicate ids and keep consumer ids', async () => {
  const owned = createExternalLabel('strict-first', 'Owned')
  const moving = createExternalLabel('strict-first', 'Moving')

  owned.id = 'consumer-label'
  document.body.append(owned, moving)

  const documentIds = () => [...document.querySelectorAll('[id]')].map(element => element.id)
  const hasDuplicateIds = () => new Set(documentIds()).size !== documentIds().length

  await run(() => {
    root.render(
      <StrictMode>
        <ListBox id="strict-first" options={options} />
        <ListBox id="strict-second" options={options} />
      </StrictMode>
    )
  })

  const [first, second] = lists()
  const firstGeneratedId = moving.id

  expect(firstGeneratedId).not.toBe('')
  expect(first?.getAttribute('aria-labelledby')).toBe(`consumer-label ${firstGeneratedId}`)
  expect(second?.hasAttribute('aria-labelledby')).toBe(false)
  expect(hasDuplicateIds()).toBe(false)
  await run(() => {
    moving.htmlFor = 'strict-second'
  })
  expect(first?.getAttribute('aria-labelledby')).toBe('consumer-label')
  expect(moving.id).not.toBe('')
  expect(moving.id).not.toBe(firstGeneratedId)
  expect(second?.getAttribute('aria-labelledby')).toBe(moving.id)
  expect(hasDuplicateIds()).toBe(false)
  await run(() => {
    root.render(
      <StrictMode>
        <ListBox id="strict-first" options={options} />
      </StrictMode>
    )
  })
  expect(moving.hasAttribute('id')).toBe(false)
  expect(first?.getAttribute('aria-labelledby')).toBe('consumer-label')
  await run(() => {
    root.unmount()
  })
  expect(owned.id).toBe('consumer-label')
  expect(moving.hasAttribute('id')).toBe(false)
  expect(hasDuplicateIds()).toBe(false)
  root = createRoot(container)
  owned.remove()
  moving.remove()
})
