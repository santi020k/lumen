// @vitest-environment jsdom
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

import { afterEach, expect, test } from 'vitest'

import { Progress, Skeleton, Spinner, VisuallyHidden } from './server.js'

afterEach(() => {
  document.body.replaceChildren()
})

test('a consumer loading region exposes one status while its placeholders remain decorative', () => {
  document.body.innerHTML = renderToStaticMarkup(createElement(
    'section',
    { 'aria-busy': true, 'aria-label': 'Loading dashboard', role: 'status' },
    createElement(VisuallyHidden, null, 'Loading dashboard'),
    createElement(Skeleton, { style: { width: 40, height: 40, borderRadius: '50%' } }),
    createElement(Skeleton, { style: { width: '80%', height: 8 } }),
    createElement(Spinner)
  ))

  expect(document.querySelectorAll('[role="status"]')).toHaveLength(1)

  for (const placeholder of document.querySelectorAll('.ui-skeleton, .ui-spinner')) {
    expect(placeholder.getAttribute('aria-hidden')).toBe('true')
  }
})

test('a named standalone Skeleton has status semantics in server-rendered React output', () => {
  document.body.innerHTML = renderToStaticMarkup(createElement(Skeleton, {
    'aria-label': 'Loading article',
    style: { height: 96 }
  }))

  const status = document.querySelector('[role="status"]')
  expect(status?.getAttribute('aria-label')).toBe('Loading article')
  expect(status?.hasAttribute('aria-hidden')).toBe(false)
})

test.each([
  { max: 100, value: Number.NaN },
  { max: Number.POSITIVE_INFINITY, value: 20 },
  { max: Number.POSITIVE_INFINITY, value: Number.POSITIVE_INFINITY }
])('Progress keeps invalid numeric input out of rendered ARIA and styles: %j', props => {
  const html = renderToStaticMarkup(createElement(Progress, {
    ...props,
    'aria-label': 'Import progress'
  }))
  document.body.innerHTML = html

  const progress = document.querySelector('[role="progressbar"]')
  const value = Number(progress?.getAttribute('aria-valuenow'))
  const max = Number(progress?.getAttribute('aria-valuemax'))
  expect(Number.isFinite(value)).toBe(true)
  expect(Number.isFinite(max)).toBe(true)
  expect(max).toBeGreaterThan(0)
  expect(value).toBeGreaterThanOrEqual(0)
  expect(value).toBeLessThanOrEqual(max)
  expect(html).not.toMatch(/NaN|Infinity/)
})
