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
    expect(shortcut('8', { shiftKey: true })).toBe('insertUnorderedList')
    expect(shortcut('z', { shiftKey: true })).toBe('redo')
    expect(shortcut('b', { altKey: true })).toBeUndefined()
  })

  test('identifies commands with pressed state', () => {
    expect(isLumenRichTextToggleCommand('bold')).toBe(true)
    expect(isLumenRichTextToggleCommand('undo')).toBe(false)
  })
})
