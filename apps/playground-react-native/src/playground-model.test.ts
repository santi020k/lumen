import { describe, expect, test } from 'vitest'

import {
  componentCategories,
  componentNames,
  getComponentCategory,
  getVisibleComponentNames,
  isAppDestination,
  isComponentCategory
} from './playground-model.js'

describe('React Native playground model', () => {
  test('assigns every component to exactly one discovery category', () => {
    const categorizedNames = componentCategories.flatMap(category => category.names)

    expect(new Set(categorizedNames).size).toBe(categorizedNames.length)

    expect(componentNames).toEqual(categorizedNames)

    expect(componentNames.every(name => getComponentCategory(name) !== undefined)).toBe(true)
  })

  test('combines category and partial-name discovery for the full catalog', () => {
    expect(getVisibleComponentNames('chart', 'data', false)).toEqual([
      'Line chart',
      'Bar chart',
      'Pie chart',
      'Scatter chart',
      'Waterfall chart',
      'Range chart',
      'Combo chart',
      'Bullet chart',
      'Lollipop chart',
      'Dumbbell chart',
      'Funnel chart'
    ])

    expect(getVisibleComponentNames('', 'actions', false)).toEqual([
      'Button',
      'Button group',
      'Chip',
      'Menu',
      'Share button',
      'Tooltip',
      'Command'
    ])

    expect(getVisibleComponentNames('command', 'actions', false)).toEqual(['Command'])
    expect(getVisibleComponentNames('tooltip', 'actions', false)).toEqual(['Tooltip'])
  })

  test('keeps deterministic embeds exact while ordinary search stays flexible', () => {
    expect(getVisibleComponentNames('Button', 'all', true)).toEqual(['Button'])

    expect(getVisibleComponentNames('Button', 'all', false)).toEqual([
      'Icon button',
      'Button',
      'Button group',
      'Share button'
    ])
  })

  test('accepts component IDs, padded text, and collapsed labels', () => {
    expect(getVisibleComponentNames('  DATE-range_field  ', 'forms', false)).toEqual(['Date range field'])
    expect(getVisibleComponentNames('IconButton', 'all', false)).toEqual(['Icon button'])
    expect(getVisibleComponentNames('lollipop-chart', 'data', true)).toEqual(['Lollipop chart'])
    expect(getVisibleComponentNames('dumbbell-chart', 'data', true)).toEqual(['Dumbbell chart'])
    expect(getVisibleComponentNames('funnel-chart', 'data', true)).toEqual(['Funnel chart'])
    expect(getVisibleComponentNames('  \t ', 'actions', false)).toEqual(getVisibleComponentNames('', 'actions', false))
    expect(getVisibleComponentNames('button', 'forms', false)).toEqual([])
    expect(getVisibleComponentNames('does-not-exist', 'all', false)).toEqual([])
    expect(getVisibleComponentNames('button', 'all', true)).toEqual(['Button'])
  })

  test('recognizes only supported destinations and categories', () => {
    expect(isAppDestination('examples')).toBe(true)

    expect(isAppDestination('about')).toBe(false)

    expect(isComponentCategory('foundations')).toBe(true)

    expect(isComponentCategory('all')).toBe(false)
  })
})
