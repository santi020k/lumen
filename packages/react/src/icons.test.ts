import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

import { describe, expect, test } from 'vitest'

import { Icon as NamedIcon } from './components.js'
import { Icon, Search } from './icons.js'

describe('static React icons', () => {
  test('renders the same SVG and decorative semantics as the named API', () => {
    expect(renderToStaticMarkup(createElement(Icon, { icon: Search, size: 'sm' })))
      .toBe(renderToStaticMarkup(createElement(NamedIcon, { name: 'search', size: 'sm' })))
  })

  test('preserves labels, custom attributes, classes, and nested SVG data', () => {
    const markup = renderToStaticMarkup(createElement(Icon, {
      className: 'consumer-icon',
      icon: {
        name: 'nested',
        node: [['g', {}, [['path', { 'fill-rule': 'evenodd', d: 'M0 0h4v4H0z' }]]]],
        size: 24,
        style: 'fill'
      },
      label: 'Search records',
      title: 'Search'
    }))

    expect(markup).toContain('aria-label="Search records"')
    expect(markup).toContain('role="img"')
    expect(markup).toContain('ui-icon consumer-icon')
    expect(markup).toContain('fill-rule="evenodd"')
    expect(markup).toContain('fill="currentColor"')
    expect(markup).toContain('title="Search"')
  })

  test('supports custom children without a registry and explicit decorative labels', () => {
    const markup = renderToStaticMarkup(createElement(Icon, {
      decorative: true,
      label: 'Not announced'
    }, createElement('svg', { viewBox: '0 0 10 10' })))
    expect(markup).toContain('aria-hidden="true"')
    expect(markup).not.toContain('aria-label')
    expect(markup).toContain('viewBox="0 0 10 10"')
  })
})
