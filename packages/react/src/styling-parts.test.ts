import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

import { expect, test } from 'vitest'

import { ThemeToggle, Timeline, TimelineItem } from './components.js'
import { WorldMap } from './world-map.js'

test('compound customization uses public slots across web adapters', () => {
  const timeline = renderToStaticMarkup(createElement(Timeline, null, createElement(TimelineItem, null, 'Milestone')))

  for (const slot of ['timeline', 'timeline-item', 'timeline-item-tail', 'timeline-item-dot', 'timeline-item-content']) {
    expect(timeline).toContain(`data-slot="${slot}"`)
  }
  const toggle = renderToStaticMarkup(createElement(ThemeToggle))

  expect(toggle).toContain('data-slot="theme-toggle-sun"')
  expect(toggle).toContain('data-slot="theme-toggle-moon"')
  const map = renderToStaticMarkup(createElement(WorldMap, { countries: [], label: 'Destinations' }))

  for (const slot of ['world-map', 'world-map-frame', 'world-map-zoom-controls']) expect(map).toContain(`data-slot="${slot}"`)
})
