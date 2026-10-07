// @vitest-environment jsdom
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

import { afterEach, expect, test } from 'vitest'

import { PageHeaderRecipe } from '../../../../packages/lumen/templates/react/page-header/src/lumen/page-header.js'
import { SectionHeaderRecipe } from '../../../../packages/lumen/templates/react/section-header/src/lumen/section-header.js'

afterEach(() => {
  document.body.replaceChildren()
})

test('page headers preserve translated navigation, identity and independent actions', () => {
  document.body.innerHTML = renderToStaticMarkup(createElement(PageHeaderRecipe, {
    title: 'Operaciones de cartera',
    headingId: 'page-title',
    description: 'Revisa la actividad.',
    breadcrumbs: [{ href: '/workspace', label: 'Espacio de trabajo' }],
    breadcrumbLabel: 'Ruta de navegación',
    status: 'Activo',
    actionsLabel: 'Acciones de la página',
    actions: createElement('button', { type: 'button' }, 'Exportar informe')
  }))
  expect(document.querySelector('header')?.getAttribute('aria-labelledby')).toBe('page-title')
  expect(document.querySelector('h1')?.id).toBe('page-title')
  expect(document.querySelector('nav')?.getAttribute('aria-label')).toBe('Ruta de navegación')
  expect(document.querySelector('[aria-current="page"]')?.textContent).toBe('Operaciones de cartera')
  expect(document.querySelector('[role="group"]')?.getAttribute('aria-label')).toBe('Acciones de la página')
  expect(document.querySelector('button')?.closest('a')).toBeNull()
})

test('optional content leaves no action or breadcrumb containers and section counts retain zero', () => {
  document.body.innerHTML = renderToStaticMarkup(createElement(PageHeaderRecipe, { title: 'Workspace', headingId: 'page-title' }))
  expect(document.querySelector('nav')).toBeNull()
  expect(document.querySelector('[role="group"]')).toBeNull()
  expect(document.querySelector('.ui-badge')).toBeNull()
  expect(document.querySelector('p')).toBeNull()
  document.body.innerHTML = renderToStaticMarkup(createElement(SectionHeaderRecipe, { title: 'Records', headingId: 'section-title', level: 3, count: '0 records' }))
  expect(document.querySelector('h3')?.id).toBe('section-title')
  expect(document.querySelector('.ui-badge')?.textContent).toBe('0 records')
  expect(document.querySelector('[role="group"]')).toBeNull()
})
