import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

import { describe, expect, test } from 'vitest'

import { Table } from './components.js'

describe('record table layout', () => {
  test('retains the scroll layout by default', () => {
    expect(renderToStaticMarkup(createElement(Table))).not.toContain('ui-table-wrap--records')
  })

  test('composes the opt-in record layout with glass, naming, and semantic children', () => {
    const markup = renderToStaticMarkup(createElement(Table, {
      'aria-label': 'Collections',
      glass: 'subtle',
      layout: 'records',
      role: 'region',
      tabIndex: 0
    }, createElement('table', { role: 'table' }, createElement('caption', {}, 'Upcoming collections'))))
    expect(markup).toContain('ui-table-wrap--records')
    expect(markup).toContain('ui-glass-subtle')
    expect(markup).toContain('aria-label="Collections"')
    expect(markup).toContain('<table role="table"><caption>Upcoming collections</caption>')
    expect(markup).not.toContain('layout=')
  })
})
