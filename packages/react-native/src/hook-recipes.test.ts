import { describe, expect, test } from 'vitest'

import {
  createLumenHookToast,
  getNextLumenThemeScheme,
  normalizeLumenHookSelectionOptions,
  updateLumenHookToast
} from './hook-recipes.js'

describe('React Native hook recipes', () => {
  test('normalizes primitive and structured native selection options', () => {
    expect(normalizeLumenHookSelectionOptions([
      'overview',
      { disabled: true, label: 'Activity', value: 'activity' }
    ])).toEqual([
      { label: 'overview', value: 'overview' },
      { disabled: true, label: 'Activity', value: 'activity' }
    ])
  })

  test('toggles between the supported explicit native schemes', () => {
    expect(getNextLumenThemeScheme('light')).toBe('dark')
    expect(getNextLumenThemeScheme('dark')).toBe('light')
  })

  test('creates and updates stable toast records', () => {
    const toast = createLumenHookToast('toast-1', { title: 'Saved' })

    expect(toast).toEqual({ id: 'toast-1', title: 'Saved', variant: 'default' })
    expect(updateLumenHookToast(toast, {
      description: 'Available offline',
      variant: 'success'
    })).toEqual({
      description: 'Available offline',
      id: 'toast-1',
      title: 'Saved',
      variant: 'success'
    })
  })
})
