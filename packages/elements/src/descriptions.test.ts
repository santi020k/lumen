import { afterEach, beforeAll, expect, test } from 'vitest'

import { defineLumenElements } from './index.js'

beforeAll(() => {
  defineLumenElements()
})
afterEach(() => {
  document.body.replaceChildren()
})

test('exposes term and definition semantics while preserving rich child markup', () => {
  document.body.innerHTML = '<lumen-descriptions role="group" aria-label="Record details"><lumen-description-item><lumen-description-term id="status-label">Status</lumen-description-term><lumen-description-detail aria-labelledby="status-label"><a href="/records/1">Active record</a></lumen-description-detail></lumen-description-item></lumen-descriptions>'
  const term = document.querySelector('lumen-description-term')
  const detail = document.querySelector('lumen-description-detail')
  expect(term?.getAttribute('role')).toBe('term')
  expect(detail?.getAttribute('role')).toBe('definition')
  expect(detail?.getAttribute('aria-labelledby')).toBe(term?.id)
  expect(detail?.querySelector('a')?.getAttribute('href')).toBe('/records/1')
  expect(detail?.classList.contains('ui-descriptions__detail')).toBe(true)
})
