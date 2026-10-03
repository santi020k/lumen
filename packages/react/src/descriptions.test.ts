// @vitest-environment jsdom
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

import { afterEach, expect, test } from 'vitest'

import { Badge, DescriptionDetail, DescriptionItem, Descriptions, DescriptionTerm, Link } from './components.js'
import { DescriptionDetail as ServerDetail, DescriptionItem as ServerItem, DescriptionTerm as ServerTerm } from './server-components.js'

afterEach(() => {
  document.body.replaceChildren()
})

test('composes rich details within a native definition list alongside array items', () => {
  document.body.innerHTML = renderToStaticMarkup(createElement(Descriptions,
    { items: [{ label: 'Owner', value: 'Example owner' }], columns: 2, 'aria-label': 'Record details' },
    createElement(DescriptionItem, { id: 'status-row' }, createElement(DescriptionTerm, null, 'Status'), createElement(DescriptionDetail, null, createElement(Badge, { variant: 'success' }, 'Active'))),
    createElement(DescriptionItem, null, createElement(DescriptionTerm, null, 'Related record'), createElement(DescriptionDetail, null, createElement(Link, { href: '/records/1' }, 'View record')))))
  const list = document.querySelector('dl')
  expect(list?.children).toHaveLength(3)
  expect(document.querySelectorAll('dt')).toHaveLength(3)
  expect(document.querySelectorAll('dd')).toHaveLength(3)
  expect(document.querySelector('#status-row dd')?.textContent).toBe('Active')
  expect(document.querySelector('dd a')?.getAttribute('href')).toBe('/records/1')
  expect(list?.style.getPropertyValue('--ui-descriptions-columns')).toBe('2')
})

test('server parts preserve native semantics and public styling hooks', () => {
  document.body.innerHTML = renderToStaticMarkup(createElement('dl', null, createElement(ServerItem, null, createElement(ServerTerm, { id: 'amount-label' }, 'Amount'), createElement(ServerDetail, { 'aria-labelledby': 'amount-label' }, createElement('strong', null, '100')))))
  expect(document.querySelector('dt')?.id).toBe('amount-label')
  expect(document.querySelector('dd')?.getAttribute('aria-labelledby')).toBe('amount-label')
  expect(document.querySelector('[data-slot="description-detail"] strong')?.textContent).toBe('100')
})
