import { describe, expect, test } from 'vitest'

import {
  getLumenRichTextShortcut,
  isLumenRichTextToggleCommand
} from './rich-text.js'

const shortcut = (
  key: string,
  options: Partial<Parameters<typeof getLumenRichTextShortcut>[0]> = {}
) => getLumenRichTextShortcut({
  altKey: false,
  ctrlKey: true,
  key,
  metaKey: false,
  shiftKey: false,
  ...options
})

describe('rich text helpers', () => {
  test('maps common formatting shortcuts', () => {
    expect(shortcut('b')).toBe('bold')
    expect(shortcut('z', { shiftKey: true })).toBe('redo')
    expect(shortcut('b', { altKey: true })).toBeUndefined()
  })

  test('maps list shortcuts from the physical digit key regardless of the shifted glyph', () => {
    // A real KeyboardEvent for Ctrl+Shift+8 reports `key: '*'` (the shifted
    // glyph on a US layout, and other symbols on other layouts) while `code`
    // stays `'Digit8'` for the physical key across layouts.
    expect(shortcut('*', { code: 'Digit8', shiftKey: true })).toBe('insertUnorderedList')
    expect(shortcut('&', { code: 'Digit7', shiftKey: true })).toBe('insertOrderedList')
    expect(shortcut('8', { shiftKey: true })).toBeUndefined()
  })

  test('identifies commands with pressed state', () => {
    expect(isLumenRichTextToggleCommand('bold')).toBe(true)
    expect(isLumenRichTextToggleCommand('undo')).toBe(false)
  })
})
