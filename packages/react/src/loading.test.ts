import { createElement, type CSSProperties } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

import { describe, expect, test } from 'vitest'

import { Progress as ClientProgress, Skeleton as ClientSkeleton } from './components.js'
import { Progress, Skeleton, Spinner, VisuallyHidden } from './server.js'

const render = (element: Parameters<typeof renderToStaticMarkup>[0]): string => renderToStaticMarkup(element)

describe('Skeleton', () => {
  test('keeps the default shimmer rectangle and is decorative unless named', () => {
    expect(render(createElement(Skeleton))).toBe('<div aria-hidden="true" class="ui-skeleton"></div>')
    expect(render(createElement(Skeleton, { 'aria-label': 'Loading article' })))
      .toBe('<div aria-label="Loading article" class="ui-skeleton" role="status"></div>')
    expect(render(createElement(Skeleton, { 'aria-labelledby': 'loading-title' })))
      .toBe('<div aria-labelledby="loading-title" class="ui-skeleton" role="status"></div>')
  })

  test('preserves explicit ARIA and role overrides', () => {
    expect(render(createElement(Skeleton, { 'aria-hidden': false }))).toBe('<div aria-hidden="false" class="ui-skeleton"></div>')
    expect(render(createElement(Skeleton, { 'aria-label': 'Avatar', role: 'img' })))
      .toBe('<div aria-label="Avatar" class="ui-skeleton" role="img"></div>')
  })

  test('renders shapes, animation, and validated size variables before consumer styles', () => {
    const html = render(createElement(Skeleton, {
      animation: 'pulse',
      className: 'w-24',
      height: 8,
      shape: 'text',
      style: { marginBlock: 4 },
      width: 'var(--PreviewWidth)'
    }))

    expect(html).toBe(
      '<div aria-hidden="true" class="ui-skeleton ui-skeleton--text ui-skeleton--pulse w-24" ' +
      'style="--ui-skeleton-height:8px;--ui-skeleton-width:var(--PreviewWidth);margin-block:4px"></div>'
    )
    expect(render(createElement(Skeleton, { animation: 'none', shape: 'circle', width: 40 })))
      .toBe('<div aria-hidden="true" class="ui-skeleton ui-skeleton--circle ui-skeleton--static" style="--ui-skeleton-width:40px"></div>')
  })

  test('drops unsafe sizes and lets consumer styles win', () => {
    expect(render(createElement(Skeleton, { height: '1rem; background: red' }))).toBe('<div aria-hidden="true" class="ui-skeleton"></div>')
    const consumerStyle: CSSProperties & Record<'--ui-skeleton-height', string> = { '--ui-skeleton-height': '2px' }

    expect(render(createElement(Skeleton, { height: 8, style: consumerStyle })))
      .toBe('<div aria-hidden="true" class="ui-skeleton" style="--ui-skeleton-height:2px"></div>')
  })

  test('composes decorative placeholders inside one named status region', () => {
    const html = render(createElement(
      'div', { 'aria-busy': true, role: 'status' }, createElement(VisuallyHidden, null, 'Loading dashboard'), createElement(Skeleton, { shape: 'circle', width: 40 }), createElement(Skeleton, { shape: 'text', width: '60%' })
    ))

    expect(html.match(/role="status"/gu)).toHaveLength(1)
    expect(html.match(/aria-hidden="true"/gu)).toHaveLength(2)
  })

  test('client and server entry points share the same Skeleton', () => {
    expect(ClientSkeleton).toBe(Skeleton)
  })
})

describe('Spinner', () => {
  test('is decorative unless named', () => {
    expect(render(createElement(Spinner))).toBe('<span aria-hidden="true" class="ui-spinner"></span>')
    expect(render(createElement(Spinner, { 'aria-label': 'Saving' })))
      .toBe('<span aria-label="Saving" class="ui-spinner" role="status"></span>')
    expect(render(createElement(Spinner, { 'aria-label': '   ' })))
      .toBe('<span aria-hidden="true" aria-label="   " class="ui-spinner"></span>')
  })
})

describe('Progress', () => {
  test.each([
    [{ max: Number.NaN, value: 40 }, '100', '40', '40%'],
    [{ max: Number.POSITIVE_INFINITY, value: 40 }, '100', '40', '40%'],
    [{ value: Number.NaN }, '100', '0', '0%'],
    [{ value: Number.POSITIVE_INFINITY }, '100', '0', '0%'],
    [{ max: 200, value: 50 }, '200', '50', '25%'],
    [{}, '100', '0', '0%']
  ])('renders finite ARIA values for %o', (props, max, value, width) => {
    const html = render(createElement(Progress, { 'aria-label': 'Upload', ...props }))

    expect(html).toContain(`aria-valuemax="${max}"`)
    expect(html).toContain(`aria-valuenow="${value}"`)
    expect(html).toContain(`style="width:${width}"`)
    expect(html).not.toMatch(/NaN|Infinity/u)
  })

  test('client and server entry points share the same Progress', () => {
    expect(ClientProgress).toBe(Progress)
  })
})
