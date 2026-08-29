// @vitest-environment jsdom

import type { LumenComboSeries } from '@santi020k/lumen-core'
import { beforeAll, beforeEach, describe, expect, test, vi } from 'vitest'

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
const requiredElement = <ElementType extends Element>(element: ElementType | null): ElementType => {
  if (!element) throw new Error('Expected the rendered element to exist.')

  return element
}

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
    expect(classesOf(connect('lumen-image'))).toEqual([
      'ui-image',
      'ui-image--fit-cover',
      'ui-image--radius-lg'
    ].sort())
    expect(classesOf(connect('lumen-image', { 'invert-on-dark': '' })))
      .toEqual([
        'ui-image',
        'ui-image--fit-cover',
        'ui-image--invert-dark',
        'ui-image--radius-lg'
      ].sort())
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

  test('builds and validates an international phone control from country metadata', () => {
    const phone = connect('lumen-phone-input', {
      country: 'CO',
      locale: 'en-US',
      value: '6015550123'
    })
    const country = phone.querySelector<HTMLSelectElement>('.ui-phone-input__country')
    const number = phone.querySelector<HTMLInputElement>('.ui-phone-input__number')

    expect(country?.options.length).toBeGreaterThan(200)
    expect(country?.value).toBe('CO')
    expect(number?.value.replaceAll(/\D/g, '')).toBe('6015550123')
    expect(phone.dataset.e164).toBe('+576015550123')
    expect(phone.dataset.valid).toBe('true')

    if (!number) throw new Error('Expected generated phone input')

    number.value = '+1 212 555 0123'
    number.dispatchEvent(new Event('input', { bubbles: true }))

    expect(country?.value).toBe('US')
    expect(phone.dataset.e164).toBe('+12125550123')
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

  test('synchronizes progress attributes and the stable indicator part', () => {
    const progress = connect('lumen-progress', { max: '80', value: '40' })
    const indicator = progress.querySelector<HTMLElement>(
      '[data-slot="progress-indicator"]'
    )

    expect(progress.getAttribute('aria-valuemax')).toBe('80')
    expect(progress.getAttribute('aria-valuenow')).toBe('40')
    expect(indicator?.style.width).toBe('50%')

    progress.setAttribute('value', '80')

    expect(progress.getAttribute('aria-valuenow')).toBe('80')
    expect(indicator?.style.width).toBe('100%')
  })

  test('copies arbitrary values and exposes success state', async () => {
    const writeText = vi.fn(() => Promise.resolve())

    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText }
    })

    const copyButton = document.createElement('lumen-copy-button')

    copyButton.setAttribute('value', 'Invite link')
    copyButton.textContent = 'Copy invite'
    document.body.append(copyButton)

    copyButton.click()

    await Promise.resolve()

    expect(writeText).toHaveBeenCalledWith('Invite link')
    expect(copyButton.dataset.state).toBe('copied')
    expect(copyButton.getAttribute('aria-label')).toBe('Copied to clipboard')
    expect(copyButton.dataset.slot).toBe('copy-button')
    expect(copyButton.querySelector('[data-slot="copy-idle"]')?.textContent)
      .toBe('Copy invite')
    expect(copyButton.querySelector('[data-slot="copy-idle"]')?.hasAttribute('hidden')).toBe(true)
    expect(copyButton.querySelector('[data-slot="copy-copied"]')?.textContent)
      .toBe('Copied to clipboard')
    expect(copyButton.querySelector('[data-slot="copy-copied"]')?.hasAttribute('hidden')).toBe(false)
    expect(copyButton.querySelector('[data-slot="copy-error"]')?.textContent)
      .toBe('Could not copy to clipboard')
    expect(copyButton.querySelector('[data-slot="copy-error"]')?.hasAttribute('hidden')).toBe(true)
    expect(classesOf(connect('lumen-copy-button', { size: 'sm', variant: 'default' })))
      .toEqual([
        'ui-button',
        'ui-button--default',
        'ui-button--sm',
        'ui-copy-button'
      ].sort())
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

  test('maps visual size independently from native size', () => {
    expect(classesOf(connect('lumen-native-select'))).toEqual(['ui-select'])
    expect(classesOf(connect('lumen-native-select', { size: 'sm' }))).toEqual(['ui-select'])
    expect(classesOf(connect('lumen-native-select', { 'visual-size': 'lg' })))
      .toEqual(['ui-select', 'ui-select--lg'].sort())
    expect(classesOf(connect('lumen-input', { 'visual-size': 'sm' })))
      .toEqual(['ui-input', 'ui-input--sm'].sort())
    expect(classesOf(connect('lumen-select', { size: 'lg' })))
      .toEqual(['ui-select', 'ui-select--lg'].sort())
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
      series,
      'show-legend': ''
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
          { label: 'React', x: 'react', y: 4 },
          { label: 'Unavailable', x: 'unavailable', y: -2 }
        ],
        id: 'share',
        label: 'Downloads'
      }])
    })
    const sparkline = connect('lumen-sparkline', {
      label: 'Downloads increased from 4 to 8',
      values: '4,8'
    })
    const scatter = connect('lumen-scatter-chart', {
      series: JSON.stringify([{
        data: [{ size: 12, x: 1, y: 4 }, { size: 20, x: 2, y: 8 }],
        id: 'relationship',
        label: 'Relationship'
      }])
    })
    const heatmap = connect('lumen-heatmap', {
      data: JSON.stringify([{ value: 8, x: 'Mon', y: 'Morning' }])
    })
    const range = connect('lumen-range-chart', {
      data: JSON.stringify([{ high: 12, low: 4, x: 'Mon' }])
    })
    const combo = connect('lumen-combo-chart', {
      series: JSON.stringify([
        { data: [{ x: 'Mon', y: 4 }, { x: 'Tue', y: 8 }], id: 'bars', label: 'Bars', mark: 'bar' },
        { data: [{ x: 'Mon', y: 6 }, { x: 'Tue', y: 10 }], id: 'line', label: 'Line', mark: 'line' }
      ])
    })

    expect(bars.getAttribute('role')).toBe('figure')
    expect(bars.querySelectorAll('rect')).toHaveLength(2)
    expect(bars.querySelector('h3')?.textContent).toBe('Package downloads')
    expect(bars.querySelector('details table')?.textContent).toContain('8 downloads')
    expect(bars.querySelector('[data-ui-chart-summary]')?.textContent)
      .toContain('1 series, 2 points')
    expect(line.querySelector('.ui-line-chart__line')).not.toBeNull()
    expect(line.querySelector('.ui-chart__reference')).not.toBeNull()
    expect(pie.querySelectorAll('.ui-pie-chart__slices path')).toHaveLength(2)
    expect(pie.querySelector('[data-ui-chart-summary]')?.textContent)
      .toContain('1 series, 2 points')
    expect(pie.querySelector('.ui-pie-chart__center')?.textContent).toBe('12Total')
    expect(pie.querySelector('details table')?.textContent).toContain('67%')
    expect(sparkline.getAttribute('role')).toBe('img')
    expect(sparkline.getAttribute('aria-label')).toBe('Downloads increased from 4 to 8')
    expect(sparkline.querySelector('.ui-sparkline__line')).not.toBeNull()
    expect(scatter.querySelectorAll('.ui-scatter-chart__marks circle')).toHaveLength(2)
    expect(scatter.querySelector('details table')?.textContent).toContain('Size')
    expect(scatter.querySelector('details table')?.textContent).toContain('20')
    expect(heatmap.querySelectorAll('.ui-heatmap__cells rect')).toHaveLength(1)
    expect(range.querySelector('.ui-range-chart__area')).not.toBeNull()
    expect(combo.querySelector('.ui-bar-chart__marks rect')).not.toBeNull()
    expect(combo.querySelector('.ui-line-chart__line')).not.toBeNull()

    bars.setAttribute('legend-label', 'Localized legend')
    bars.setAttribute('category-label', 'Localized category')
    bars.setAttribute('view-data-label', 'Localized data action')

    expect(requiredElement(bars.querySelector('.ui-chart__legend')).getAttribute('aria-label'))
      .toBe('Localized legend')
    expect(requiredElement(bars.querySelector('details summary')).textContent)
      .toBe('Localized data action')
    expect(requiredElement(bars.querySelector('details thead th')).textContent)
      .toBe('Localized category')
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
      expect(chart.querySelector('[data-ui-chart-summary]')?.textContent)
        .toBe('No chart data available.')
    }
  })

  test('renders programmatic combo series and aligns line marks with bar centers', () => {
    const data = [
      { x: 'Mon', y: 4 },
      { x: 'Tue', y: 8 },
      { x: 'Wed', y: 6 }
    ]

    const series: readonly LumenComboSeries[] = [
      { data, id: 'bars', label: 'Bars', mark: 'bar' },
      { data, id: 'line', label: 'Line', mark: 'line' }
    ]

    const combo = connect('lumen-combo-chart')

    expect(Reflect.set(combo, 'series', series)).toBe(true)

    const categoryCenters = [...combo.querySelectorAll('.ui-bar-chart__marks rect')]
      .map(rectangle => Number(
        (
          Number(rectangle.getAttribute('x')) +
          Number(rectangle.getAttribute('width')) / 2
        ).toFixed(3)
      ))

    const linePath =
      combo.querySelector('.ui-line-chart__line')?.getAttribute('d') ?? ''

    const lineXCoordinates = [...linePath.matchAll(/[LM]\s+(-?\d+(?:\.\d+)?)/gu)]
      .map(match => Number(match[1]))

    expect(categoryCenters).toHaveLength(3)
    expect(lineXCoordinates).toEqual(categoryCenters)
  })

  test('keeps programmatic chart disclosures aligned with finite rendered values', () => {
    const valueFormatter = vi.fn((value: number) => `${value} units`)
    const bars = connect('lumen-bar-chart')

    expect(Reflect.set(bars, 'series', [{
      data: [{ x: 'Mon', y: 4 }, { x: 'Tue', y: Number.NaN }],
      id: 'downloads',
      label: 'Downloads'
    }])).toBe(true)
    expect(Reflect.set(bars, 'valueFormatter', valueFormatter)).toBe(true)

    expect(bars.querySelector('details table')?.textContent).toContain('Not available')
    expect(valueFormatter).toHaveBeenCalledWith(4)
    expect(valueFormatter).not.toHaveBeenCalledWith(Number.NaN)

    valueFormatter.mockClear()

    const scatter = connect('lumen-scatter-chart')

    expect(Reflect.set(scatter, 'series', [{
      data: [
        { size: 12, x: 1, y: 4 },
        { size: Number.POSITIVE_INFINITY, x: 2, y: 8 },
        { x: Number.NaN, y: 100 }
      ],
      id: 'relationship',
      label: 'Relationship'
    }])).toBe(true)
    expect(Reflect.set(scatter, 'valueFormatter', valueFormatter)).toBe(true)

    expect(scatter.querySelectorAll('.ui-scatter-chart__marks circle')).toHaveLength(2)
    expect(scatter.querySelector('[data-ui-chart-summary]')?.textContent)
      .toContain('1 series, 2 points. Values range from 4 to 8.')
    expect(scatter.querySelector('details table')?.textContent).toContain('Not available')
    expect(valueFormatter).not.toHaveBeenCalledWith(Number.POSITIVE_INFINITY)
    expect(valueFormatter).not.toHaveBeenCalledWith(100)
  })

  test('keeps serialized combo marks attached after malformed series', () => {
    const combo = connect('lumen-combo-chart', {
      series: JSON.stringify([
        {},
        {
          data: [{ x: 'Mon', y: 4 }],
          id: 'bars',
          label: 'Bars',
          mark: 'bar'
        }
      ])
    })

    expect(combo.querySelectorAll('.ui-bar-chart__marks rect')).toHaveLength(1)
    expect(combo.querySelector('.ui-line-chart__line')).toBeNull()
  })

  test('omits unavailable heatmap cells while preserving semantic table gaps', () => {
    const data = JSON.stringify([
      { value: 8, x: 'Mon', y: 'Morning' },
      { value: null, x: 'Tue', y: 'Morning' }
    ])

    const heatmap = connect('lumen-heatmap', { data })

    expect(heatmap.querySelectorAll('.ui-heatmap__cells rect')).toHaveLength(1)
    expect(heatmap.querySelector('details table')?.textContent).toContain('Not available')

    heatmap.setAttribute('show-table', 'false')

    expect(heatmap.querySelector('.ui-chart__data')).toBeNull()

    const missingHeatmap = connect('lumen-heatmap', {
      data: JSON.stringify([{ value: null, x: 'Mon', y: 'Morning' }])
    })

    expect(missingHeatmap.querySelector('.ui-chart__empty')?.textContent)
      .toBe('No chart data available.')
    expect(missingHeatmap.querySelector('details table')?.textContent)
      .toContain('Not available')
  })

  test('renders range values in the default semantic table', () => {
    const range = connect('lumen-range-chart', {
      data: JSON.stringify([
        { high: 12, low: 4, x: 'Mon' },
        { high: null, low: null, x: 'Tue' }
      ])
    })

    const table = range.querySelector('details table')

    expect(table?.textContent).toContain('Mon')
    expect(table?.textContent).toContain('4')
    expect(table?.textContent).toContain('12')
    expect(table?.textContent).toContain('Not available')

    range.setAttribute('show-table', 'false')

    expect(range.querySelector('.ui-chart__data')).toBeNull()
  })
})
