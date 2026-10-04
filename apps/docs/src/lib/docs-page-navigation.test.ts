// @vitest-environment jsdom

import { afterEach, expect, test } from 'vitest'

import { collectDocsPageSections, getActivePageSection, normalizePageNavigation } from './docs-page-navigation'

afterEach(() => {
  document.body.replaceChildren()
})

const renderGuide = (html: string): HTMLElement => {
  const root = document.createElement('main')

  root.innerHTML = html

  document.body.append(root)

  return root
}

test('uses authored public section anchors and heading labels', () => {
  const root = renderGuide(`
    <section id="setup"><header><h2 id="setup-title">Set up your framework</h2></header></section>
    <h2 id="api" data-docs-toc-label="API reference">A complete reference to the API</h2>
    <h2>Accessible by default</h2>
  `)

  expect(collectDocsPageSections(root).map(({ id, label }) => ({ id, label }))).toEqual([
    { id: 'setup', label: 'Set up your framework' },
    { id: 'api', label: 'API reference' },
    { id: 'section-accessible-by-default', label: 'Accessible by default' }
  ])
})

test('excludes live examples, navigation, hidden panels, and collapsed content', () => {
  const root = renderGuide(`
    <h2>Usage</h2>
    <div class="framework-example"><h2>Dialog title</h2></div>
    <div class="docs-preview"><h2>Revenue</h2></div>
    <div data-chart-demo="astro"><h2>Chart title</h2></div>
    <figure><h2>Chart summary</h2></figure>
    <div data-docs-toc-ignore><h2>Related components</h2></div>
    <nav><h2>Navigation</h2></nav>
    <div role="tabpanel"><h2>Framework example</h2></div>
    <dialog><h2>Example dialog</h2></dialog>
    <details data-ui-collapsible><summary>More</summary><h2>Advanced example</h2></details>
    <div hidden><h2>Hidden content</h2></div>
    <div aria-hidden="true"><h2>Decorative content</h2></div>
    <h2>API</h2>
  `)

  expect(collectDocsPageSections(root).map(section => section.label)).toEqual(['Usage', 'API'])
})

test('creates stable, collision-free anchors without changing public ids', () => {
  const root = renderGuide(`
    <div id="section-usage"></div>
    <h2>Usage</h2><h2>Usage</h2><h2 id="public-api">API</h2>
    <h2>  Keyboard and focus  </h2><h2> </h2>
  `)
  const first = collectDocsPageSections(root).map(section => section.id)

  expect(first).toEqual(['section-usage-2', 'section-usage-3', 'public-api', 'section-keyboard-and-focus'])
  expect(collectDocsPageSections(root).map(section => section.id)).toEqual(first)
})

test('keeps nested documentation sections distinct', () => {
  const root = renderGuide(`
    <section id="guide"><h2>Guide</h2><h2>Data contracts</h2>
      <section id="accessibility"><h2>Accessibility</h2></section>
    </section>
  `)

  expect(collectDocsPageSections(root).map(section => section.id)).toEqual([
    'guide', 'section-data-contracts', 'accessibility'
  ])
})

test('deduplicates authored navigation and omits empty entries', () => {
  expect(normalizePageNavigation([
    { id: ' setup ', label: ' Set up\n your framework ' },
    { id: 'setup', label: 'Duplicate' },
    { id: '', label: 'No destination' },
    { id: 'empty', label: '  ' },
    { id: 'api', label: 'API' }
  ])).toEqual([{ id: 'setup', label: 'Set up your framework' }, { id: 'api', label: 'API' }])
})

test('tracks the section passing below the measured sticky navigation', () => {
  const sections = [{ id: 'setup', top: -60 }, { id: 'api', top: 140 }, { id: 'accessibility', top: 700 }]

  expect(getActivePageSection(sections, 180)).toBe('api')
  expect(getActivePageSection(sections, 100)).toBe('setup')
  expect(getActivePageSection(sections, 800)).toBe('accessibility')
  expect(getActivePageSection([{ id: 'setup', top: 900 }], 180)).toBe('setup')
  expect(getActivePageSection([], 180)).toBeUndefined()
})
