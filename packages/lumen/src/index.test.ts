import { describe, expect, test } from 'vitest'

import {
  getLumenRegistryItem,
  lumen,
  lumenComponentNames,
  lumenGlass,
  lumenPackages,
  lumenRegistry} from './index.js'

describe('@santi020k/lumen umbrella package', () => {
  test('exports umbrella metadata and shared package metadata', () => {
    expect(lumen).toEqual({
      name: 'Lumen',
      packageName: '@santi020k/lumen',
      scope: '@santi020k'
    })

    expect(lumenComponentNames).toContain('Button')
    expect(lumenGlass.blur).toBe('18px')

    expect(lumenPackages.some(pkg => pkg.packageName === lumen.packageName)).toBe(true)
  })

  test('exports registry recipes for product surfaces', () => {
    expect(lumenRegistry.items.map(item => item.name)).toEqual([
      'all-components',
      'advanced-fields',
      'scheduler',
      'data-collections',
      'theme-builder',
      'rich-text-editor',
      'ai-docs'
    ])

    expect(getLumenRegistryItem('scheduler')?.components).toEqual([
      'Schedule',
      'Agenda',
      'Calendar',
      'DatePicker'
    ])
  })
})
