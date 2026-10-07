// @vitest-environment jsdom
import { act, useState } from 'react'
import { createRoot } from 'react-dom/client'

import { afterEach, beforeEach, expect, test, vi } from 'vitest'

import { type LumenReviewResult, useLumenReviewWorkflow } from './review-workflow.js'

let container: HTMLDivElement
let root: ReturnType<typeof createRoot>
const submit = vi.fn<(proposal: { amount: string }) => Promise<LumenReviewResult>>()

const Harness = () => {
  const [revision, setRevision] = useState(0)
  const workflow = useLumenReviewWorkflow({ revision: String(revision), submit, uncertainMessage: 'Check the result before retrying.' })

  return (
    <>
      <output>
        {workflow.status}
        :
        {workflow.message}
      </output>
      <button
        type="button"
        onClick={() => {
          workflow.review({ amount: '100000' })
        }}
      >
        Review
      </button>
      <button
        type="button"
        onClick={() => {
          void workflow.confirm()
        }}
      >
        Confirm
      </button>
      <button
        type="button"
        onClick={() => {
          workflow.edit()
        }}
      >
        Edit
      </button>
      <button
        type="button"
        onClick={() => {
          setRevision(value => value + 1)
        }}
      >
        Change source
      </button>
      <button
        type="button"
        onClick={() => {
          workflow.reconcile({ status: 'success' })
        }}
      >
        Resolve success
      </button>
      <button
        type="button"
        onClick={() => {
          workflow.reconcile({ status: 'failure', message: 'No command was applied.' })
        }}
      >
        Resolve failure
      </button>
    </>
  )
}

const click = async (...names: string[]) => act(async () => {
  for (const name of names) {
    const button = [...container.querySelectorAll('button')].find(item => item.textContent === name)
    if (!button) throw new Error(`Missing ${name}`)
    button.click()
  }
  await Promise.resolve()
})

beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  submit.mockReset().mockResolvedValue({ status: 'success' })
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
  act(() => {
    root.render(<Harness />)
  })
})

afterEach(() => {
  act(() => {
    root.unmount()
  })
  container.remove()
  vi.unstubAllGlobals()
})

test('requires review and invalidates a proposal when its source revision changes', async () => {
  await click('Confirm')
  expect(submit).not.toHaveBeenCalled()
  await click('Review')
  await click('Change source')
  expect(container.querySelector('output')?.textContent).toBe('editing:')
  await click('Confirm')
  expect(submit).not.toHaveBeenCalled()
  await click('Review')
  await click('Confirm')
  expect(submit).toHaveBeenCalledExactlyOnceWith({ amount: '100000' })
  expect(container.querySelector('output')?.textContent).toBe('success:')
  await click('Confirm')
  expect(submit).toHaveBeenCalledTimes(1)
})

test('blocks duplicate confirmation and editing while the command is pending', async () => {
  let finish: ((result: LumenReviewResult) => void) | undefined
  submit.mockImplementation(() => new Promise(resolve => {
    finish = resolve
  }))
  await click('Review')
  await click('Confirm', 'Confirm', 'Edit', 'Review')
  expect(submit).toHaveBeenCalledTimes(1)
  expect(container.querySelector('output')?.textContent).toBe('pending:')
  await act(async () => {
    finish?.({ status: 'success' })
    await Promise.resolve()
  })
  expect(container.querySelector('output')?.textContent).toBe('success:')
})

test('confirmed failures preserve the reviewed command for an explicit retry', async () => {
  submit.mockResolvedValueOnce({ status: 'failure', message: 'Rejected safely.' })
  await click('Review')
  await click('Confirm')
  expect(container.querySelector('output')?.textContent).toBe('failure:Rejected safely.')
  await click('Confirm')
  expect(submit).toHaveBeenNthCalledWith(2, { amount: '100000' })
  expect(container.querySelector('output')?.textContent).toBe('success:')
})

test('unknown outcomes and thrown errors require reconciliation before another submission', async () => {
  submit.mockRejectedValueOnce(new Error('Sensitive backend diagnostics must not reach UI'))
  await click('Review')
  await click('Confirm')
  expect(container.querySelector('output')?.textContent).toBe('uncertain:Check the result before retrying.')
  await click('Confirm', 'Edit', 'Review')
  expect(submit).toHaveBeenCalledTimes(1)
  await click('Resolve failure')
  await click('Confirm')
  expect(submit).toHaveBeenCalledTimes(2)
  await click('Review')
  submit.mockResolvedValueOnce({ status: 'uncertain', message: 'Awaiting confirmation.' })
  await click('Confirm')
  await click('Resolve success', 'Confirm')
  expect(submit).toHaveBeenCalledTimes(3)
  expect(container.querySelector('output')?.textContent).toBe('success:')
})

test('reconciliation never marks a newly edited revision as saved', async () => {
  submit.mockResolvedValueOnce({ status: 'uncertain', message: 'Check status.' })
  await click('Review')
  await click('Confirm')
  await click('Change source')
  expect(container.querySelector('output')?.textContent).toBe('uncertain:Check status.')
  await click('Resolve success')
  expect(container.querySelector('output')?.textContent).toBe('editing:')
})
