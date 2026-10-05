// @vitest-environment jsdom
import { afterEach, expect, test, vi } from 'vitest'

import { initOptionalMediaControllers } from './runtime/controllers/optional-media.js'

const calls = vi.hoisted(() => ({ comparison: vi.fn(), upload: vi.fn() }))
vi.mock('./runtime/controllers/image-comparison.js', () => ({ initImageComparisonControllers: calls.comparison }))
vi.mock('./runtime/controllers/file-upload.js', () => ({ initFileUploadControllers: calls.upload }))

afterEach(() => {
  document.body.replaceChildren()
  vi.clearAllMocks()
})

test('does not initialize absent media components', async () => {
  document.body.innerHTML = '<button>Save</button>'
  await initOptionalMediaControllers(document)
  expect(calls.comparison).not.toHaveBeenCalled()
  expect(calls.upload).not.toHaveBeenCalled()
})

test.each(['comparison', 'upload'] as const)('initializes only the present %s controller', async kind => {
  document.body.innerHTML = kind === 'comparison' ? '<figure data-ui-image-comparison></figure>' : '<div data-ui-file-upload></div>'
  await initOptionalMediaControllers(document)
  expect(calls[kind]).toHaveBeenCalledExactlyOnceWith(document)
  expect(calls[kind === 'comparison' ? 'upload' : 'comparison']).not.toHaveBeenCalled()
})

test('limits initialization to the supplied navigation scope', async () => {
  document.body.innerHTML = '<figure data-ui-image-comparison></figure><section><div data-ui-file-upload></div></section>'
  const scope = document.querySelector('section')
  if (!scope) throw new Error('Expected scope')
  await initOptionalMediaControllers(scope)
  expect(calls.upload).toHaveBeenCalledExactlyOnceWith(scope)
  expect(calls.comparison).not.toHaveBeenCalled()
})
