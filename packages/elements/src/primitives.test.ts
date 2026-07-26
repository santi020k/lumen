// @vitest-environment jsdom

import { beforeAll, beforeEach, describe, expect, test } from 'vitest'

import { defineLumenElements } from './index.js'

beforeAll(() => {
  defineLumenElements(customElements)
})

beforeEach(() => {
  document.body.innerHTML = ''
})

const connect = (tagName: string, attributes: Record<string, string> = {}): HTMLElement => {
  const element = document.createElement(tagName)

  for (const [name, value] of Object.entries(attributes)) {
    element.setAttribute(name, value)
  }

  document.body.append(element)

  return element
}

const classesOf = (element: HTMLElement): string[] => [...element.classList].sort()

describe('@santi020k/lumen-elements primitives', () => {
  test('applies base classes for presentational primitives', () => {
    expect(classesOf(connect('lumen-avatar'))).toEqual(['ui-avatar'])
    expect(classesOf(connect('lumen-skeleton'))).toEqual(['ui-skeleton'])
    expect(classesOf(connect('lumen-kbd'))).toEqual(['ui-kbd'])
    expect(classesOf(connect('lumen-label'))).toEqual(['ui-label'])
    expect(classesOf(connect('lumen-button-group'))).toEqual(['ui-button-group'])
    expect(classesOf(connect('lumen-spinner'))).toEqual(['ui-spinner'])
    expect(classesOf(connect('lumen-accordion'))).toEqual(['ui-accordion'])
  })

  test('maps badge variants to modifier classes', () => {
    expect(classesOf(connect('lumen-badge'))).toEqual(['ui-badge', 'ui-badge--default'].sort())
    expect(classesOf(connect('lumen-badge', { variant: 'secondary' }))).toEqual(['ui-badge', 'ui-badge--secondary'].sort())
    expect(classesOf(connect('lumen-badge', { variant: 'success' }))).toEqual(['ui-badge', 'ui-badge--success'].sort())
  })

  test('opts monochrome images into dark-theme inversion', () => {
    expect(classesOf(connect('lumen-image'))).toEqual(['ui-image'])
    expect(classesOf(connect('lumen-image', { 'invert-on-dark': '' })))
      .toEqual(['ui-image', 'ui-image--invert-dark'].sort())
  })

  test('omits marker modifier for the default variant', () => {
    expect(classesOf(connect('lumen-marker'))).toEqual(['ui-marker'])
    expect(classesOf(connect('lumen-marker', { variant: 'success' }))).toEqual(['ui-marker', 'ui-marker--success'].sort())
  })

  test('maps pill variants to semantic modifier classes', () => {
    expect(classesOf(connect('lumen-pill'))).toEqual(['ui-pill'])
    expect(classesOf(connect('lumen-pill', { variant: 'brand' })))
      .toEqual(['ui-pill', 'ui-pill--brand'].sort())
    expect(classesOf(connect('lumen-pill', { variant: 'outline' })))
      .toEqual(['ui-pill', 'ui-pill--outline'].sort())
  })

  test('marks separator orientation with class and aria attribute defaults', () => {
    const horizontal = connect('lumen-separator')
    const vertical = connect('lumen-separator', { orientation: 'vertical' })

    expect(classesOf(horizontal)).toEqual(['ui-separator', 'ui-separator--horizontal'].sort())
    expect(horizontal.getAttribute('orientation')).toBe('horizontal')
    expect(classesOf(vertical)).toEqual(['ui-separator', 'ui-separator--vertical'].sort())
  })

  test('labels conversation primitives by author', () => {
    expect(classesOf(connect('lumen-message'))).toEqual(['ui-message', 'ui-message--assistant'].sort())
    expect(classesOf(connect('lumen-message', { from: 'user' }))).toEqual(['ui-message', 'ui-message--user'].sort())
    expect(classesOf(connect('lumen-bubble'))).toEqual(['ui-bubble'])
    expect(classesOf(connect('lumen-bubble', { from: 'user' }))).toEqual(['ui-bubble', 'ui-bubble--user'].sort())
  })

  test('sets default attributes on native form primitives', () => {
    const checkbox = connect('lumen-checkbox')
    const toggle = connect('lumen-switch')
    const slider = connect('lumen-slider')
    const textarea = connect('lumen-textarea')

    expect(checkbox.getAttribute('type')).toBe('checkbox')
    expect(classesOf(checkbox)).toEqual(['ui-checkbox'])
    expect(toggle.getAttribute('type')).toBe('checkbox')
    expect(toggle.getAttribute('role')).toBe('switch')
    expect(slider.getAttribute('type')).toBe('range')
    expect(textarea.getAttribute('rows')).toBe('4')
  })

  test('sets landmark and role defaults', () => {
    expect(connect('lumen-breadcrumb').getAttribute('aria-label')).toBe('Breadcrumb')
    expect(connect('lumen-pagination').getAttribute('aria-label')).toBe('Pagination')
    expect(connect('lumen-tag-group').getAttribute('role')).toBe('list')
    expect(connect('lumen-progress').getAttribute('role')).toBe('progressbar')
    const scrollProgress = connect('lumen-scroll-progress')

    expect(scrollProgress.getAttribute('aria-label')).toBe('Reading progress')
    expect(scrollProgress.getAttribute('aria-valuenow')).toBe('0')
    expect(scrollProgress.getAttribute('role')).toBe('progressbar')
    expect(scrollProgress.querySelector('.ui-scroll-progress__bar')).not.toBeNull()
    expect(connect('lumen-radio-group').hasAttribute('data-ui-radio-group')).toBe(true)
    expect(connect('lumen-collapsible').hasAttribute('data-ui-collapsible')).toBe(true)
  })

  test('resolves glass intensity classes on structural surfaces', () => {
    expect(classesOf(connect('lumen-item', { glass: '' }))).toEqual(['ui-item', 'ui-item--glass'].sort())
    expect(classesOf(connect('lumen-item', { glass: 'strong' })))
      .toEqual(['ui-item', 'ui-item--glass', 'ui-glass-strong'].sort())
    expect(classesOf(connect('lumen-scroll-area', { glass: 'subtle' })))
      .toEqual(['ui-scroll-area', 'ui-scroll-area--glass', 'ui-glass-subtle'].sort())
    expect(classesOf(connect('lumen-date-picker', { glass: 'strong' })))
      .toEqual(['ui-date-picker', 'ui-date-picker-field--glass', 'ui-glass-strong', 'ui-input'].sort())
    expect(classesOf(connect('lumen-select', { glass: 'subtle' })))
      .toEqual(['ui-glass-subtle', 'ui-select', 'ui-select-field--glass'].sort())
  })

  test('maps native select size to modifier classes', () => {
    expect(classesOf(connect('lumen-native-select'))).toEqual(['ui-select'])
    expect(classesOf(connect('lumen-native-select', { size: 'sm' }))).toEqual(['ui-select', 'ui-select--sm'].sort())
    expect(classesOf(connect('lumen-select', { size: 'lg' }))).toEqual(['ui-select', 'ui-select--lg'].sort())
  })

  test('reapplies modifier classes when attributes change', () => {
    const badge = connect('lumen-badge', { variant: 'secondary' })

    expect(badge.classList.contains('ui-badge--secondary')).toBe(true)

    badge.setAttribute('variant', 'destructive')

    expect(badge.classList.contains('ui-badge--secondary')).toBe(false)
    expect(badge.classList.contains('ui-badge--destructive')).toBe(true)
  })

  test('maps stat variants and preserves the default surface', () => {
    const defaultStat = connect('lumen-stat')
    const stat = connect('lumen-stat', { variant: 'accent' })

    expect(defaultStat.getAttribute('variant')).toBe('default')
    expect(classesOf(defaultStat)).toEqual(['ui-stat'])
    expect(classesOf(stat)).toEqual(['ui-stat', 'ui-stat--accent'].sort())

    stat.setAttribute('variant', 'glass')

    expect(classesOf(stat)).toEqual(['ui-stat', 'ui-stat--glass'].sort())
  })

  test('renders chart elements from serializable data with accessible tables', () => {
    const series = JSON.stringify([
      {
        data: [
          { x: 'Mon', y: 4 },
          { label: '8 downloads', x: 'Tue', y: 8 }
        ],
        id: 'downloads',
        label: 'Downloads'
      }
    ])
    const bars = connect('lumen-bar-chart', {
      heading: 'Package downloads',
      orientation: 'horizontal',
      series
    })
    const line = connect('lumen-line-chart', {
      'reference-value': '6',
      area: '',
      series
    })
    const pie = connect('lumen-pie-chart', {
      'center-label': 'Total',
      'center-value': '12',
      series: JSON.stringify([{
        data: [
          { label: 'Astro', tone: 'brand', x: 'astro', y: 8 },
          { label: 'React', x: 'react', y: 4 }
        ],
        id: 'share',
        label: 'Downloads'
      }])
    })
    const sparkline = connect('lumen-sparkline', {
      label: 'Downloads increased from 4 to 8',
      values: '4,8'
    })

    expect(bars.getAttribute('role')).toBe('figure')
    expect(bars.querySelectorAll('rect')).toHaveLength(2)
    expect(bars.querySelector('h3')?.textContent).toBe('Package downloads')
    expect(bars.querySelector('details table')?.textContent).toContain('8 downloads')
    expect(line.querySelector('.ui-line-chart__line')).not.toBeNull()
    expect(line.querySelector('.ui-chart__reference')).not.toBeNull()
    expect(pie.querySelectorAll('.ui-pie-chart__slices path')).toHaveLength(2)
    expect(pie.querySelector('.ui-pie-chart__center')?.textContent).toBe('12Total')
    expect(pie.querySelector('details table')?.textContent).toContain('67%')
    expect(sparkline.getAttribute('role')).toBe('img')
    expect(sparkline.getAttribute('aria-label')).toBe('Downloads increased from 4 to 8')
    expect(sparkline.querySelector('.ui-sparkline__line')).not.toBeNull()
  })

  test('renders the empty state when chart series contain no usable data', () => {
    const series = JSON.stringify([{
      data: [],
      id: 'downloads',
      label: 'Downloads'
    }])

    for (const tagName of [
      'lumen-bar-chart',
      'lumen-line-chart',
      'lumen-pie-chart'
    ]) {
      const chart = connect(tagName, { series })

      expect(chart.querySelector('.ui-chart__empty')?.textContent)
        .toBe('No chart data available.')
      expect(chart.querySelector('.ui-chart__plot')).toBeNull()
      expect(chart.querySelector('.ui-chart__data')).toBeNull()
    }
  })
})
